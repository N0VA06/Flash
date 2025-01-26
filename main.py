from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import tempfile
import os
import json
import plotly
from typing import Dict
import cv2
import numpy as np
from plotly.subplots import make_subplots
import plotly.graph_objects as go
from dataclasses import dataclass
from typing import List, Tuple, Dict , Optional
from ultralytics import YOLO
import google.generativeai as genai
import aiofiles
import httpx
import tempfile
import base64
from pathlib import Path
import ffmpeg 
import os

@dataclass
class PhysicsConstants:
    MOUND_TO_PLATE: float = 18.44  # 60'6" in meters
    PIXELS_TO_METERS: float = None  # Will be calculated based on video width
    GRAVITY: float = 9.81  # m/s^2

class BaseballTracker:
    def __init__(self, model_path: str, video_path: str):
        self.model = YOLO(model_path)
        self.cap = cv2.VideoCapture(video_path)
        self.constants = PhysicsConstants()
        
        # Video properties
        self.frame_width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        self.frame_height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        self.fps = self.cap.get(cv2.CAP_PROP_FPS)
        
        # Calculate scaling factor (pixels to meters)
        self.constants.PIXELS_TO_METERS = self.constants.MOUND_TO_PLATE / self.frame_width
        
        # Trajectory storage
        self.trajectory_points = []
        self.time_points = []
        self.velocities = []
        
    def process_frame(self, frame, timestamp: float) -> Tuple[np.ndarray, bool]:
        """Process a single frame and track the ball"""
        results = self.model(frame)
        ball_detected = False
        
        for result in results:
            boxes = result.boxes
            for box in boxes:
                confidence = box.conf[0].cpu().numpy()
                if confidence > 0.5:
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    center_x = (x1 + x2) / 2
                    center_y = (y1 + y2) / 2
                    
                    if len(self.trajectory_points) == 0 or self._is_valid_movement(center_x, center_y):
                        self.trajectory_points.append((center_x, center_y))
                        self.time_points.append(timestamp)
                        ball_detected = True
                    
                    # Draw detection and trajectory
                    cv2.circle(frame, (int(center_x), int(center_y)), 5, (0, 255, 0), -1)
                    if len(self.trajectory_points) > 1:
                        for i in range(1, len(self.trajectory_points)):
                            pt1 = (int(self.trajectory_points[i-1][0]), int(self.trajectory_points[i-1][1]))
                            pt2 = (int(self.trajectory_points[i][0]), int(self.trajectory_points[i][1]))
                            cv2.line(frame, pt1, pt2, (255, 0, 0), 2)
        
        return frame, ball_detected

    def _is_valid_movement(self, x: float, y: float, max_pixel_jump: float = 100) -> bool:
        """Check if the movement between frames is reasonable"""
        if not self.trajectory_points:
            return True
            
        last_x, last_y = self.trajectory_points[-1]
        distance = np.sqrt((x - last_x)**2 + (y - last_y)**2)
        return distance < max_pixel_jump

    def calculate_instantaneous_velocity(self, i: int) -> float:
        """Calculate velocity between consecutive points"""
        if i < 1 or i >= len(self.trajectory_points):
            return 0.0
            
        p1 = np.array(self.trajectory_points[i-1])
        p2 = np.array(self.trajectory_points[i])
        t1 = self.time_points[i-1]
        t2 = self.time_points[i]
        
        dx = (p2[0] - p1[0]) * self.constants.PIXELS_TO_METERS
        dy = (p2[1] - p1[1]) * self.constants.PIXELS_TO_METERS
        dt = t2 - t1
        
        if dt == 0:
            return 0.0
            
        velocity = np.sqrt(dx**2 + dy**2) / dt
        return velocity * 2.23694  # Convert to mph

    def calculate_pitch_metrics(self) -> Dict:
        """Calculate pitch metrics using initial velocity"""
        if len(self.trajectory_points) < 2:
            return {}
            
        velocities = [self.calculate_instantaneous_velocity(i) 
                     for i in range(1, len(self.trajectory_points))]
        
        valid_velocities = [v for v in velocities if v > 20 and v < 120]
        
        if not valid_velocities:
            return {}
        
        pitch_speed = max(valid_velocities[:min(5, len(valid_velocities))])
        
        start_x, start_y = self.trajectory_points[0]
        end_x, end_y = self.trajectory_points[-1]
        
        dx = (end_x - start_x) * self.constants.PIXELS_TO_METERS
        dy = (end_y - start_y) * self.constants.PIXELS_TO_METERS
        
        angle = np.degrees(np.arctan2(-dy, dx))
        
        return {
            'velocity_mph': pitch_speed,
            'angle': angle,
            'vertical_displacement_ft': dy * 3.28084
        }

    def plot_trajectories(self):
        """Create interactive Plotly visualizations of the ball trajectory"""
        if len(self.trajectory_points) < 2:
            print("Not enough trajectory points to plot")
            return
            
        points = np.array(self.trajectory_points)
        times = np.array(self.time_points)
        
        # Convert to feet and flip y-axis
        x_feet = points[:, 0] * self.constants.PIXELS_TO_METERS * 3.28084
        y_feet = (self.frame_height - points[:, 1]) * self.constants.PIXELS_TO_METERS * 3.28084
        
        # Estimate z-coordinate using parabolic motion
        z_feet = np.linspace(0, 2, len(x_feet))  # Simulate some lateral movement
        
        # Calculate velocities
        velocities = [self.calculate_instantaneous_velocity(i) 
                     for i in range(1, len(self.trajectory_points))]
        
        # Create subplots
        fig = make_subplots(
            rows=2, cols=2,
            specs=[[{'type': 'scatter3d'}, {'type': 'scatter'}],
                  [{'type': 'scatter'}, {'type': 'scatter'}]],
            subplot_titles=('3D Trajectory', 'Top View', 
                          'Side View', 'Velocity Profile')
        )
        
        # 3D Trajectory
        fig.add_trace(
            go.Scatter3d(
                x=x_feet,
                y=z_feet,
                z=y_feet,
                mode='markers+lines',
                marker=dict(
                    size=5,
                    color=times,
                    colorscale='Viridis',
                    showscale=True,
                    colorbar=dict(title='Time (s)')
                ),
                line=dict(color='red', width=2),
                name='Ball Trajectory'
            ),
            row=1, col=1
        )
        
        # Add strike zone to 3D plot
        sz_height = [1.5, 3.5]  # Strike zone height range (feet)
        sz_width = [-0.83, 0.83]  # Strike zone width range (feet)
        sz_distance = max(x_feet)  # At home plate
        
        # Create strike zone vertices
        vertices = np.array([
            [sz_distance, sz_width[0], sz_height[0]],
            [sz_distance, sz_width[1], sz_height[0]],
            [sz_distance, sz_width[1], sz_height[1]],
            [sz_distance, sz_width[0], sz_height[1]],
            [sz_distance, sz_width[0], sz_height[0]]
        ])
        
        fig.add_trace(
            go.Scatter3d(
                x=vertices[:, 0],
                y=vertices[:, 1],
                z=vertices[:, 2],
                mode='lines',
                line=dict(color='black', width=3),
                name='Strike Zone'
            ),
            row=1, col=1
        )
        
        # Top View
        fig.add_trace(
            go.Scatter(
                x=x_feet,
                y=z_feet,
                mode='markers+lines',
                marker=dict(
                    color=times,
                    colorscale='Viridis',
                    showscale=False
                ),
                name='Top View'
            ),
            row=1, col=2
        )
        
        # Side View
        fig.add_trace(
            go.Scatter(
                x=x_feet,
                y=y_feet,
                mode='markers+lines',
                marker=dict(
                    color=times,
                    colorscale='Viridis',
                    showscale=False
                ),
                name='Side View'
            ),
            row=2, col=1
        )
        
        # Velocity Profile
        fig.add_trace(
            go.Scatter(
                x=times[1:],
                y=velocities,
                mode='lines',
                name='Velocity',
                line=dict(color='red')
            ),
            row=2, col=2
        )
        
        # Update layout
        fig.update_layout(
            title='Baseball Trajectory Analysis',
            scene=dict(
                xaxis_title='Distance from Pitcher (feet)',
                yaxis_title='Lateral Movement (feet)',
                zaxis_title='Height (feet)',
                camera=dict(
                    up=dict(x=0, y=0, z=1),
                    center=dict(x=0, y=0, z=0),
                    eye=dict(x=-1.5, y=-1.5, z=1.5)
                )
            ),
            showlegend=True,
            height=1000
        )
        
        # Update 2D subplot axes
        fig.update_xaxes(title_text='Distance (feet)', row=1, col=2)
        fig.update_yaxes(title_text='Lateral Movement (feet)', row=1, col=2)
        
        fig.update_xaxes(title_text='Distance (feet)', row=2, col=1)
        fig.update_yaxes(title_text='Height (feet)', row=2, col=1)
        
        fig.update_xaxes(title_text='Time (seconds)', row=2, col=2)
        fig.update_yaxes(title_text='Velocity (mph)', row=2, col=2)
        
        fig.show()

    def analyze_video(self):
        """Analyze video for first 6 seconds"""
        frame_count = 0
        
        while self.cap.isOpened():
            ret, frame = self.cap.read()
            if not ret:
                break
                
            timestamp = frame_count / self.fps
            
            frame, ball_detected = self.process_frame(frame, timestamp)
            
            if ball_detected and len(self.trajectory_points) >= 2:
                metrics = self.calculate_pitch_metrics()
                
                if metrics:
                    cv2.putText(frame, f"Speed: {metrics.get('velocity_mph', 0):.1f} mph", 
                              (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
                    cv2.putText(frame, f"Angle: {metrics.get('angle', 0):.1f}°", 
                              (10, 70), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
                    cv2.putText(frame, f"Vertical: {metrics.get('vertical_displacement_ft', 0):.1f} ft", 
                              (10, 110), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            
            cv2.imshow('Baseball Analysis', frame)
            
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
                
            frame_count += 1
            if timestamp >= 10.0:
                break
        
        self.cap.release()
        cv2.destroyAllWindows()
        
        print("Generating interactive plots...")
        self.plot_trajectories()
        
app = FastAPI(title="Baseball 3D Trajectory API",
             description="API for generating 3D trajectory plots of baseball pitches")
origins = [
    "http://localhost:3000",  # Replace with your frontend URL
    "http://localhost:8000",  # If your frontend and backend are on the same origin during development
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)
class TrajectoryResponse(BaseModel):
    plot_3d: Dict

def generate_3d_plot(tracker: BaseballTracker) -> Dict:
    """Generate 3D trajectory plot and return as JSON-serializable dict"""
    if len(tracker.trajectory_points) < 2:
        raise ValueError("Not enough trajectory points to plot")
    points = np.array(tracker.trajectory_points)
    times = np.array(tracker.time_points)
        
        # Convert to feet and flip y-axis
    x_feet = points[:, 0] * tracker.constants.PIXELS_TO_METERS * 3.28084
    y_feet = (tracker.frame_height - points[:, 1]) * tracker.constants.PIXELS_TO_METERS * 3.28084
        
        # Estimate z-coordinate using parabolic motion
    z_feet = np.linspace(0, 2, len(x_feet))  # Simulate some lateral movement
        
        # Calculate velocities
    velocities = [tracker.calculate_instantaneous_velocity(i) 
                     for i in range(1, len(tracker.trajectory_points))]
        
        # Create subplots
    fig = make_subplots(
            rows=2, cols=2,
            specs=[[{'type': 'scatter3d'}, {'type': 'scatter'}],
                  [{'type': 'scatter'}, {'type': 'scatter'}]],
            subplot_titles=('3D Trajectory', 'Top View', 
                          'Side View', 'Velocity Profile')
        )
        
        # 3D Trajectory
    fig.add_trace(
            go.Scatter3d(
                x=x_feet,
                y=z_feet,
                z=y_feet,
                mode='markers+lines',
                marker=dict(
                    size=5,
                    color=times,
                    colorscale='Viridis',
                    showscale=True,
                    colorbar=dict(title='Time (s)')
                ),
                line=dict(color='red', width=2),
                name='Ball Trajectory'
            ),
            row=1, col=1
        )
        
        # Add strike zone to 3D plot
    sz_height = [1.5, 3.5]  # Strike zone height range (feet)
    sz_width = [-0.83, 0.83]  # Strike zone width range (feet)
    sz_distance = max(x_feet)  # At home plate
        
        # Create strike zone vertices
    vertices = np.array([
            [sz_distance, sz_width[0], sz_height[0]],
            [sz_distance, sz_width[1], sz_height[0]],
            [sz_distance, sz_width[1], sz_height[1]],
            [sz_distance, sz_width[0], sz_height[1]],
            [sz_distance, sz_width[0], sz_height[0]]
        ])
        
    fig.add_trace(
            go.Scatter3d(
                x=vertices[:, 0],
                y=vertices[:, 1],
                z=vertices[:, 2],
                mode='lines',
                line=dict(color='black', width=3),
                name='Strike Zone'
            ),
            row=1, col=1
        )
        
        # Top View
    fig.add_trace(
            go.Scatter(
                x=x_feet,
                y=z_feet,
                mode='markers+lines',
                marker=dict(
                    color=times,
                    colorscale='Viridis',
                    showscale=False
                ),
                name='Top View'
            ),
            row=1, col=2
        )
        
        # Side View
    fig.add_trace(
            go.Scatter(
                x=x_feet,
                y=y_feet,
                mode='markers+lines',
                marker=dict(
                    color=times,
                    colorscale='Viridis',
                    showscale=False
                ),
                name='Side View'
            ),
            row=2, col=1
        )
        
        # Velocity Profile
    fig.add_trace(
            go.Scatter(
                x=times[1:],
                y=velocities,
                mode='lines',
                name='Velocity',
                line=dict(color='red')
            ),
            row=2, col=2
        )
        
        # Update layout
    fig.update_layout(
            title='Baseball Trajectory Analysis',
            scene=dict(
                xaxis_title='Distance from Pitcher (feet)',
                yaxis_title='Lateral Movement (feet)',
                zaxis_title='Height (feet)',
                camera=dict(
                    up=dict(x=0, y=0, z=1),
                    center=dict(x=0, y=0, z=0),
                    eye=dict(x=-1.5, y=-1.5, z=1.5)
                )
            ),
            showlegend=True,
            height=1000
        )
    
    return json.loads(plotly.utils.PlotlyJSONEncoder().encode(fig))
@app.post("/trajectory-3d", response_model=TrajectoryResponse)
async def get_trajectory_plot(
    video: UploadFile = File(...),
    model_path: str = "./models/best.pt"
):
    """
    Generate a 3D trajectory plot from a baseball pitch video.
    
    Args:
        video: Video file containing the baseball pitch
        model_path: Path to the YOLO model weights
    
    Returns:
        TrajectoryResponse containing the 3D plot data
    """
    video_path = None
    try:
        # Save uploaded video to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as temp_video:
            contents = await video.read()
            temp_video.write(contents)
            video_path = temp_video.name

        # Initialize tracker
        tracker = BaseballTracker(model_path=model_path, video_path=video_path)
        
        # Process video
        frame_count = 0
        while tracker.cap.isOpened():
            ret, frame = tracker.cap.read()
            if not ret:
                break
                
            timestamp = frame_count / tracker.fps
            _, ball_detected = tracker.process_frame(frame, timestamp)
            
            frame_count += 1
            if timestamp >= 6.0:  # Process first 6 seconds
                break
        
        tracker.cap.release()
        
        # Generate 3D plot
        try:
            plot_json = generate_3d_plot(tracker)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        
        return TrajectoryResponse(plot_3d=plot_json)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if video_path and os.path.exists(video_path):
            os.unlink(video_path)




TEMP_DIR = Path("./temp_frames")

# Function to extract frames from the video
def extract_frames(video_path: str, timestamps: list) -> dict:
    frames = {}
    cap = cv2.VideoCapture(video_path)
    
    if not cap.isOpened():
        raise Exception("Could not open video.")
    
    # Get the frame rate (fps) of the video
    fps = cap.get(cv2.CAP_PROP_FPS)
    
    # Ensure TEMP_DIR exists
    if not TEMP_DIR.exists():
        TEMP_DIR.mkdir(parents=True)
    
    for timestamp in timestamps:
        # Convert timestamp to frame number
        frame_number = int(timestamp * fps)
        
        # Set the position to the frame number
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_number)
        
        ret, frame = cap.read()
        if ret:
            # Save the frame to a temporary file
            frame_path = TEMP_DIR / f"frame_{timestamp}.png"
            cv2.imwrite(str(frame_path), frame)
            frames[timestamp] = frame_path
        else:
            frames[timestamp] = None
    
    cap.release()
    return frames

# Function to send frames to gemini-analyse (which expects file paths)
def send_to_gemini(frame_paths: dict) -> dict:
    # Assuming gemini-analyse is a function that processes local file paths
    try:
        # Pass the local file paths to gemini-analyse
        gemini_response = gemini_analyse(frame_paths)
        return gemini_response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing with Gemini: {str(e)}")

# Mock-up of the gemini-analyse function that processes local files
def gemini_analyse(frame_paths: dict) -> dict:
    # Here you would call the actual gemini-analyse processing
    # For now, let's mock a response
    result = {timestamp: {"status": "processed", "file": str(path)} for timestamp, path in frame_paths.items()}
    return result
 
# FastAPI endpoint to accept video and process it
@app.post("/gemini-analyse")
async def gemini_analyse_endpoint(video: UploadFile = File(...)):
    # Save the video file temporarily
    video_path = f"./{video.filename}"
    with open(video_path, "wb") as f:
        f.write(await video.read())
    
    # Timestamps at which we want to extract frames
    timestamps = [4, 5, 8, 11, 15, 20]
    
    try:
        # Extract frames from video and save to local files
        frame_paths = extract_frames(video_path, timestamps)
        
        # Send the frame paths to Gemini for analysis
        gemini_response = send_to_gemini(frame_paths)
        
        # Clean up the saved video file after processing
        os.remove(video_path)
        
        # Clean up temporary frame images
        for path in frame_paths.values():
            if path is not None:
                os.remove(path)
        
        # Return the response from Gemini
        return JSONResponse(content=gemini_response)
    
    except Exception as e:
        os.remove(video_path)
        # Clean up any frames in case of an error
        for path in frame_paths.values():
            if path is not None:
                os.remove(path)
        raise HTTPException(status_code=500, detail=str(e))
    

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
    genai.configure(api_key="AIzaSyA22Xtq5hLg_m4zIXluJyUwve1BtYgVCrw")
    model = genai.GenerativeModel('gemini-1.5-pro')
