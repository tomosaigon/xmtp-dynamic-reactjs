import React, { useState, useEffect, useRef } from "react";
import styles from "./Chat.module.css";
import { useAddress } from "@thirdweb-dev/react";

// Convert username to a SHA-256 hash to a hexadecimal color string
async function getUsernameColor(username, colorLength) {
  const encoder = new TextEncoder();
  const data = encoder.encode(username);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const color = hashArray.slice(0, colorLength).map(byte => byte.toString(16).padStart(2, '0')).join('');

  return `#${color}`;
}
function parseBroadcastMessage(broadcastMessage) {
  const respCodeRegex = /^HTTP\/1.1 (\d{3})\s/;
  if (respCodeRegex.test(broadcastMessage)) {
    return null;
  }

  const match = broadcastMessage.match(/^<([^>]+)>\s+(.+)$/);
  if (match) {
    const senderName = match[1];
    const messageContent = match[2];
    return { senderName, messageContent };
  } else {
    return null;
  }
}
function isBroadcastMessage(message) {
  return parseBroadcastMessage(message.content) !== null;
}
function BroadcastMessage(props) {
  const { senderName, messageContent, userColors, setUserColors } = props;

  useEffect(() => {
    async function fetchUsernameColor() {
      const color = await getUsernameColor(senderName, 3);
      setUserColors({ ...userColors, [senderName]: color });
    }
    if (!userColors[senderName]) {
      fetchUsernameColor();
    }
  }, [senderName]);

  return (
    <>
      <span style={{ fontWeight: 'bold', color: userColors[senderName] }}>&lt;{senderName}&gt;&nbsp;</span>
      <span>{messageContent}</span>
    </>
  );
}
function SystemMessage({ message }) {
  const respCodeRegex = /^HTTP\/1.1 (\d{3})\s/;
  if (respCodeRegex.test(message.content)) {
    return <span>*** UNEXPECTED: """{message.content}"""</span>;
  }
  return (
    <span>*** {message.content}</span>
  );
}

function Chat({ client, messageHistory, conversation }) {
  const address = useAddress();
  const [inputValue, setInputValue] = useState("");
  const [userColors, setUserColors] = useState({});
  const targetElementRef = useRef(null);

  // scrollIntoView
  useEffect(() => {
    if (targetElementRef.current) {
      targetElementRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start', 
        inline: 'nearest'
      });
    }
  }, []);

  // Function to handle sending a message
  const handleSend = async () => {
    if (inputValue) {
      await onSendMessage(inputValue);
      setInputValue("");
    }
  };

  // Function to handle sending a text message
  const onSendMessage = async (value) => {
    return conversation.send(value);
  };

  const currentDate = new Date();
  const oneWeekAgo = new Date(currentDate);
  oneWeekAgo.setDate(currentDate.getDate() - 7);
  // MessageList component to render the list of messages
  const MessageList = ({ messages }) => {
    // Filter messages by unique id
    messages = messages.filter(
      (v, i, a) => a.findIndex((t) => t.id === v.id) === i
    );
    // Filter out our messages
    messages = messages.filter(
      (v) => v.senderAddress !== address
    );
    // Filter out messages older than one week
    messages = messages.filter(
      (v) => v.sent > oneWeekAgo
    );
    return (
      <ul className="messageList">
        {messages.map((message, index) => (
          <li
            key={message.id}
            className="messageItem"
            title="Click to log this message to the console"
          >
            <code>
              <span className="date">
                {message.sent.toLocaleTimeString('en-US', {
                  weekday: 'short', 
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false,
                })}
                {' '}
              </span>
              {message.content[0] == '<' || isBroadcastMessage(message) ?
                <BroadcastMessage userColors={userColors} setUserColors={setUserColors} {...parseBroadcastMessage(message.content)} /> :
                <span>*** {message.content}</span>}
            </code>
            {/* <strong>
              {message.senderAddress === address ? "You" : "Bot"}:
            </strong>
            <span>{message.content}</span>
            <span className="date"> ({message.sent.toLocaleTimeString()})</span>
            <span className="eyes" onClick={() => console.log(message)}>
              👀
            </span> */}
          </li>
        ))}
      </ul>
    );
  };

  // Function to handle input change (keypress or change event)
  const handleInputChange = (event) => {
    if (event.key === "Enter") {
      handleSend();
    } else {
      setInputValue(event.target.value);
    }
  };
  return (
    <div className={styles.Chat}>
      <div ref={targetElementRef}></div>
      <div className={styles.messageContainer}>
        <MessageList messages={messageHistory} />
      </div>
      <div className={styles.inputContainer}>
        <input
          type="text"
          className={styles.inputField}
          onKeyPress={handleInputChange}
          onChange={handleInputChange}
          value={inputValue}
          placeholder="Type your text here "
        />
        <button className={styles.sendButton} onClick={handleSend}>
          &#128073;
        </button>
      </div>
    </div>
  );
}

export default Chat;
