import { ConnectWallet } from "@thirdweb-dev/react";
import { useSigner } from "@thirdweb-dev/react";
import { Client } from "@xmtp/xmtp-js";

import React, { useEffect, useState, useRef } from "react";
import Chat from "./Chat";
import Sismo from "./Sismo";
import styles from "./Home.module.css";

// const PEER_ADDRESS = "0x937C0d4a6294cdfa575de17382c7076b579DC176";
const PEER_ADDRESS = "0xd684Ce5aAa919E99Fc030a379112668128644Cce";
const Modes = {
  Initial: 1,
  Receiving: 2,
  Pinged: 4,
  AuthRequired: 8,
  ConnectRequired: 16,
  Connected: 32,
  GMed: 64,
  ConnectSent: 128,
}
export default function Home() {
  const [messages, setMessages] = useState(null);
  const convRef = useRef(null);
  const clientRef = useRef(null);
  const signer = useSigner();
  const isConnected = !!signer;
  const [isOnNetwork, setIsOnNetwork] = useState(false);
  const [autoSign, setAutoSign] = useState(false);
  // const [mode, setMode] = useState(Modes.Initial);
  const modeRef = useRef(Modes.Initial);
  const [nick, setNick] = useState('luser');
  const [sismoResponse, setSismoResponse] = useState(null);

  // Function to load the existing messages in a conversation
  const newConversation = async function (xmtp_client, addressTo) {
    //Creates a new conversation with the address
    if (await xmtp_client?.canMessage(PEER_ADDRESS)) {
      const conversation = await xmtp_client.conversations.newConversation(
        addressTo
      );
      convRef.current = conversation;
      //Loads the messages of the conversation
      const messages = await conversation.messages();
      setMessages(messages);

      modeRef.current |= Modes.Pinged;
      conversation.send("GET /ping");
    } else {
      console.log("cant message because is not on the network.");
      //cant message because is not on the network.
    }
  };

  // Function to initialize the XMTP client
  const initXmtp = async function () {
    // Create the XMTP client
    const xmtp = await Client.create(signer, { env: "production" });
    //Create or load conversation with Gm bot
    newConversation(xmtp, PEER_ADDRESS);
    // Set the XMTP client in state for later use
    setIsOnNetwork(!!xmtp.address);
    //Set the client in the ref
    clientRef.current = xmtp;
  };
  useEffect(() => {
    if (isConnected && !isOnNetwork) {
      if (autoSign) return;
      // initXmtp().then(() => setAutoSign(true));
    }
  }, [isConnected]);

  useEffect(() => {
    if (isOnNetwork && convRef.current) {
      modeRef.current |= Modes.Receiving;
      // Function to stream new messages in the conversation
      const streamMessages = async () => {
        const newStream = await convRef.current.streamMessages();
        for await (const msg of newStream) {
          const exists = messages.find((m) => m.id === msg.id);
          if (!exists) {
            setMessages((prevMessages) => {
              // console.log(i++, msg.content, msg.id);
              if (msg.senderAddress === PEER_ADDRESS) {
                if (modeRef.current & Modes.Pinged) {
                  if (msg.content.split('\n')[0] === "HTTP/1.1 401 Unauthorized") {
                    modeRef.current = ((modeRef.current ^ Modes.Pinged) | Modes.AuthRequired);
                    convRef.current.send("POST /auth?nickname=" + nick + '\n\n' + JSON.stringify(sismoResponse));
                  } else if (msg.content.split(' ')[1] === "200") {
                    if (modeRef.current & Modes.GMed) {
                      console.log("GMed");
                    } {
                      modeRef.current = ((modeRef.current ^ Modes.Pinged) | Modes.Connected | Modes.GMed);
                    }
                    convRef.current.send("gm.");
                  } else if (msg.content.split(' ')[1] === "420") {
                    modeRef.current = ((modeRef.current ^ Modes.Pinged) | Modes.ConnectRequired);
                    convRef.current.send("CONNECT irc:6667");
                  }
                } else if (modeRef.current & Modes.AuthRequired) {
                  if (msg.content.split('\n')[0] === "HTTP/1.1 200 OK Authentication successful") {
                    modeRef.current = ((modeRef.current ^ Modes.AuthRequired) | Modes.ConnectRequired);
                    convRef.current.send("CONNECT irc:6667");
                  }
                } else if (modeRef.current & Modes.ConnectRequired) {
                  if (msg.content.split('\n')[0] === "HTTP/1.1 200 OK Connected successfully") {
                    modeRef.current = ((modeRef.current ^ Modes.ConnectRequired) | Modes.Connected);
                    convRef.current.send("gm!");
                  }
                }
              }

              const msgsnew = [...prevMessages, msg];
              return msgsnew;
            });
          }
        }
      };
      streamMessages();
    }
  }, [messages, isOnNetwork]);

  const handleInputChange = (event) => {
    setNick(event.target.value);
  };

  return (
    <div className={styles.Home}>
      {/* Display the ConnectWallet component if not connected */}
      {!isConnected && (
        <div className={styles.thirdWeb}>
          <img
            src="thirdweb-logo-transparent-white.svg"
            alt="Your image description"
            width={200}
          />
          <ConnectWallet theme="dark" />
        </div>
      )}
      {/* Display XMTP connection options if connected but not initialized */}
      {isConnected && !isOnNetwork && (
        <div className={styles.xmtp}>
          <ConnectWallet theme="light" />
          <button onClick={initXmtp} className={styles.btnXmtp}>
            Connect to XMTP
          </button>
        </div>
      )}
      {/* Render the Chat component if connected, initialized, and messages exist */}
      {isConnected && isOnNetwork && messages && (
        <Chat
          client={clientRef.current}
          conversation={convRef.current}
          messageHistory={messages}
        />
      )}
      <Sismo setSismoResponse={setSismoResponse} />
      <input
        type="text"
        onKeyPress={handleInputChange}
        onChange={handleInputChange}
        value={nick}
        placeholder="Type your name here "
      />
    </div>
  );
}
