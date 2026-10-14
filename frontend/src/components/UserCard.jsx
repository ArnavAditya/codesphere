import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Import axios for making HTTP requests
import { useDispatch, useSelector } from 'react-redux';
import { FaUserPlus, FaUserMinus } from 'react-icons/fa'; // Import icons from react-icons library
import { authActions } from '../store/slices/authSlice.jsx';

const UserCard = ({ user,setUser }) => {
  const dispatch = useDispatch();
  const loggedInUser = useSelector((state) => state.auth.user);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [isFriend, setIsFriend] = useState(false); // Initialize isFriend state to false
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5555';

  useEffect(() => {
    setPending(false);
    setError('');
    if (user) {
      setIsFriend(user.friends.includes(loggedInUser?._id)); // Set isFriend based on user's friends list
    }
  }, [user, loggedInUser]); // Update isFriend when user or loggedInUser changes

  const handleAddRemoveFriend = async () => {
    try {
      const token = localStorage.getItem('token');
      setError('');
      if (!isFriend) {
        await axios.post(`${apiUrl}/api/user/requests/${user._id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
        setPending(true);
        return;
      }
      const response = await axios.patch(`${apiUrl}/api/user/${loggedInUser._id}/${user._id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      dispatch(authActions.updateLoggedInUserFriends({ updatedFriends: response.data.userFriends }));
      setUser({ ...user, friends: response.data.friendFriends });
      setIsFriend(false);
    } catch (error) {
      setError(error.response?.data?.message || error.message);
    }
  };

  if (!user) {
    return null; // Or you could return some placeholder content or message
  }

  return <section className="surface profile-card"><div className="profile-avatar">{user.firstName?.[0]}{user.lastName?.[0]}</div><p className="eyebrow">{user.codeForcesHandle || 'COMMUNITY MEMBER'}</p><h2>{user.firstName} {user.lastName}</h2><p className="muted">{user.occupation || 'Developer / Lifelong learner'}</p>{loggedInUser && loggedInUser._id !== user._id && <button className={`button ${isFriend ? 'button-subtle' : 'button-primary'}`} disabled={pending} onClick={handleAddRemoveFriend}>{isFriend ? 'Remove friend' : pending ? 'Request sent' : 'Send friend request'}</button>}{error && <p className="error-notice" role="alert">{error}</p>}<div className="profile-stats"><span><strong>{user.friends?.length || 0}</strong>Connections</span><span><strong>{user.codeForcesHandle ? 'Connected' : '-'}</strong>Codeforces</span></div><div className="profile-detail"><p>{user.email}</p>{user.location && <p>{user.location}</p>}<p>Here to build. Here to grow.</p></div></section>;
};
export default UserCard;
