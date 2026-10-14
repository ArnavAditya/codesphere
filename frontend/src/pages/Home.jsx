import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FiArrowUpRight, FiCode, FiUsers, FiActivity } from 'react-icons/fi';
import FriendRequests from '../components/FriendRequests';
import Post from '../components/Post';
import CreatePostForm from '../components/CreatePostForm';
import { ClipLoader } from 'react-spinners';

const Home = () => {
    const token = localStorage.getItem('token');
    const user = useSelector((state) => state.auth.user);
    const [posts, setPosts] = useState([]);
    const [revision, setRevision] = useState(0);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5555';

    useEffect(() => {
        let active = true;
        if (!user) { setPosts([]); setLoading(false); return; }
        setLoading(true);
        setPosts([]);
        setError('');
        axios.get(`${apiUrl}/api/post`, { headers: { Authorization: `Bearer ${token}` } })
            .then(response => { if (active) setPosts(response.data); })
            .catch(err => { if (active) setError(err.response?.data?.message || err.message); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [user, token, revision]);

    return <div className="page-shell">
        <div className="page-heading"><div><p className="eyebrow">YOUR CORNER OF THE INTERNET</p><h1>Good to see you, {user?.firstName}<span className="accent">.</span></h1><p className="muted">Ideas, progress, and a little inspiration from your circle.</p></div><span className="status-pill"><span /> Let’s build something</span></div>
        <div className="feed-layout">
            <aside className="feed-left">
                <section className="surface profile-summary"><div className="profile-cover" /><Link to={`/dashboard/${user?._id}`} className="profile-avatar">{user?.firstName?.[0]}{user?.lastName?.[0]}</Link><h2>{user?.firstName} {user?.lastName}</h2><p className="muted">{user?.occupation || 'Developer · Always learning'}</p><div className="profile-stats"><span><strong>{user?.friends?.length || 0}</strong> Connections</span><span><strong>{user?.codeForcesHandle || '—'}</strong> Codeforces</span></div><Link className="text-link" to={`/dashboard/${user?._id}`}>View your profile <FiArrowUpRight /></Link></section>
                <section className="sidebar-note"><FiUsers /><h3>Better together.</h3><p>Find developers through search, connect, and keep up with what they’re building.</p></section>
            </aside>
            <main className="feed-main">
                {user && <CreatePostForm onCreated={() => setRevision(value => value + 1)} />}
                <div className="section-heading"><h2>Your feed</h2><span className="muted"><FiActivity /> Latest from your circle</span></div>
                {error && <p role="alert" className="error-notice">{error}</p>}
                {loading ? <div className="surface empty-state"><ClipLoader size={28} color="#16816a" /><p>Gathering the latest…</p></div> : posts.length ? posts.map(post => <Post key={post._id} post={post} />) : <div className="surface empty-state"><span className="empty-icon"><FiUsers /></span><h3>Your next connection starts here.</h3><p>Share your first update, or search for a developer and send a friend request to bring your feed to life.</p></div>}
            </main>
            <aside className="feed-right"><FriendRequests /><section className="playground-promo"><span className="promo-icon"><FiCode /></span><p className="eyebrow">A LITTLE SPACE TO EXPERIMENT</p><h2>Got an idea?<br />Give it a run.</h2><p>Open the playground and turn a thought into working code.</p><Link to="/codeEditor" className="button">Open playground <FiArrowUpRight /></Link><div className="code-decoration" aria-hidden="true"><span>const</span> next = build();<br /><span>return</span> somethingGreat;</div></section><p className="sidebar-footer">Codosphere · Built for curious minds.</p></aside>
        </div>
    </div>;
};
export default Home;
