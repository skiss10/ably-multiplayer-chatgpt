import React, { useEffect, useState } from 'react';
import { useChannel } from "./AblyReactEffect";
import styles from './AblyChatComponent.module.css';
import axios from "axios";

const AblyChatComponent = () => {

  let inputBox = null;
  let messageEnd = null;

  const [messageText, setMessageText] = useState("");
  const [receivedMessages, setMessages] = useState([]);
  const [fetchingChatGPTResponse, setFetchingChatGPTResponse] = useState(false);
  const messageTextIsEmpty = messageText.trim().length === 0;

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
  
      const response = await axios.post(
        "https://api.openai.com/v1/engines/davinci-codex/completions",
        {
          prompt: messageText,
          max_tokens: 150,
          n: 1,
          stop: ">>>",
          temperature: 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );
  
      const chatGPTResponse = response.data.choices[0].text;
  
      channel.publish({
        name: "chat-message",
        data: `ChatGPT: ${chatGPTResponse}`,
      });
    } catch (error) {
      console.error("Error fetching ChatGPT response:", error);
  
      // Add error handling here
      setError(error.message);
    } finally {
      setFetchingChatGPTResponse(false);
    }
  };
  

  const sendChatMessage = async (messageText) => {
    if (isChatGPTTrigger(messageText)) {
      await sendChatGPTResponse(messageText);
    } else {
      channel.publish({ name: "chat-message", data: messageText });
    }
    setMessageText("");
    inputBox.focus();
  };

  const handleFormSubmission = (event) => {
    event.preventDefault();
    sendChatMessage(messageText);
  };

  const handleKeyPress = (event) => {
    if (event.charCode !== 13 || messageTextIsEmpty) {
      return;
    }
    sendChatMessage(messageText);
    event.preventDefault();
  };

  const messages = receivedMessages.map((message, index) => {
    const author = message.connectionId === ably.connection.id ? "me" : "other";
    const isGPTMessage = message.data.startsWith("ChatGPT: ");

    const className = isGPTMessage
      ? styles.chatGPTMessage
      : styles.message;

    return (
      <span
        key={index}
        className={className}
        data-author={author}
      >
        {message.data}
      </span>
    );
  });

  useEffect(() => {
    messageEnd.scrollIntoView({ behaviour: "smooth" });
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
          placeholder="Type a message..."
          onChange={e => setMessageText(e.target.value)}
          onKeyPress={handleKeyPress}
          className={styles.textarea}
        ></textarea>
        <button type="submit" className={styles.button} disabled={messageTextIsEmpty}>Send</button>
      </form>
    </div>
  )
}

export default AblyChatComponent;
