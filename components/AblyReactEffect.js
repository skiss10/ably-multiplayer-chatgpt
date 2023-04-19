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
  