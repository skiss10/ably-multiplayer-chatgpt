// Import the required dependencies
import Ably from "ably/promises";
import { useEffect } from 'react'

// Initialize the Ably Realtime instance with the auth URL
const ably = new Ably.Realtime.Promise({ authUrl: '/api/createTokenRequest' });

// Define the useChannel custom hook
export function useChannel(channelName, callbackOnMessage) {
    // Get the chat channel and chatGPT channel from the Ably instance
    const chatChannel = ably.channels.get(channelName);
    const chatGPTChannel = ably.channels.get('chat-gpt');

    // Define the onMount function that will be called when the hook is mounted
    const onMount = () => {
        // Subscribe to messages from the chat channel and call the provided callback
        chatChannel.subscribe(msg => { callbackOnMessage(msg); });

        // Subscribe to messages from the chatGPT channel, fetch the response,
        // and call the provided callback with the response
        chatGPTChannel.subscribe(async msg => {
            const response = await fetchChatGPTResponse(msg);
            callbackOnMessage(response);
        });
    }

    // Define the onUnmount function that will be called when the hook is unmounted
    const onUnmount = () => {
        // Unsubscribe from the chat channel and chatGPT channel
        chatChannel.unsubscribe();
        chatGPTChannel.unsubscribe();
    }

    // Define the useEffectHook that will be passed to the useEffect function
    const useEffectHook = () => {
        onMount();
        return () => { onUnmount(); };
    };

    // Use the useEffect hook with the useEffectHook function
    useEffect(useEffectHook);

    // Return the chat channel and the Ably instance
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
