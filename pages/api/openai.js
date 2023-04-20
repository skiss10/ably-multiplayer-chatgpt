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
    const { prompt } = req.body;

    const completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: prompt,
      temperature: 0.6,
    });

    // Get the first choice's text from the completion response
    const openaiResponse = completion.data.choices[0].text;

    res.status(200).json({ response: openaiResponse });
  } catch (error) {
    console.error('Error fetching openai response:', error);
    res.status(500).json({ error: `Error fetching openai response: ${error.message}`, details: error });
  }
};