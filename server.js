const express = require('express');
const { bundle } = require('@remotion/bundler');
const { renderMedia, selectComposition } = require('@remotion/renderer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const webpackOverride = require('./src/webpack-override.js').webpackOverride;

// Define the composition ID from your RemotionRoot
const compositionId = 'MyComp';

// Create an Express app
const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Function to render your video composition
const renderComposition = async (inputProps, uuid) => {
  try {
    // Bundle the project
    const bundleLocation = await bundle({
      entryPoint: path.resolve('./src/index.ts'), // Update the path if necessary
      webpackOverride,
    });

    // Select the composition
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: compositionId,
      inputProps,
    });

    // Render the media
    const outputLocation = `/Users/cbokka/Desktop/Personal/template-tiktok/public/${uuid}.mp4`;
    if (fs.existsSync(outputLocation)) {
      console.log(`Video already exists: ${outputLocation}`);
      return outputLocation;
    }
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation,
      inputProps,
    });

    console.log('Render done!');
    return outputLocation;
  } catch (error) {
    console.error('Error rendering composition:', error);
    throw error;
  }
};

// Function to process TTS and return the output file path and update JSON with charData
const processTTS = async (content, uuid, jsonFilePath, jsonArray, itemIndex) => {
  const outputDirectory = path.join(__dirname, 'public');
  const outputFilePath = path.join(outputDirectory, `${uuid}.mp3`);

  if (fs.existsSync(outputFilePath)) {
    console.log(`Audio already exists: ${outputFilePath}`);
    return path.relative(path.join(__dirname, 'public'), outputFilePath);
  }

  console.log("Entering TTS...");

  // TTS API configuration
  const voiceId = "3gsg3cxXyFLcGIfNbM6C";
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`;
  const headers = {
    "Content-Type": "application/json",
    "xi-api-key": "5e97334efe020b68cd5570c5fcef30c3"
  };

  const requestData = {
    "text": content,
    "model_id": "eleven_multilingual_v2",
    "voice_settings": {
      "stability": 0.3,
      "similarity_boost": 0.7,
      "style": 0,
      "use_speaker_boost": true
    }
  };

  console.log("Called TTS...");
  // Ensure the output directory exists
  if (!fs.existsSync(outputDirectory)) {
    fs.mkdirSync(outputDirectory);
  }

  try {
    const response = await axios.post(url, requestData, { headers });

    console.log("Got response from TTS...");
    if (response.status !== 200) {
      throw new Error(`Error: ${response.status}, Content: ${response.data}`);
    }

    const responseDict = response.data;
    const audioBytes = Buffer.from(responseDict.audio_base64, 'base64');

    fs.writeFileSync(outputFilePath, audioBytes);

    console.log(`File ${outputFilePath} downloaded successfully`);

    // Update the JSON array with charData
    jsonArray[itemIndex].charData = responseDict.alignment;

    // Write the updated JSON array back to the file
    fs.writeFileSync(jsonFilePath, JSON.stringify(jsonArray, null, 2));

    return path.relative(path.join(__dirname, 'public'), outputFilePath);
  } catch (error) {
    console.error('Error making TTS request:', error);
    throw error;
  }
};

// API endpoint to process TTS, render video, and update JSON
app.post('/tts-and-render', async (req, res) => {
  const { filePath } = req.body;

  console.log("Entering TTS...");

  try {
    if (!fs.existsSync(filePath)) {
      return res.status(400).json({ message: 'JSON file not found' });
    }

    const jsonArray = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    for (let i = 0; i < jsonArray.length; i++) {
      const item = jsonArray[i];

      // Check if the item has already been processed
      if (item.videoFilePath) {
        console.log(`Skipping already processed item: ${item.videoFilePath}`);
        continue;
      }

      // Process TTS to create the MP3 file and update JSON with charData
      const audioFilePath = await processTTS(item.content, item.uuid, filePath, jsonArray, i);

      // Use the MP3 file to render the video
      const inputProps = {
        audioFile: audioFilePath,
        backgroundImage: item.backgroundImage || 'background.jpg', // Assuming a default background if not provided
      };
      const videoFilePath = await renderComposition(inputProps, item.uuid);

      // Save the video file path back to the JSON array
      item.videoFilePath = videoFilePath;
    }

    // Write the updated JSON array back to the file
    fs.writeFileSync(filePath, JSON.stringify(jsonArray, null, 2));
    console.log(`Updated JSON file saved to ${filePath}`);

    res.status(200).json({ message: 'TTS and render done!' });
  } catch (error) {
    res.status(500).json({ message: 'Error processing TTS and rendering video', error: error.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

