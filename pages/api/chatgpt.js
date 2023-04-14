// /api/chatgpt.js
import { Configuration, OpenAIApi } from 'openai';

const configuration = new Configuration({
  apiKey: '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',
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

    const chatGPTResponse = completion.data.choices[0].text;

    console.log(chatGPTResponse)
    console.log("hit serverless function")

    res.status(200).json({ response: chatGPTResponse });
  } catch (error) {
    console.error('Error fetching ChatGPT response:', error);
    res.status(500).json({ error: 'Error fetching ChatGPT response' });
  }
};
