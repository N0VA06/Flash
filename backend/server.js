const express = require('express');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
const cors = require('cors');

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI("");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Setup Express server
const app = express();
app.use(express.json());
app.use(cors());

// Convert file to GenerativeAI part
function fileToGenerativePart(filePath, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
      mimeType,
    },
  };
}

// Extract specific frames from a video
function extractFrames(videoPath, outputPath, timestamps) {
  const promises = timestamps.map((time) => {
    return new Promise((resolve, reject) => {
      const filename = `frame_${time}.jpg`;
      ffmpeg(videoPath)
        .screenshots({
          timestamps: [time],
          filename: filename,
          folder: outputPath,
        })
        .on('end', () => resolve(`${outputPath}/${filename}`))
        .on('error', (err) => reject(err));
    });
  });
  return Promise.all(promises);
}

// API Endpoint: /analyze-video
app.post('/analyze-video', async (req, res) => {
  try {
    const { videoUrl, timestamps, prompt } = req.body;

    if (!videoUrl || !timestamps || !Array.isArray(timestamps)) {
      return res.status(400).json({ error: 'Invalid input parameters' });
    }

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Invalid prompt' });
    }

    const prompts = `Analyse the gameplay and give Statcast metrics (e.g., pitch speed, exit velocity) which can be confirmed. Give accurate rough values and keep it short: ${prompt}`;

    // Step 1: Extract frames
    console.log("Extracting frames...");
    const outputPath = path.join(__dirname, 'frames');
    await fs.promises.mkdir(outputPath, { recursive: true });

    const framePaths = await extractFrames(videoUrl, outputPath, timestamps);

    // Step 2: Prepare frames for model input
    console.log("Preparing frames for model input...");
    const imageParts = framePaths.map((filePath) => {
      try {
        return fileToGenerativePart(filePath, "image/jpg");
      } catch (error) {
        console.error(`Error processing image: ${filePath}`, error);
        throw new Error('Error processing images');
      }
    });

    // Step 3: Send to Generative AI
    console.log("Sending request to model...");
    const result = await model.generateContent([prompts, ...imageParts]);

    // Step 4: Send the response back
    res.json({
      text: result.response.text ? result.response.text() : result.response,
    });

    // Clean up frames after use
    await Promise.all(framePaths.map((framePath) => fs.promises.unlink(framePath)));
    await fs.promises.rmdir(outputPath, { recursive: true });

  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: 'An error occurred while processing the video' });
  }
});


// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
// curl -X POST \
//   http://localhost:8080/analyze-video \
//   -H "Content-Type: application/json" \
//   -d '{
//     "videoUrl": "https://sporty-clips.mlb.com/eVozQWVfWGw0TUFRPT1fQndWWkFWMEFWVkFBQ1ZKV0JBQUFWUUZYQUZnQlVBVUFWd1JSQTFFR0IxRUFVbEFG.mp4",
//     "timestamps": [4,5,6,8,13,17,25],
//     "prompt": "Analyze these frames and describe what is happening in the video"
//   }'
