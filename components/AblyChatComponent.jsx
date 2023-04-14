import React, { useEffect, useState } from 'react';
import { useChannel } from "./AblyReactEffect";
import styles from './AblyChatComponent.module.css';

const AblyChatComponent = () => {

  let inputBox = null;
  let messageEnd = null;

  const [messageText, setMessageText] = useState("");
  const [receivedMessages, setMessages] = useState([]);
  const [fetchingChatGPTResponse, setFetchingChatGPTResponse] = useState(false);
  const messageTextIsEmpty = messageText.trim().length === 0;
  const [userColor, setUserColor] = useState(
    "#" + Math.floor(Math.random() * 16777215).toString(16)
  );

  const [channel, ably] = useChannel("chat-demo", (message) => {
    const history = receivedMessages.slice(-199);
    setMessages([...history, message]);
  });

  const isChatGPTTrigger = (message) => {
    return message.startsWith("Hey ChatGPT...");
  };

  const sendChatGPTResponse = async (messageText) => {
    try {
      setFetchingChatGPTResponse(true);

      const response = await fetch('/api/chatgpt', {
        method: 'POST',
        body: JSON.stringify({ prompt: messageText }), // Use messageText instead of msg.data
        headers: { 'Content-Type': 'application/json' },
      });

      // Check if the response is ok (status code in the 200-299 range)
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

    // Parse the JSON response
      const data = await response.json();

    // Extract the chatGPTResponse from the data object
    const chatGPTResponse = data.response;
  
    channel.publish({
      name: "chat-message",
      data: { text: `ChatGPT: ${chatGPTResponse}`, color: "#000000" }, // Change this line
    });
  } catch (error) {
    console.error("Error fetching ChatGPT response:", error);
  
    // Add error handling here
  } finally {
    setFetchingChatGPTResponse(false);
  }
};
  
  const sendChatMessage = async (messageText) => {
    // Publish the original message to the channel first.
    channel.publish({
      name: "chat-message",
      data: { text: messageText, color: userColor },
    });

    if (isChatGPTTrigger(messageText)) {
        await sendChatGPTResponse(messageText);
    }

    setMessageText("");
    if (inputBox) {
        inputBox.focus();
    }
};

  const handleFormSubmission = (event) => {
    event.preventDefault();
    sendChatMessage(messageText);
  };

  const handleKeyPress = (event) => {
    if (event.key !== 'Enter' || messageTextIsEmpty) {
      return;
    }
    sendChatMessage(messageText);
    event.preventDefault();
  };

  const messages = receivedMessages.map((message, index) => {
    const author = message.connectionId === ably.connection.id ? "me" : "other";
    const isGPTMessage = message.data.text.startsWith("ChatGPT: ");
    const className = isGPTMessage ? styles.chatGPTMessage : styles.message;
    return (
      <div key={index} className={styles.messageWrapper}>
        <div
          className={styles.colorSquare}
          style={{ backgroundColor: message.data.color }}
        ></div>
        <span
          className={className}
          data-author={author}
          style={{ color: message.data.color }}
        >
          {message.data.text}
        </span>
      </div>
    );
  });

  useEffect(() => {
    messageEnd?.scrollIntoView({ behavior: "smooth" });
  });

  return (
    <div className={styles.chatHolder}>
      {/* ... */}
    </div>
  )
}

export default AblyChatComponent;
