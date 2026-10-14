import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import io from 'socket.io-client';
import axios from 'axios';
import { FiArrowLeft, FiSend } from 'react-icons/fi';
import { ClipLoader } from 'react-spinners';

const ChatWindow = ({ chat, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const user = useSelector((state) => state.auth.user);
  const socketRef = useRef();
  const messagesEndRef = useRef(null);
  const typingTimer = useRef(null);
  const currentChat = useRef(chat._id);
  currentChat.current = chat._id;
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5555';
  useEffect(() => {
    const socket = io(apiUrl, { auth: { token: localStorage.getItem('token') } });
    socketRef.current = socket;


    socket.on("connected", () => console.log("Socket connected"));
    socket.on("typing", ({ chatId }) => { if (chatId === chat._id) setIsTyping(true); });
    socket.on("stop typing", ({ chatId }) => { if (chatId === chat._id) setIsTyping(false); });
    socket.on('message received', (message) => {
      console.log(" This message was recieved from backend -----> \n" , message );
      if (message.chat?._id !== chat._id) return;
      setMessages(previous => previous.some(item => item._id === message._id) ? previous : [...previous, message]);
    });

    return () => {
      clearTimeout(typingTimer.current);
      socket.disconnect();
    };
  }, [chat,user]);

  useEffect(() => {
    let active = true;
    setMessages([]);
    setIsTyping(false);
    if (chat) {
      const fetchChatMessages = async () => {
        try {
          setLoading(true);
          const response = await axios.get(`${apiUrl}/api/message/${chat._id}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          });

          if (!active) return;
          setLoading(false);
          setMessages(previous => [...new Map([...response.data, ...previous].map(message => [message._id, message])).values()]);

          //socketRef.current.emit("join chat", chat._id);
        } catch (error) {
          console.error('Error fetching chat messages:', error);
          if (active) setLoading(false);
        }
      };
      fetchChatMessages();
    }
    return () => { active = false; };
  }, [chat]);

  const sendMessage = async () => {
    if (newMessage.trim() === '') return;

    const chatId = chat._id;
    try {
      socketRef.current.emit("stop typing", chatId);
      const response = await axios.post(
        `${apiUrl}/api/message`,
        { content: newMessage, chatId: chat._id },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      if (currentChat.current === chatId) {
        setNewMessage('');
        setMessages((prevMessages) => [...prevMessages, response.data]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  const typingHandler = (e) => {
    setNewMessage(e.target.value);

    socketRef.current.emit("typing", chat._id);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => socketRef.current.emit("stop typing", chat._id), 3000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessageContent = (content) => {
    return content.split('\n').map((line, index) => (
      <span key={index}>
        {line}
        <br />
      </span>
    ));
  };

  let nextPerson = chat.users[0]._id;
  let profilePictureUrl;
  if (!chat.isGroupChat) {
    if (nextPerson === user._id) {
      nextPerson = chat.users[1].firstName;
      profilePictureUrl = chat.users[1].picturePath;
    } else {
      nextPerson = chat.users[0].firstName;
      profilePictureUrl = chat.users[0].picturePath;
    }
  } else {
    nextPerson = chat.chatName;
  }

  return (
    <>
      {user && (
        <div className="chat-window">
          <header className="chat-header">
            <button className="icon-button chat-back" onClick={onBack} aria-label="Back to conversations"><FiArrowLeft /></button>
            {profilePictureUrl ? <img src={profilePictureUrl} alt="" /> : <span className="initial-avatar">{nextPerson?.slice(0, 2).toUpperCase()}</span>}
            <h1 >{nextPerson}</h1>
          </header>
          <div className="chat-messages">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <ClipLoader size={50} color={"#123abc"} loading={loading} />
              </div>
            ) : (
              messages &&
              messages.map((msg) => (
                <div key={msg._id} className={`message-row ${msg.sender._id === user._id ? 'mine' : ''}`}>
                  <div className="message-bubble">
                    <b>{msg.sender.firstName + " " + msg.sender.lastName}</b>
                    {formatMessageContent(msg.content)}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          {isTyping && <p className="typing-status">Typing…</p>}
          <div className="chat-input">
            <textarea
              className="w-full p-2 border border-gray-300 rounded resize-none"
              placeholder="Type a message..."
              value={newMessage}
              onChange={typingHandler}
              onKeyDown={handleKeyDown}
              rows="2"
              aria-label="Message"
            />
            <div className="section-heading"><span className="muted">Enter to send / Shift + Enter for a new line</span><button className="icon-button" onClick={sendMessage} disabled={!newMessage.trim()} aria-label="Send message"><FiSend /></button></div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWindow;



