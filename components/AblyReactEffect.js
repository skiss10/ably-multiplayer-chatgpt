import Ably from "ably/promises";
import { useEffect } from 'react'

const ably = new Ably.Realtime.Promise({ authUrl: '/api/createTokenRequest' });

export function useChannel(channelName, callbackOnMessage) {
    const chatChannel = ably.channels.get(channelName);
    const chatGPTChannel = ably.channels.get('chat-gpt');

    const onMount = () => {
        chatChannel.subscribe(msg => { callbackOnMessage(msg); });
        chatGPTChannel.subscribe(async msg => {
            const response = await fetchChatGPTResponse(msg);
            callbackOnMessage(response);
        });
    }

    const onUnmount = () => {
        chatChannel.unsubscribe();
        chatGPTChannel.unsubscribe();
    }

    const useEffectHook = () => {
        onMount();
        return () => { onUnmount(); };
    };

    useEffect(useEffectHook);

    return [chatChannel, ably];
}

async function fetchChatGPTResponse(msg) {
    const response = await fetch('/api/chatgpt', {
        method: 'POST',
        body: JSON.stringify({ prompt: msg.data }),
        headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    return { ...msg, data: `ChatGPT: ${data.response}` };
}
