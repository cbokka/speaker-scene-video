const fs = require('fs');
const { HfInference } = require('@huggingface/inference');
const path = require('path');

const huggingfaceApiKey = "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";
const outputDir = '.';
const systemPromptFilePath = path.resolve('./system_prompt.txt'); // Path to the system prompt file
const nbMaxNewTokens = 2000; // Hardcoded value for nbMaxNewTokens

// Function to read system prompt from an external file
const readSystemPrompt = () => {
    return fs.readFileSync(systemPromptFilePath, 'utf8');
};

async function generateScripts(systemPrompt, generateScriptData) {
    const hf = new HfInference(huggingfaceApiKey);
    const inferenceModel = "meta-llama/Meta-Llama-3-70B-Instruct";

    let script = "";

    try {
        const response = await hf.textGeneration({
            model: inferenceModel,
            inputs: `${systemPrompt}\n${JSON.stringify(generateScriptData)}\n`,
            parameters: {
                max_new_tokens: nbMaxNewTokens,
                return_full_text: false,
                use_cache: false,
            }
        });

        script += response.generated_text;
        console.log("Raw generated script:", script);
    } catch (err) {
        console.error(`Error during generation: ${err}`);
        if (`${err}` === "Error: Model is overloaded") {
            script = ``;
        }
    }

    // Sanitize the script to remove unwanted characters
    script = script
        .replaceAll("<s>", "")
        .replaceAll("</s>", "")
        .replaceAll("/s>", "")
        .replaceAll("[INST]", "")
        .replaceAll("[/INST]", "")
        .replaceAll("<SYS>", "")
        .replaceAll("<<SYS>>", "")
        .replaceAll("</SYS>", "")
        .replaceAll("<</SYS>>", "")
        .replaceAll('""', '"')
        .replaceAll('`', '')
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
        .trim();

    // Ensure the script is valid JSON
    if (!script.startsWith("{") && !script.startsWith("[")) {
        script = `[${script}]`;
    }

    let scriptJson;
    try {
        scriptJson = JSON.parse(script);
        console.log("Parsed JSON:", scriptJson);
    } catch (error) {
        console.error("Failed to parse LLM response:", error);
        console.log("Sanitized script:", script);
        return null; // Return null in case of a parsing error
    }

    return scriptJson;
}

module.exports = { generateScripts };