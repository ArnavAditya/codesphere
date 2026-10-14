import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { authActions } from '../store/slices/authSlice';

export default function FriendRequests() {
  const user = useSelector(state => state.auth.user);
  const dispatch = useDispatch();
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5555';
  const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });
  const refresh = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/user/requests`, { headers: headers() });
      setRequests(response.data);
      setError('');
    } catch (err) { setError(err.response?.data?.message || err.message); }
  };
  useEffect(() => {
    if (!user) { setRequests([]); return; }
    refresh();
    const timer = setInterval(refresh, 15000);
    return () => clearInterval(timer);
  }, [user?._id]);
  const decide = async (id, action) => {
    setBusy(true);
    try {
      const response = await axios.patch(`${apiUrl}/api/user/requests/${id}`, { action }, { headers: headers() });
      dispatch(authActions.login({ user: response.data.user }));
      await refresh();
    } catch (err) { setError(err.response?.data?.message || err.message); }
    finally { setBusy(false); }
  };
  if (!user) return null;
  return <section className="surface requests-panel">
    <div className="section-heading"><h2>Connections</h2><button className="text-link" onClick={refresh}>Refresh</button></div>
    {error && <p role="alert">{error}</p>}
    {!requests.length && <div className="request-empty"><span>✧</span><p>You’re all caught up.</p><small>New friend requests will appear here.</small></div>}
    {requests.map(request => {
      const incoming = request.recipient?._id === user._id;
      const person = incoming ? request.sender : request.recipient;
      return <div key={request._id} className="request-row">
        <span>{person?.firstName} {person?.lastName} {incoming ? '' : '— request sent'}</span>
        {incoming && <>
          <button className="button button-subtle" disabled={busy} onClick={() => decide(request._id, 'accept')}>Accept</button>
          <button className="button button-subtle" disabled={busy} onClick={() => decide(request._id, 'reject')}>Reject</button>
        </>}
      </div>;
    })}
  </section>;
}
