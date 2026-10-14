import useDialog from '../hooks/useDialog';
import React, { useState } from 'react';
import axios from 'axios';
import { FiX, FiSearch, FiUsers } from 'react-icons/fi';

const CreateGroupModal = ({ onClose, onCreated }) => {
  useDialog(true, onClose);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const token = localStorage.getItem('token');
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5555';

  const handleSearch = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/user/searchUsers`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          query: searchQuery,
        },
      });
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const handleAddUser = (user) => {
    
    setSelectedUsers(previous => previous.some(item => item._id === user._id) ? previous : [...previous, user]);
  };

  const handleCreateGroupChat = async () => {
    if (!groupName || selectedUsers.length < 2) {
      // Validate group name and selected users
      setError('Give your group a name and choose at least two people.');
      return;
    }
  
    setError('');
    setBusy(true);
    try {
      const response = await axios.post(
        `${apiUrl}/api/chat/group`,
        {
          name: groupName,
          users: selectedUsers,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      onCreated?.(response.data);
      onClose(); // Close the modal after successful creation
    } catch (error) {
      setError(error.response?.data?.message || 'Could not create the group. Please try again.');
    } finally {
      setBusy(false);
    }
  };


  return <div className="modal-backdrop" onClick={onClose}><section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="group-title" onClick={e => e.stopPropagation()} onKeyDown={e => { if (e.key === 'Escape') onClose(); }}><div className="modal-heading"><div><p className="eyebrow">BRING YOUR PEOPLE TOGETHER</p><h2 id="group-title">New group</h2></div><button className="icon-button" aria-label="Close group form" onClick={onClose}><FiX /></button></div><label className="muted" htmlFor="group-name">Group name</label><input style={{ width: '100%', marginTop: 8 }} id="group-name" value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="The next big idea" /><form className="group-search" onSubmit={e => { e.preventDefault(); handleSearch(); }}><input aria-label="Search group members" placeholder="Find people to invite..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /><button className="button button-subtle" aria-label="Search people"><FiSearch /></button></form><div className="group-users">{searchResults.map(person => <div key={person._id} className="group-user-row"><span>{person.firstName} {person.lastName}</span><button className="text-link" disabled={selectedUsers.some(item => item._id === person._id)} onClick={() => handleAddUser(person)}>{selectedUsers.some(item => item._id === person._id) ? 'Added' : '+ Add'}</button></div>)}</div><div className="member-chips">{selectedUsers.map(person => <button key={person._id} onClick={() => setSelectedUsers(previous => previous.filter(item => item._id !== person._id))} aria-label={`Remove ${person.firstName}`}>{person.firstName}<FiX /></button>)}</div>{error && <p role="alert" className="error-notice">{error}</p>}<div className="modal-footer"><span className="muted">{selectedUsers.length} people selected</span><button className="button button-primary" disabled={busy} onClick={handleCreateGroupChat}><FiUsers />{busy ? 'Creating...' : 'Create group'}</button></div></section></div>;
};
export default CreateGroupModal;
