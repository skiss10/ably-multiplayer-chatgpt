import Ably from "ably/promises";
import { useEffect } from 'react'

const ably = new Ably.Realtime.Promise({ authUrl: '/api/createTokenRequest' });

export function useChannel(channelName, callbackOnMessage) {
    const chatChannel = ably.channels.get(channelName);
  
    const onMount = () => {
      chatChannel.subscribe(msg => { callbackOnMessage(msg); });
    }
  
    const onUnmount = () => {
      chatChannel.unsubscribe();
    }
  
    const useEffectHook = () => {
      onMount();
      return () => { onUnmount(); };
    };
  
    useEffect(useEffectHook);
  
    return [chatChannel, ably];
  }

// Define the fetchChatGPTResponse function that sends a request to the API
// and returns the message object with the ChatGPT response data
async function fetchChatGPTResponse(msg) {
    try {
        // Send a POST request to the API with the message data as the prompt
        const response = await fetch('/api/chatgpt', {
            method: 'POST',
            body: JSON.stringify({ prompt: msg.data }),
            headers: { 'Content-Type': 'application/json' }
        });

        // Check if the response is ok (status code in the 200-299 range)
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        // Parse the JSON response
        const data = await response.json();

        // Return the message object with the ChatGPT response data
        return { ...msg, data: `ChatGPT: ${data.response}` };
    } catch (error) {
        console.error("Error fetching ChatGPT response:", error);

        // Return the message object with an error message
        return { ...msg, data: `ChatGPT: Error fetching response - ${error.message}` };
    }
}
