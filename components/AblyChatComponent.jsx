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

  useEffect(() => {
    const fetchChannelHistory = async () => {
      try {
        const historyPage = await channel.history({ limit: 20 });
        const historyMessages = historyPage.items.reverse();
        setMessages(receivedMessages => [...receivedMessages, ...historyMessages]);
      } catch (error) {
        console.error('Error fetching channel history:', error);
      }
    };

    fetchChannelHistory();
  }, [channel]);

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
      data: { text: `ChatGPT: ${chatGPTResponse}`, color: userColor },
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
      await sendChatGPTResponse(messageText, userColor);
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
  
    // Set the font color based on the message author.
    const fontColor = author === "me" ? "#FFFFFF" : "#000000";
  
    // Set the alignment based on the message author.
    const justifyContent = author === "me" ? "flex-end" : "flex-start";
  
    return (
      <div
        key={index}
        className={`${styles.messageWrapper} ${author === "me" ? styles.messageSentByMe : styles.messageSentByOthers}`}
        style={{ justifyContent: justifyContent }}
      >
        <div
          className={styles.colorSquare}
          style={{ backgroundColor: message.data.color }}
        ></div>
        <span
          className={className}
          data-author={author}
          style={{ color: fontColor }}
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
      <div className={styles.chatText}>
        {messages}
        {fetchingChatGPTResponse && (
          <span className={styles.fetchingMessage}>
            Fetching response from ChatGPT...
          </span>
        )}
        <div ref={(element) => { messageEnd = element; }}></div>
      </div>
      <form onSubmit={handleFormSubmission} className={styles.form}>
        <textarea
          ref={(element) => { inputBox = element; }}
          value={messageText}
          placeholder="Type a message!"
          onChange={e => setMessageText(e.target.value)}
          onKeyDown={handleKeyPress}
          className={styles.textarea}
        ></textarea>
        <button type="submit" className={styles.button} disabled={messageTextIsEmpty}>Send</button>
      </form>
    </div>
  )
}

export default AblyChatComponent;
