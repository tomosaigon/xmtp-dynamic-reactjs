import { ConnectWallet } from "@thirdweb-dev/react";
import { useSigner } from "@thirdweb-dev/react";
import { Client } from "@xmtp/xmtp-js";

import React, { useEffect, useState, useRef } from "react";
import Chat from "./Chat";
import Sismo from "./Sismo";
import styles from "./Home.module.css";
import styled from 'styled-components';
import { DISCO_TEST_API_KEY } from "../apiKeys";

const DISCO_ISSUER = 'did:3:kjzl6cwe1jw14be3xf0tlp2do529lo4jetn99gbwvdrgureee3w5ea135ankx2z';
const DISCO_TEST_VC_ID = "https://api.disco.xyz/credential/ec8d685c-b570-4913-8a2c-2b1bd091510e";

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
function getSetModes(mode) {
  return Object.keys(Modes).filter(key => mode & Modes[key]).join(', ');
}

const SlidingText = () => {
  const pairs = [
    ['Authentic Connections', 'Anonymous Conversations', 'Ad-Hoc Communities'],
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % pairs[0].length;
      setCurrentIndex(nextIndex);
    }, 3000);

    return () => clearInterval(interval);
  }, [currentIndex]);

  return (
    <div className={styles.sliding}>
          <div >{pairs[0][currentIndex]}</div>
    </div>
  );
};

const CardButtonWrapper = styled.div`
  position: relative;
  transition: transform 0.2s, box-shadow 0.2s, border 0.2s;

  &:hover {
    transform: ${props => (!props.completed ? 'scale(1.01);' : 'none;')};
  }
`;
const IndexNumber = styled.span`
  position: absolute;
  top: 10px; /* Adjust this value to position the number vertically */
  left: 10px; /* Adjust this value to position the number horizontally */
  font-size: 16px;
  color: #3498db; /* Color of the number */
  background-color: white; /* Background color of the number */
  padding: 4px 8px;
  border-radius: 50%;
`;

const CardButton = ({ title, description, completed, disabled, index, Connect }) => {
  if (completed !== true && completed !== false) {
    debugger;
  }
  const cardButtonStyle = {
    width: '350px',
    height: '250px',
    border: 'none',
    borderRadius: '10px',
    boxShadow: !completed ? '0 4px 8px rgba(0, 0, 0, 0.3)' : 'none',
    backgroundColor: completed ? 'rgb(217 152 34)' : (disabled ? 'grey' : '#3498db'),
    color: completed ? 'white' : 'white',
    // cursor: completed ? 'default' : 'pointer',
    outline: 'none',

  };

  const cardContentStyle = {
    padding: '0 32px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  };

  const cardHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    marginTop: '8px',
    fontSize: '18px',
  };


  const statusIconStyle2 = {
    // position: 'absolute',
    // right: 16,
    backgroundColor: 'white',
    color: completed ? 'green' : (disabled ? 'grey' : 'rgb(201 201 201)'),
    borderRadius: '50%',
    padding: '16px',
    fontSize: '42px',
    lineHeight: '32px',
    // display: 'flex',
    // justifyContent: 'center',
    // alignItems: 'center',
    width: '32px',
    height: '32px',
    margin: '16px 140px',
  };

  return (
    <CardButtonWrapper completed={completed}>
      {index && <IndexNumber>{index}</IndexNumber>}
      <div style={cardButtonStyle} className="card-button">
        <div style={cardContentStyle} className="card-content">
          <div style={cardHeaderStyle} className="card-header">
            <h2 style={{ margin: 'auto', padding: 8 }}>{completed ? title + ' Connected' : 'Connect to ' + title}</h2>

          </div>
          <p>{description}</p>
          <div style={{ marginLeft: 'auto', marginRight: 'auto' }}>
            {Connect}
          </div>
        </div>
      </div>
      <div style={statusIconStyle2} className="status-icon">
        {completed ? <> &#10003;</> : <>&#10003;</>}
      </div>
    </CardButtonWrapper>
  );
};

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
  const [serverAddress, setServerAddress] = useState(PEER_ADDRESS);
  const [sismoResponse, setSismoResponse] = useState(null);
  const [identificationMethod, setIdentificationMethod] = useState('Sismo');
  const [vcid, setVcid] = useState(DISCO_TEST_VC_ID);
  const [discoApiKey, setDiscoApiKey] = useState(DISCO_TEST_API_KEY);
  const issuer = DISCO_ISSUER;

  const handleVerify = async () => {
    const encodedId = encodeURIComponent(vcid);
    const apiUrl = `https://api.disco.xyz/v1/credential/${encodedId}`;
    const headers = new Headers({
      'Authorization': `Bearer ${discoApiKey}`,
    });

    try {
      const response = await fetch(apiUrl, { headers });
      // console.log(response);
      if (response.ok) {
        const data = await response.json();
        console.log(data);
        const memberId = data.vc.credentialSubject.memberId;
        setNick(memberId);
        return data;
      } else {
        throw new Error(`Failed to fetch data: ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      console.error(error);
    }
  };

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
                    convRef.current.send("/topic");
                    convRef.current.send("/names");
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

  const handleNickInputChange = (event) => {
    setNick(event.target.value);
  };
  const handleServerInputChange = (event) => {
    setServerAddress(event.target.value);
  };

  return (
    <div className={styles.Home}>

      {/* Display the ConnectWallet component if not connected */}
      <div className={styles.thirdWeb}>
        <div style={{
          background: "orange",
          height: "1000px",
          width: "90%",
          borderRadius: "10px",
          margin: "200px",
          padding: "20px",
          color: "white",
        }}>
          <div style={{ display: 'initial' }}>
            <h1 style={{
              fontFamily: 'Sarala-Regular',
              fontSize: "100px",
              fontWeight: "bold",
              margin: "auto",
            }}>  
              SmolTalk
              <span style={{
                display: 'inline-block',
                padding: '0px 8px 0 0',
                background: 'white',
                borderRadius: '10px',
                height: '124px',
                margin: '0 0 0 16px',
              }}>
                <img
                  src="smoltalk111logo.gif"
                  alt="SmolTalk logo"
                  width={111}
                  style={{ borderRadius: '10px', marginLeft: '10px' }}
                />
              </span>
              <SlidingText />
            </h1>
            <h2>Private Data Group Chat with ZK privacy powered by Sismo, friends with Disco</h2>


            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>


              <div style={{ padding: '20px' }}>
                <div>
                  <label style={{ display: 'block' }}>Identification method</label>
                  <label style={{ marginRight: '10px' }}>
                    <input
                      type="radio"
                      value="Sismo"
                      checked={identificationMethod === 'Sismo'}
                      onChange={() => setIdentificationMethod('Sismo')}
                    />
                    Sismo
                  </label>
                  <label>
                    <input
                      type="radio"
                      value="Disco"
                      checked={identificationMethod === 'Disco'}
                      onChange={() => setIdentificationMethod('Disco')}
                    />
                    Disco
                  </label>
                </div>

                {identificationMethod === 'Disco' && (
                  <div style={{ display: 'flex' }}>
                    <label style={{ display: 'block', marginTop: '10px' }}>
                      VC ID for membership from {issuer}
                    </label>
                    <input
                      type="text"
                      value={vcid}
                      onChange={(e) => setVcid(e.target.value)}
                      style={{
                        fontSize: "20px",
                        padding: "10px",
                        margin: "10px",
                        width: "100%",
                      }}
                    />

                    <label style={{ display: 'block', marginTop: '10px' }}>
                      Disco API Key
                    </label>
                    <input type="text" value={discoApiKey} onChange={(e) => setDiscoApiKey(e.target.value)} />
                    <button style={{}} onClick={handleVerify}>Verify</button>
                    <div >
                    </div>
                  </div>
                )}

              </div>








              <label htmlFor="nickname">Nickname:</label>
              <input
                type="text"
                id="nickname"
                onKeyPress={handleNickInputChange}
                onChange={handleNickInputChange}
                value={nick}
                placeholder="^[a-z_][a-z0-9_-]{2,15}$"
                style={{
                  fontSize: "50px",
                  padding: "10px",
                  margin: "10px",
                  width: "300px",
                }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <label htmlFor="serverAddress">Server Address:</label>
              <input
                type="text"
                id="serverAddress"
                onKeyPress={handleServerInputChange}
                onChange={handleServerInputChange}
                value={serverAddress}
                placeholder="0x"
                style={{
                  fontSize: "30px",
                  padding: "10px",
                  margin: "10px",
                  width: "100%",
                }}
              />
            </div>

          </div>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            gap: '16px'
          }}>
            <CardButton index={1} title="Sismo"
              disabled={identificationMethod !== 'Sismo'}
              completed={sismoResponse !== null}
              Connect={<Sismo setSismoResponse={setSismoResponse} />}
              description="Connect to Sismo to prove data group membership while hiding your identity. You must be a member of group 0x to join the chat. " />
            <CardButton index={2} title="Wallet"
              completed={isConnected}
              Connect={<ConnectWallet theme="dark" />}
              description="Connect your Ethereum (EVM) wallet to connect to the XMTP network. Use any account, it doesn't need to be the same as the Sismo group member. " />
            <CardButton index={3} title="XMTP"
              completed={isOnNetwork}
              Connect={<button
                disabled={!isConnected}
                onClick={initXmtp} className={isConnected ? styles.btnXmtp : ''}
                style={{ color: '#000', fontWeight: 800, padding: 12, textAlign: 'center' }}>
                {isConnected ? 'Connect to XMTP' : 'Connect Wallet First'}
              </button>}
              description="Connect to XMTP by signing in with your wallet and communicate with others in the group. First time requires 2 signatures." />
            {/* <div style={{
                display: 'inline-block',
                width: '300px',
                height: '300px',
                borderRadius: '50%',
              }}>
              </div>           */}
            {/* <ConnectWallet theme="dark" /> */}

          </div>
        </div>
        {/* <img
            src="thirdweb-logo-transparent-white.svg"
            alt="Your image description"
            width={200}
          /> */}
        {/* <Sismo setSismoResponse={setSismoResponse} />
          <ConnectWallet theme="dark" /> */}
      </div>
      {/* Display XMTP connection options if connected but not initialized */}
      {/* {isConnected && !isOnNetwork && (
        <div className={styles.xmtp}>
          <ConnectWallet theme="light" />
          <button onClick={initXmtp} className={styles.btnXmtp}>
            Connect to XMTP
          </button>
        </div>
      )} */}
      {/* <div>
        mode {getSetModes(modeRef.current)}
      </div> */}
      {/* Render the Chat component if connected, initialized, and messages exist */}
      {isConnected && isOnNetwork && messages && (
        <Chat
          client={clientRef.current}
          conversation={convRef.current}
          messageHistory={messages}
        />
      )}
    </div>
  );
}
