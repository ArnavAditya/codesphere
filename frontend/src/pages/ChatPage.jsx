import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import ChatPreview from '../components/chatPreview';
import ChatWindow from '../components/ChatWindow';
import CreateGroupModal from '../components/CreateGroupModal';
import { FiPlus, FiMessageSquare } from 'react-icons/fi';

const ChatPage = () => {
  const token = localStorage.getItem('token');
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const user = useSelector((state) => state.auth.user);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5555';

  const fetchChats = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/chat`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setChats(response.data);
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  };

  const fetchFriends = async (query) => {
    try {
      const response = await axios.get(`${apiUrl}/api/user/friends/search?q=${query}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    if (e.target.value) {
      fetchFriends(e.target.value);
    } else {
      setSearchResults([]);
    }
  };

  const handleStartChat = async (friend) => {
    try {
      const response = await axios.post(`${apiUrl}/api/chat`, {
        userId: friend._id,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setChats((prevChats) => [response.data, ...prevChats.filter(item => item._id !== response.data._id)]);
      setSelectedChat(response.data);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error starting chat:', error.response ? error.response.data : error.message);
    }
  };

  useEffect(() => {
    fetchChats();
  }, [token]);

  return <div className="page-shell"><div className="page-heading"><div><p className="eyebrow">GOOD CONVERSATIONS, GREAT IDEAS</p><h1>Stay in the loop<span className="accent">.</span></h1><p className="muted">A space to share ideas, ask questions, and build together.</p></div></div><div className={`surface chat-layout ${selectedChat ? 'has-selection' : ''}`}><aside className="chat-sidebar"><div className="section-heading"><h2>Messages <span className="count-badge">{chats.length}</span></h2><button className="icon-button" aria-label="Create group chat" onClick={() => setShowModal(true)}><FiPlus /></button></div><input aria-label="Find someone to message" value={searchQuery} onChange={handleSearchChange} placeholder="Search people..." /><div className="chat-list">{searchQuery ? searchResults.length ? searchResults.filter(person => person._id !== user?._id).map(friend => <button className="chat-select" key={friend._id} onClick={() => handleStartChat(friend)}><ChatPreview chat={friend} /></button>) : <p className="muted">No people found.</p> : chats.length ? chats.map(chat => <button className={`chat-select ${selectedChat?._id === chat._id ? 'selected' : ''}`} key={chat._id} onClick={() => setSelectedChat(chat)}><ChatPreview chat={chat} /></button>) : <div className="empty-state"><p>No conversations yet. Search for someone to say hello.</p></div>}</div></aside><main className="chat-main">{selectedChat ? <ChatWindow chat={selectedChat} onBack={() => setSelectedChat(null)} /> : <div className="empty-state" style={{ height: '100%' }}><FiMessageSquare className="chat-empty-icon" /><h2>Every great idea starts with a hello.</h2><p>Choose a conversation or find someone new to start chatting.</p></div>}</main>{showModal && <CreateGroupModal onClose={() => setShowModal(false)} onCreated={chat => { setChats(previous => [chat, ...previous.filter(item => item._id !== chat._id)]); setSelectedChat(chat); }} />}</div></div>;
};
export default ChatPage;
