const express = require('express');
const { bundle } = require('@remotion/bundler');
const { renderMedia, selectComposition } = require('@remotion/renderer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { generateScripts } = require('./generateScripts'); // Import generateScripts function
const webpackOverride = require('./src/webpack-override').webpackOverride;

// Define the composition ID from your RemotionRoot
const compositionId = 'MyComp';

// Create an Express app
const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Ensure the necessary directories exist
const ensureDirExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Function to render your video composition
const renderComposition = async (inputProps, uuid) => {
  try {
    console.log('Starting bundle process...');
    // Bundle the project
    const bundleLocation = await bundle({
      entryPoint: path.resolve('./src/index.ts'), // Update the path if necessary
      webpackOverride,
    });

    console.log('Bundle process completed.');
    console.log('Selecting composition...');
    // Select the composition
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: compositionId,
      inputProps,
    });

    console.log('Composition selected.');
    console.log(`Composition width: ${composition.width}, height: ${composition.height}`);

    // Ensure the output directory exists
    const outputLocation = `/mnt/disks/bbnews/public/${uuid}.mp4`;
    ensureDirExists(path.dirname(outputLocation));

    if (fs.existsSync(outputLocation)) {
      console.log(`Video already exists: ${outputLocation}`);
      return outputLocation;
    }

    console.log('Starting render process...');
    // Render the media with progress logging
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation,
      inputProps,
      onProgress: (progress) => {
        console.log(`Rendering progress object: ${JSON.stringify(progress)}`);
      },
    });

    console.log('Render done!');
    return outputLocation;
  } catch (error) {
    console.error('Error rendering composition:', error);
    throw error;
  }
};

// Function to process TTS and return the output file path and update JSON with charData
const processTTS = async (content, uuid, jsonFilePath, jsonArray, itemIndex, voiceId) => {
  const outputDirectory = '/mnt/disks/bbnews/public';
  ensureDirExists(outputDirectory);

  const outputFilePath = path.join(outputDirectory, `${uuid}.mp3`);

  if (fs.existsSync(outputFilePath)) {
    console.log(`Audio already exists: ${outputFilePath}`);
    return path.relative(outputDirectory, outputFilePath);
  }

  console.log("Entering TTS...");

  // TTS API configuration
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

    return path.relative(outputDirectory, outputFilePath);
  } catch (error) {
    console.error('Error making TTS request:', error);
    throw error;
  }
};

// API endpoint to process TTS, render video, and update JSON
app.post('/tts-and-render', async (req, res) => {
  const { filePath, voiceId } = req.body;

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
      const audioFilePath = await processTTS(item.content, item.uuid, filePath, jsonArray, i, voiceId);

      // Use the MP3 file to render the video
      const inputProps = {
        audioFile: audioFilePath,
        backgroundImage: item.backgroundImage || 'background.jpg', // Assuming a default background if not provided
      };
      console.log(`Starting render for UUID: ${item.uuid}`);
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

// API endpoint to generate script
app.post('/generate-script', async (req, res) => {
  const { generateScriptData } = req.body;

  try {
    const systemPrompt = fs.readFileSync('./system_prompt.txt', 'utf8'); // Read system prompt from file
    const scriptJson = await generateScripts(systemPrompt, generateScriptData);

    if (scriptJson) {
      res.status(200).json({ message: 'Script generated!', scriptJson });
    } else {
      res.status(500).json({ message: 'Failed to generate script. Invalid response from model.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error generating script', error: error.message });
  }
});

// API endpoint to confirm script and place it in the specified file path
app.post('/confirm-script', async (req, res) => {
  const { outputDirectory, scriptJson } = req.body;

  try {
    const uuid = uuidv4(); // Generate a UUID
    scriptJson.uuid = uuid; // Add the UUID to the scriptJson

    ensureDirExists(outputDirectory);

    const outputFilePath = path.join(outputDirectory, `${uuid}.json`);
    fs.writeFileSync(outputFilePath, JSON.stringify([scriptJson], null, 2)); // Enclose scriptJson in an array

    res.status(200).json({ message: 'Script confirmed!', outputFilePath });
  } catch (error) {
    res.status(500).json({ message: 'Error confirming script', error: error.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
