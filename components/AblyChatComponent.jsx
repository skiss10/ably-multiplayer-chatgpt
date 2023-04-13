import React, { useEffect, useState } from 'react';
import { useChannel } from "./AblyReactEffect";
import styles from './AblyChatComponent.module.css';
const { Configuration, OpenAIApi } = require("openai");

const AblyChatComponent = () => {

  let inputBox = null;
  let messageEnd = null;

  const [messageText, setMessageText] = useState("");
  const [receivedMessages, setMessages] = useState([]);
  const [fetchingChatGPTResponse, setFetchingChatGPTResponse] = useState(false);
  const messageTextIsEmpty = messageText.trim().length === 0;

  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const openai = new OpenAIApi(configuration);

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
  
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      };
    
      const response = await fetch('https://api.openai.com/v1/engines/text-davinci-002/completions', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt: messageText,
          max_tokens: 150,
          n: 1,
          stop: '>>>',
          temperature: 0.7
        })
      });
    
      const data = await response.json();
      const chatGPTResponse = data.choices[0].text;
    
      channel.publish({
        name: "chat-message",
        data: `ChatGPT: ${chatGPTResponse}`,
      });
    } catch (error) {
      console.error("Error fetching ChatGPT response:", error);
    
      // Add error handling here
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
    if (inputBox) {
      inputBox.focus();
    }
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
