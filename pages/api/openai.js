// Import the necessary classes from the OpenAI package
import { Configuration, OpenAIApi } from 'openai';

// Create a new Configuration object with the API key from the environment variables
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

// Instantiate a new OpenAIApi object with the configuration
const openai = new OpenAIApi(configuration);

// Define the default export as an asynchronous function handling an HTTP request and response
export default async (req, res) => {
  try {
    // Extract the 'prompt' property from the request body
    const { prompt } = req.body;

    // Call the createCompletion method on the OpenAIApi instance, providing the model, prompt, and temperature
    const completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: prompt,
      temperature: 0.6,
    });

    // Get the first choice's text from the completion response
    const openaiResponse = completion.data.choices[0].text;

    // Set the HTTP response status to 200 (OK) and send the OpenAI response as JSON
    res.status(200).json({ response: openaiResponse });
  } catch (error) {
    // Log the error message to the console if there is an exception
    console.error('Error fetching openai response:', error);
    // Set the HTTP response status to 500 (Internal Server Error) and send the error details as JSON
    res.status(500).json({ error: `Error fetching openai response: ${error.message}`, details: error });
  }
};
