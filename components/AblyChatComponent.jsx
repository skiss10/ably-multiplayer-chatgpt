import React, { useEffect, useState } from 'react';
import { useChannel } from "./AblyReactEffect";
import styles from './AblyChatComponent.module.css';

const AblyChatComponent = () => {

  let inputBox = null;
  let messageEnd = null;

  // State for user input, received messages, and OpenAI response fetching status.
  const [messageText, setMessageText] = useState("");
  const [receivedMessages, setMessages] = useState([]);
  const [fetchingopenaiResponse, setFetchingopenaiResponse] = useState(false);

  // Check if message text is empty (whitespace only).
  const messageTextIsEmpty = messageText.trim().length === 0;

  // Generate a random user color and initials.
  const [userColor, setUserColor] = useState(
    "#" + Math.floor(Math.random() * 16777215).toString(16)
  );
  const [userInitials, setUserInitials] = useState(generateRandomInitials());

  // generate a random set of initials
  function generateRandomInitials() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const firstInitial = chars[Math.floor(Math.random() * chars.length)];
    const secondInitial = chars[Math.floor(Math.random() * chars.length)];
    return firstInitial + secondInitial;
  }

  // ensure color contrast of fake initials and background look good
  function getContrastTextColor(color) {
    const hexColor = color.replace("#", "");
    const red = parseInt(hexColor.substr(0, 2), 16);
    const green = parseInt(hexColor.substr(2, 2), 16);
    const blue = parseInt(hexColor.substr(4, 2), 16);
    const brightness = (red * 299 + green * 587 + blue * 114) / 1000;
    return brightness > 128 ? "black" : "white";
  }

  // Initialize channel, subscribe to messages, and update received messages.
  const [channel, ably] = useChannel("chat-demo", (message) => {
    const history = receivedMessages.slice(-199);
    setMessages([...history, message]);
  });

  // Fetch chat history on component mount.
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

  // Determine if a message should trigger an OpenAI response.
  const isopenaiTrigger = (message) => {
    return message.startsWith("Hey OpenAI");
  };

  // Send an OpenAI response.
  const sendopenaiResponse = async (messageText) => {
    try {
      setFetchingopenaiResponse(true);

      const response = await fetch('/api/openai', {
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

    // Extract the openaiResponse from the data object
    const openaiResponse = "GPT: " + data.response;
  
    channel.publish({
      name: "chat-message",
      data: { text: openaiResponse, color: userColor, initials: userInitials },
    });
  } catch (error) {
    console.error("Error fetching openai response:", error);
  
    // Add error handling here
  } finally {
    setFetchingopenaiResponse(false);
  }
};
  // Send a chat message and trigger OpenAI response if applicable.
  const sendChatMessage = async (messageText) => {
    // Publish the original message to the channel first.
    channel.publish({
      name: "chat-message",
      data: { text: messageText, color: userColor, initials: userInitials },
    });

    if (isopenaiTrigger(messageText)) {
      await sendopenaiResponse(messageText, userColor);
    }

    setMessageText("");
    if (inputBox) {
        inputBox.focus();
    }
};
  // Handle form submission and send a chat message.
  const handleFormSubmission = (event) => {
    event.preventDefault();
    sendChatMessage(messageText);
  };

  // Handle the Enter key and send a chat message.
  const handleKeyUp = (event) => {
    if (event.key !== 'Enter' || messageTextIsEmpty) {
      return;
    }
    sendChatMessage(messageText);
    event.preventDefault();
  };

  // Render messages and handle OpenAI responses.
  const messages = receivedMessages.map((message, index) => {
  const author = message.connectionId === ably.connection.id ? "me" : "other";
  const isGPTMessage = message.data.text.startsWith("openai: ");
  const textColor = getContrastTextColor(message.data.color);
  const className = `${isGPTMessage ? styles.openaiMessage : styles.message} ${author === "me" ? styles.messageSentByMe : styles.messageSentByOthers}`;


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
        style={{ backgroundColor: message.data.color, color: textColor }}
      >
        {author === "me" ? userInitials : message.data.initials}
      </div>
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
        {fetchingopenaiResponse && (
          <span className={styles.fetchingMessage}>
            Fetching response from OpenAI...
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
          onKeyUp={handleKeyUp}
          className={styles.textarea}
        ></textarea>
        <button type="submit" className={styles.button} disabled={messageTextIsEmpty}>Send</button>
      </form>
    </div>
  )
}

export default AblyChatComponent;
