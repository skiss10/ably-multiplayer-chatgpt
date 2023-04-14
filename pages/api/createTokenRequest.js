// Import Ably SDK
import Ably from "ably/promises";

module.exports = async (req, res) => {
  const API_KEY = process.env.ABLY_API_KEY;
  res.status(200).json({ message: 'Success' });
};

// Create an async function to handle the request and response
export default async function handler(req, res) {
  try {
    // Instantiate Ably client with API key
    const client = new Ably.Realtime(API_KEY);

    // Generate a token request with a specified client ID
    const tokenRequestData = await client.auth.createTokenRequest({ clientId: 'ably-nextjs-demo' });

    // Respond with the token request data and a 200 status code
    res.status(200).json(tokenRequestData);
  } catch (error) {
    // Log the error to the console
    console.error("Error creating Ably token request:", error);

    // Respond with an error message and a 500 status code
    res.status(500).json({ error: "Failed to create Ably token request" });
  }
}