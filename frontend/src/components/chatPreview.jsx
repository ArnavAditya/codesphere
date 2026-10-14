
import React from 'react';
import { useSelector } from 'react-redux';

const ChatPreview = ({ chat }) => {
  const user = useSelector((state) => state.auth.user);

  // Check if it's a chat object or a search result
  const isChat = chat.users && chat.users.length > 0;

  let chatName;
  let latestMessage = "No messages yet";

  if (isChat) {
    latestMessage = chat.latestMessage ? chat.latestMessage.content : latestMessage;
    const nextPerson = chat.users.find(u => u._id !== user._id);
    chatName = chat.isGroupChat ? chat.chatName : nextPerson ? `${nextPerson.firstName} ${nextPerson.lastName}` : "Unknown";
  } else {
    chatName = `${chat.firstName} ${chat.lastName}`;
  }

  return <div className="chat-preview"><span className="initial-avatar">{chatName?.slice(0, 2).toUpperCase()}</span><div><h3>{chatName}</h3><p>{isChat ? latestMessage : 'Start a conversation'}</p></div></div>;
};
export default ChatPreview;
