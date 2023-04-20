// /api/openai.js
import { Configuration, OpenAIApi } from 'openai';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export default async (req, res) => {
  try {

    const { prompt } = req.body;

    const completion = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: prompt,
        temperature: 0.6,
      });

    const openaiResponse = completion.data.choices[0].text;

    console.log(openaiResponse)
    console.log("hit serverless function")

    res.status(200).json({ response: openaiResponse });
  } catch (error) {
    console.error('Error fetching openai response:', error);
    res.status(500).json({ error: `Error fetching openai response: ${error.message}`, details: error });
  }
};
