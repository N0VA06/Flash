# Google Cloud x MLB Hackathon
## Flash
![Googlemlb drawio](https://github.com/user-attachments/assets/9f20b48c-25eb-4ebf-ba04-921db1904ceb)
## Inspiration
Imagine watching an iconic baseball game from the past—the crack of the bat, the roar of the crowd, the tension in the air. Now, picture being able to instantly know the pitch speed, the exit velocity of a home run, and the advanced stats behind those unforgettable moments, even though those metrics weren’t recorded at the time.

I chose this topic because it was the most challenging out of all the options, and I was driven to tackle something that pushes the limits of technology and innovation. Baseball’s history is rich with legendary games, yet we’ve never had the chance to analyze them with the same depth as modern games. By extracting Statcast data like pitch speed and exit velocity from old videos using computer vision, this tool can help bring those historical moments into the data-driven world we live in today. It’s a way to bridge the gap between the past and present, preserving the magic of baseball while creating new insights that honor its legacy.


## What it does
Flash not only extracts key statistics, like exit velocity, but also enhances your ability to interact with the video and obtain advanced analytics from it. By analyzing the footage in real-time, it provides deeper insights into player performance, including areas for improvement. For example, the prompt section below offers specific recommendations on how a player can elevate their game. 

Flash delivers actionable feedback to help players progress and refine their skills. With this level of interaction, you can gain a comprehensive understanding of player behavior, pinpoint areas for growth, and optimize overall performance.

## How we built it
To create our ball tracking and analytics system, we combined some pretty powerful tech to make everything work smoothly.

1. **Gemini**: The Brain of the Operation  -
At the heart of everything is Gemini, which acts like the brain of our system. It's responsible for crunching all the data, making sense of it, and then giving us meaningful insights. Gemini keeps everything running, analyzing the ball’s movement, and helping us understand what’s happening in real time.

2. **YOLOv11**: Tracking the Ball   - 
For actually tracking the ball, we turned to YOLOv11, a super fast and smart model that can detect objects in real-time. As soon as the ball enters the frame, YOLOv11 spots it and tracks its movement, frame by frame, without missing a beat. It’s like having a hawk’s eye on the ball, making sure we always know exactly where it is.

3. **Plotly** : Bringing the Data to Life  -
After we’ve got the data from the ball tracking, we use plotting tools to visualize everything. These tools help us turn the raw data into charts or graphs, showing things like the ball’s speed or trajectory. It’s like seeing the ball’s journey in a way that’s easy to understand, helping us find patterns and predict what might happen next.


## Challenges we ran into
**Inconsistent Camera Angles**: The varying camera angles throughout the video made it difficult to maintain a consistent reference point for tracking the ball’s movement, resulting in inaccuracies in its path.

**Intermittent Visibility of the Ball**: The ball was not visible in every frame, leading to gaps in the tracking data. This made it harder to follow the ball’s continuous motion and impacted the accuracy of analysis.

**Difficulty in Calculating Velocity**: Due to the inconsistent visibility and camera angles, calculating the ball’s velocity was challenging. Missing frames and perspective shifts caused uncertainty in measuring the speed of the ball at different points.

**Challenges in Estimating Distance Traveled**: The gaps in the ball’s visibility and the lack of consistent tracking information made it difficult to accurately calculate the total distance the ball traveled.

**Potential for Errors**: These issues introduced significant potential for errors in the analysis, making it harder to determine the ball’s true motion and trajectory throughout the video.
## Accomplishments that we're proud of
Building this software was rather challenging and fun. I am proud that I was able to completely build this project within the stipulated time period

Real-Time Video Analysis: This system analyzes player performance in real-time, extracting key statistics like exit velocity and providing instant, actionable feedback to enhance training and decision-making.

Actionable Insights for Skill Development: Flash goes beyond basic data collection by offering personalized recommendations, helping players identify areas for improvement and optimize their game.

Enhanced User Interaction: Created an intuitive, interactive platform that allows players and coaches to engage with both video footage and analytics, offering a deeper understanding of performance and growth potential.
Real-Time Performance Analysis: The system provides instant feedback on key stats like exit velocity, helping players enhance training and decision-making.

Actionable Insights: Flash offers personalized recommendations to identify areas for improvement and optimize performance.

Enhanced Interaction: The intuitive platform lets players and coaches engage with both video footage and analytics for deeper insights into growth potential.

To Check Out project:


Frontend : [Click Here](https://github.com/N0VA06/Flash/tree/master)

Instructions
```
git clone <link>
cd
npm install 
npm run dev
```


Backend: [Click Here](https://github.com/N0VA06/Flash/tree/main)

Instructions


```
cd backend
//assuming that you have installed required libraries
python3 main.py
node server.js
```
## What we learned
**Gemini AP**:

The Gemini API helped us process and analyze player performance videos in real-time, automating insights extraction and making the analysis more efficient.

**FFmpeg Image Processing and Metadata Extraction**:

FFmpeg allowed us to extract video metadata and manipulate footage for better clarity and accuracy in the data we gathered.

**YOLOv11**:

YOLOv11 enabled real-time player tracking and detection, helping us identify key actions for detailed performance metrics.

**Plotly**:

Plotly was used to create interactive graphs and visualizations, making it easier to visualize player stats and trends for improved decision-making.
