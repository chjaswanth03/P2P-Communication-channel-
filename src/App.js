import React, { useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';
import SimplePeer from 'simple-peer';
import UserSettings from './UserSettings';

function App() {
  const [peerId, setPeerId] = useState('');
  const [peer, setPeer] = useState(null);
  const [conn, setConn] = useState(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [file, setFile] = useState(null);  // State to store selected file
  const [remoteStream, setRemoteStream] = useState(null);  // Store the remote video stream
  const [myStream, setMyStream] = useState(null);          // Store the local video stream
  const myVideo = useRef(null);
  const remoteVideo = useRef(null);

  useEffect(() => {
    const newPeer = new Peer(undefined, {
      host: 'localhost',
      port: 9000,
      path: '/peerjs'
    });
    setPeer(newPeer);

    newPeer.on('open', id => {
      setPeerId(id);
      console.log('My peer ID is: ' + id);
    });

    newPeer.on('connection', connection => {
      setConn(connection);
      connection.on('data', data => {
        if (data.type === 'message') {
          setMessages(prev => [...prev, `Received: ${data.content}`]);
        } else if (data.type === 'file') {
          const blob = new Blob([data.content]);
          const downloadUrl = URL.createObjectURL(blob);
          setMessages(prev => [
            ...prev,
            <a href={downloadUrl} download={data.fileName} className="text-blue-500 underline">
              Download {data.fileName}
            </a>
          ]);
        }
      });
    });

    return () => {
      if (newPeer) newPeer.destroy();
    };
  }, []);

  const connections = {}; // Store connections for multiple peers
  const [username, setUsername] = useState('');

  const connectToPeer = (peerId) => {
    const connection = peer.connect(peerId);
    connections[peerId] = connection; // Store connection for this peer
    connection.on('open', () => {
      console.log(`Connected to ${peerId}`);
    });
    connection.on('data', data => {
      if (data.type === 'message') {
        setMessages(prev => [...prev, `Received: ${data.content}`]);
      } else if (data.type === 'file') {
        const blob = new Blob([data.content]);
        const downloadUrl = URL.createObjectURL(blob);
        setMessages(prev => [
          ...prev,
          <a href={downloadUrl} download={data.fileName} className="text-blue-500 underline">
            Download {data.fileName}
          </a>
        ]);
      }
    });
  };
  const generatePeerID = () => {
    return Math.floor(1000 + Math.random() * 9000).toString(); // Generates a number between 1000 and 9999
  };
  
  const formatMessage = (message) => {
    // Simple formatting for bold and italics
    const formattedMessage = message
      .replace(/\*(.*?)\*/g, '<strong>$1</strong>') // Bold
      .replace(/_(.*?)_/g, '<em>$1</em>'); // Italics
    return formattedMessage;
  };
  
  const sendMessage = () => {
    if (input) {
      const formattedContent = formatMessage(input); // Format the message
      const message = { username, content: formattedContent }; // Create the message object
  
      conn.send(message); // Send the message over the peer connection
  
      // Update local messages state
      setMessages(prev => [...prev, message]); // Append the message to the local messages
  
      // Save to localStorage
      const updatedMessages = [...messages, message];
      localStorage.setItem('chatHistory', JSON.stringify(updatedMessages)); // Save updated history
  
      setInput(''); // Clear the input field
    }
  };

  <UserSettings username={username} setUsername={setUsername} />
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const sendFile = () => {
    if (conn && file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        conn.send({ type: 'file', content: event.target.result, fileName: file.name });
        setMessages(prev => [...prev, `Sent file: ${file.name}`]);
      };
      reader.readAsArrayBuffer(file);
      setFile(null);
    }
  };
  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      // Replace myStream with screenStream for sharing
      myVideo.current.srcObject = screenStream;
  
      // Call the remote peer with the screen stream
      const call = peer.call(input, screenStream);
  
      call.on('stream', remoteStream => {
        setRemoteStream(remoteStream);
        remoteVideo.current.srcObject = remoteStream;
      });
    } catch (error) {
      console.error('Error accessing display media.', error);
    }
  };
  
  // Function to start video call
  const startVideoCall = async (peerIdToCall) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setMyStream(stream);
      myVideo.current.srcObject = stream;
      
      const call = peer.call(peerIdToCall, stream);

      call.on('stream', remoteStream => {
        setRemoteStream(remoteStream);
        remoteVideo.current.srcObject = remoteStream;
      });
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  };
  const [progress, setProgress] = useState(0); // State for file transfer progress
  
  useEffect(() => {
    const peerId = generatePeerID(); // Generate a 4-digit peer ID
    const peer = new Peer(peerId); // Use the generated peer ID
  
    setPeer(peer); // Store the peer instance
  
    // Notify user of their peer ID
    alert(`Your Peer ID is: ${peerId}`);
  
    // Peer event handlers remain unchanged...
  }, []);
  
  // Function to handle incoming video calls
  useEffect(() => {
    if (peer) {
      peer.on('call', async (call) => {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        call.answer(stream);  // Answer the call with our stream
  
        call.on('stream', remoteStream => {
          // Manage multiple remote streams
          setRemoteStream(remoteStream); // For simplicity, you may want to create a list to handle multiple streams
        });
      });
    }
  }, [peer]);
  

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-r from-blue-500 to-teal-400">
      <h1 className="text-4xl font-bold text-white mb-4">P2P File Sharing & Video Call</h1>
      
      <input
  type="text"
  placeholder="Enter your nick name rowdy"
  value={username}
  onChange={(e) => setUsername(e.target.value)}
  className="border p-2 rounded-lg w-1/3"
  
/>


      <div className="bg-white p-6 rounded-lg shadow-lg w-full md:w-1/2 lg:w-1/3">
        <div className="mb-4">
          <h2 className="text-xl font-bold mb-2">Your Peer ID</h2>
          <p className="text-gray-700"></p>
          <input
  type="text"
  placeholder="Enter 4-Digit Code"
  value={peerId}
  onChange={(e) => setInput(e.target.value)}
  className="border p-2 rounded-lg w-1/3"
/>
          {messages.map((message, index) => (
  <div key={index} className="border-b p-2">
    <strong>{message.username}:</strong> {message.content}
  </div>
))}

        </div>

        <div className="flex mb-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="border rounded-lg p-2 w-full"
            placeholder="Type a message..."
          />
          <button
            onClick={sendMessage}
            className="ml-2 bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Send
          </button>
          <input

/>
        </div>
        {progress > 0 && (
  <div className="mt-2">
    <div className="bg-gray-300 rounded-full h-2">
      <div
        className="bg-green-500 h-2 rounded-full"
        style={{ width: `${progress}%` }}
      ></div>
    </div>
    <span>{Math.round(progress)}%</span>
  </div>
)}


        <div className="flex mb-4">
          <input
            type="file"
            onChange={handleFileChange}
            className="border rounded-lg p-2 w-full"
          />
          <button
            onClick={sendFile}
            className="ml-2 bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Send File
          </button>
        </div>

        {/* Video call section */}
        <div className="mt-4">
          <h2 className="text-xl font-bold mb-2">Video Call</h2>
          <button
            onClick={() => startVideoCall(input)}
            className="bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
                                 Start Video Call
          </button>
        </div>
        <button
  onClick={startScreenShare}
  className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
>
  Share Screen
</button>


        {/* Video streams */}
        <div className="flex justify-between mt-4">
          <div>
            <h3 className="text-gray-700 mb-2">My Video</h3>
            <video ref={myVideo} autoPlay muted className="border rounded-lg w-40 h-40 bg-gray-100"></video>
          </div>
          
          <div>
            <h3 className="text-gray-700 mb-2">Remote Video</h3>
            <video ref={remoteVideo} autoPlay className="border rounded-lg w-40 h-40 bg-gray-100"></video>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
