



import React, { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import { io } from "socket.io-client";

import styles from  "../styles/videoComponent.module.css";
import { TextField, Button, Badge } from "@mui/material";
import {IconButton} from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import ChatIcon from '@mui/icons-material/Chat';
import baseURL from '../environment';

const server_url = baseURL;

// Peer connections keyed by remote socket id. Kept outside component state
// because RTCPeerConnection objects are mutable and shouldn't trigger re-renders.
var connections = {};

const peerConfigConnections = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export default function VideoMeetComponent() {

  var socketRef = useRef();

  let socketIdRef = useRef();

  let localVideoRef = useRef();

  let routeTo = useNavigate();

  let [videoAvailable, setVideoAvailable] = useState(true);

  let [audioAvailable, setAudioAvailable] = useState(true);

  let [video, setVideo] = useState(false);

  let [audio, setAudio] = useState(false);

  let [screen, setScreen] = useState(false);

  let [showModal, setModal] = useState(true);

  let [screenAvailable, setScreenAvailable] = useState(false);

  let [messages, setMessages] = useState([]);

  let [message, setMessage] = useState("");

  let [newMessages, setNewMessages] = useState(3);

  let [askForUsername, setAskForUsername] = useState(true);

  let [username, setUsername] = useState("");

  const videoRef = useRef([]);

  let [videos, setVideos] = useState([]);

  // ---------- helpers: fake black/silent tracks for when camera/mic are off ----------

  let silence = () => {
    let ctx = new AudioContext();
    let oscillator = ctx.createOscillator();
    let dst = oscillator.connect(ctx.createMediaStreamDestination());
    oscillator.start();
    ctx.resume();
    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
  };

  let black = ({ width = 640, height = 480 } = {}) => {
    let canvas = Object.assign(document.createElement("canvas"), { width, height });
    canvas.getContext('2d').fillRect(0, 0, width, height);
    let stream = canvas.captureStream();
    return Object.assign(stream.getVideoTracks()[0], { enabled: false });
  };

  let blackSilence = (...args) => new MediaStream([black(...args), silence()]);

  let pushLocalStreamToPeers = (stream) => {
    for (let id in connections) {
      if (id === socketIdRef.current) continue;

      const pc = connections[id];
      const senders = pc.getSenders();
      let needsRenegotiation = false;

      stream.getTracks().forEach((track) => {
        const sender = senders.find((s) => s.track && s.track.kind === track.kind);
        if (sender) {
          sender.replaceTrack(track).catch((e) => console.error("[replaceTrack]", e));
        } else {
          pc.addTrack(track, stream);
          needsRenegotiation = true;
        }
      });

      if (needsRenegotiation) {
        pc.createOffer()
          .then((description) => pc.setLocalDescription(description))
          .then(() => {
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({ sdp: pc.localDescription })
            );
          })
          .catch((e) => console.error("[renegotiation]", e));
      }
    }
  };

  // ---------- permissions & local media ----------

  const getPermissions = async () => {
    let hasVideo = false;
    let hasAudio = false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => track.stop());
      hasVideo = true;
    } catch (e) {
      console.warn("[getPermissions] video check failed:", e.name, e.message);
      hasVideo = false;
    }
    setVideoAvailable(hasVideo);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      hasAudio = true;
    } catch (e) {
      console.warn("[getPermissions] audio check failed:", e.name, e.message);
      hasAudio = false;
    }
    setAudioAvailable(hasAudio);

    setScreenAvailable(!!navigator.mediaDevices.getDisplayMedia);

    if (hasVideo || hasAudio) {
      try {
        const userMediaStream = await navigator.mediaDevices.getUserMedia({
          video: hasVideo,
          audio: hasAudio,
        });
        window.localStream = userMediaStream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = userMediaStream;
        }
      } catch (err) {
        console.error("[getPermissions] initial stream acquisition failed:", err.name, err.message);
      }
    } else {
      console.warn("[getPermissions] neither camera nor mic available — falling back to black/silent stream");
      window.localStream = blackSilence();
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = window.localStream;
      }
    }
  };

  useEffect(() => {
    // Defensive reset: `connections` is a module-level object, not component
    // state, so it can survive across an unmount/remount (e.g. React 18
    // StrictMode's dev double-invoke, or a fast route change). Without this,
    // a stale connection object could block a fresh RTCPeerConnection from
    // ever being created for the same peer id in this session.
    for (let id in connections) {
      try {
        connections[id].close();
      } catch (e) {}
    }
    connections = {};

    getPermissions();

    return () => {
      for (let id in connections) {
        try {
          connections[id].close();
        } catch (e) {}
      }
      connections = {};

      try {
        window.localStream && window.localStream.getTracks().forEach((t) => t.stop());
      } catch (e) {}

      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  let getUserMediaSuccess = (stream) => {
    try {
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch (e) {
      console.log(e);
    }

    window.localStream = stream;
    localVideoRef.current.srcObject = stream;

    pushLocalStreamToPeers(stream);

    stream.getTracks().forEach(
      (track) =>
        (track.onended = () => {
          setVideo(false);
          setAudio(false);

          try {
            let tracks = localVideoRef.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
          } catch (e) {
            console.log(e);
          }

          window.localStream = blackSilence();
          localVideoRef.current.srcObject = window.localStream;

          pushLocalStreamToPeers(window.localStream);
        })
    );
  };

  let getUserMedia = () => {
    if ((video && videoAvailable) || (audio && audioAvailable)) {
      navigator.mediaDevices
        .getUserMedia({ video: video, audio: audio })
        .then(getUserMediaSuccess)
        .catch((e) => {
          console.error("[getUserMedia] failed:", e.name, e.message);
        });
    } else {
      try {
        let tracks = localVideoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      } catch (e) {}

      window.localStream = blackSilence();
      localVideoRef.current.srcObject = window.localStream;
      pushLocalStreamToPeers(window.localStream);
    }
  };

  useEffect(() => {
    if (video !== undefined && audio !== undefined) {
      getUserMedia();
    }
  }, [audio, video]);

  // ---------- screen share ----------

  let getDisplayMediaSuccess = (stream) => {
    try {
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch (e) {}

    window.localStream = stream;
    localVideoRef.current.srcObject = stream;

    pushLocalStreamToPeers(stream);

    stream.getTracks().forEach(
      (track) =>
        (track.onended = () => {
          setScreen(false);

          try {
            let tracks = localVideoRef.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
          } catch (e) {
            console.log(e);
          }

          window.localStream = blackSilence();
          localVideoRef.current.srcObject = window.localStream;

          pushLocalStreamToPeers(window.localStream);
        })
    );
  };

  useEffect(() => {
    if (screen !== undefined) {
      if (screen) {
        navigator.mediaDevices
          .getDisplayMedia({ video: true, audio: true })
          .then(getDisplayMediaSuccess)
          .catch((e) => {
            console.error("[getDisplayMedia] failed:", e.name, e.message);
            setScreen(false);
          });
      } else {
        getUserMedia();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  // ---------- signalling ----------

  let gotMessageFromServer = (fromId, message) => {
    var signal = JSON.parse(message);

    if (fromId !== socketIdRef.current) {
      if (!connections[fromId]) {
        console.warn("[signal] received signal from unknown peer, ignoring:", fromId);
        return;
      }

      if (signal.sdp) {
        connections[fromId]
          .setRemoteDescription(new RTCSessionDescription(signal.sdp))
          .then(() => {
            if (signal.sdp.type === "offer") {
              connections[fromId]
                .createAnswer()
                .then((description) => {
                  connections[fromId]
                    .setLocalDescription(description)
                    .then(() => {
                      socketRef.current.emit(
                        "signal",
                        fromId,
                        JSON.stringify({ sdp: connections[fromId].localDescription })
                      );
                    })
                    .catch((e) => console.error("[setLocalDescription]", e));
                })
                .catch((e) => console.error("[createAnswer]", e));
            }
          })
          .catch((e) => console.error("[setRemoteDescription]", e));
      }
      if (signal.ice) {
        connections[fromId]
          .addIceCandidate(new RTCIceCandidate(signal.ice))
          .catch((e) => console.error("[addIceCandidate]", e));
      }
    }
  };

  let addMessage = (data, sender, socketIdSender) => {
    setMessages((prevMessages) => [...prevMessages, { sender, data }]);
    if (socketIdSender !== socketIdRef.current) {
      setNewMessages((prev) => prev + 1);
    }
  };

  let sendMessage = () => {
    if (!message.trim()) return;
    socketRef.current.emit("chat-message", message, username);
    setMessage("");
  };

  let connectToSocketServer = () => {
    socketRef.current = io(server_url);

    socketRef.current.on("connect_error", (err) => {
      console.error("[socket] connect_error:", err.message);
    });

    socketRef.current.on("signal", gotMessageFromServer);

    socketRef.current.on("connect", () => {
      socketRef.current.emit("join-call", window.location.href);

      socketIdRef.current = socketRef.current.id;

      socketRef.current.on("chat-message", addMessage);

      socketRef.current.on("user-left", (id) => {
        setVideos((prevVideos) => {
          const updated = prevVideos.filter((v) => v.socketId !== id);
          videoRef.current = updated;
          return updated;
        });

        if (connections[id]) {
          try {
            connections[id].close();
          } catch (e) {}
          delete connections[id];
        }
      });

      socketRef.current.on("user-joined", (id, clients) => {
        clients.forEach((socketListId) => {
          // Never open a peer connection to yourself.
          if (socketListId === socketIdRef.current) return;

          // Don't recreate a connection that's already open.
          if (connections[socketListId]) return;

          connections[socketListId] = new RTCPeerConnection(peerConfigConnections);

          connections[socketListId].onicecandidate = (event) => {
            if (event.candidate !== null) {
              socketRef.current.emit(
                "signal",
                socketListId,
                JSON.stringify({ ice: event.candidate })
              );
            }
          };

          // Debug logging — watch these in devtools console to see exactly
          // where a connection stalls (checking/failed/disconnected, etc).
          connections[socketListId].oniceconnectionstatechange = () => {
            const state = connections[socketListId].iceConnectionState;
            console.log(`[ICE][${socketListId}]`, state);
            if (state === "failed") {
              console.error(`[ICE][${socketListId}] connection FAILED — likely network/firewall/NAT issue`);
            }
          };
          connections[socketListId].onconnectionstatechange = () => {
            console.log(
              `[PC][${socketListId}]`,
              connections[socketListId].connectionState
            );
          };

          connections[socketListId].ontrack = (event) => {
            const remoteStream = event.streams[0];
            console.log(`[ontrack] from ${socketListId}`, remoteStream.getTracks().map(t => t.kind));

            setVideos((prevVideos) => {
              const exists = prevVideos.find((v) => v.socketId === socketListId);
              let updated;
              if (exists) {
                updated = prevVideos.map((v) =>
                  v.socketId === socketListId ? { ...v, stream: remoteStream } : v
                );
              } else {
                updated = [
                  ...prevVideos,
                  {
                    socketId: socketListId,
                    stream: remoteStream,
                    autoPlay: true,
                    playsinline: true,
                  },
                ];
              }
              videoRef.current = updated;
              return updated;
            });
          };

          const localStream = window.localStream || blackSilence();
          window.localStream = localStream;
          localStream.getTracks().forEach((track) => {
            connections[socketListId].addTrack(track, localStream);
          });
        });

        // Once *we* have joined, offer our stream to everyone already in the call.
        if (id === socketIdRef.current) {
          for (let id2 in connections) {
            if (id2 === socketIdRef.current) continue;

            connections[id2]
              .createOffer()
              .then((description) => {
                connections[id2]
                  .setLocalDescription(description)
                  .then(() => {
                    socketRef.current.emit(
                      "signal",
                      id2,
                      JSON.stringify({ sdp: connections[id2].localDescription })
                    );
                  })
                  .catch((e) => console.error("[setLocalDescription offer]", e));
              })
              .catch((e) => console.error("[createOffer]", e));
          }
        }
      });
    });
  };

  let getMedia = () => {
    setVideo(videoAvailable);
    setAudio(audioAvailable);
    connectToSocketServer();
  };


  let connect = () => {
    setAskForUsername(false);
    getMedia();
  };

  let handleVideo = () => setVideo((v) => !v);
  let handleAudio = () => setAudio((a) => !a);
  let handleScreen = () => setScreen((s) => !s);

  let handleEndCall = () =>{
    try{
      let tracks = localVideoRef.current.srcObject.getTracks();
      tracks.forEach(track  => track.stop());
    } catch(e){}
    routeTo("/home");

    
  }

  // let sendMessage = () =>{
  //   socketRef.current.emit("chat-message", message, username);
  //   setMessage("");
  // }

  return (
    <div>
      {askForUsername === true ? (
        <div>
          <h2>Enter into Lobby</h2>
          <TextField
            id="outlined-basic"
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            variant="outlined"
          />
          <Button variant="contained" onClick={connect}>
            Connect
          </Button>

          <div>
            <video ref={localVideoRef} autoPlay muted></video>
          </div>
        </div>
      ) : (
        <div className={styles.meetVideoContainer}>

          {showModal ?
         <div className={styles.chatRoom}>
    
          <div className={styles.chatContainer}> 
                  <h1>Chat</h1>
                  <div className={styles.chattingDisplay}>

                   { messages.length > 0 ? messages.map((item, index) => {
                    return (
                      <div style={{marginBottom: "20px"}} key={index}>
                        <p style={{fontWeight:"bold"}}>{item.sender}</p>
                        <p>{item.data}</p>
                      </div>
                    )
                   }) : <p>No messages yet</p> }

                  </div>

      
               <div className={styles.chattingArea}>
                   
                  <TextField value={message} onChange={(e) => setMessage(e.target.value)} id="outlined-basic" label="Enter Your chat" variant="outlined" />
                  <Button variant="contained" onClick={sendMessage}>
                    Send
                  </Button>
                </div>
          </div>

         </div> : <></>}

          <div className={styles.buttonContainers}>
            <IconButton onClick={handleVideo} style={{ color: "white" }}>
              {video === true ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton>

            <IconButton  onClick={handleEndCall} style={{ color: "Red" }}>
              <CallEndIcon />
            </IconButton>

            <IconButton onClick={handleAudio} style={{ color: "white" }}>
              {audio === true ? <MicIcon /> : <MicOffIcon />}
            </IconButton>

            {screenAvailable === true ? (
              <IconButton onClick={handleScreen} style={{ color: "white" }}>
                {screen === true ? <ScreenShareIcon /> : <StopScreenShareIcon />}
              </IconButton>
            ) : (
              <></>
            )}

            <Badge badgeContent={newMessages} max={999} color="secondary">
              <IconButton onClick={() => setModal(!showModal)} style={{ color: "white" }}>
                <ChatIcon />
              </IconButton>
            </Badge>
          </div>

          <video className={styles.meetUserVideo} ref={localVideoRef} autoPlay muted></video>

          <div className={styles.conferenceView}>
            {videos.map((v) => (
              <div key={v.socketId + "-" + (v.stream ? v.stream.id : "pending")}>
                <video
                  data-socket={v.socketId}
                  ref={(ref) => {
                    if (ref && v.stream && ref.srcObject !== v.stream) {
                      ref.srcObject = v.stream;
                    }
                  }}
                  autoPlay
                  playsInline
                ></video>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}