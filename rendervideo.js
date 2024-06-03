const { bundle } = require("@remotion/bundler");
const { renderMedia, selectComposition } = require("@remotion/renderer");
const path = require("path");
const webpackOverride = require("./src/webpack-override.js").webpackOverride; // Use the compiled JavaScript file

// Define the composition ID from your RemotionRoot
const compositionId = "MyComp";

// Function to render your video composition
const renderComposition = async () => {
  try {
    // Bundle the project
    const bundleLocation = await bundle({
      entryPoint: path.resolve("./src/index.ts"), // Update the path if necessary
      webpackOverride,
    });

    // Define input props for your composition
    const inputProps = {
      audioFile: "podcast.m4a",
      backgroundImage: "background.jpg",
    };

    // Select the composition
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: compositionId,
      inputProps,
    });

    // Render the media
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: "h264",
      outputLocation: `out/${compositionId}.mp4`,
      inputProps,
    });

    console.log("Render done!");
  } catch (error) {
    console.error("Error rendering composition:", error);
  }
};

// Execute the render function
renderComposition();
