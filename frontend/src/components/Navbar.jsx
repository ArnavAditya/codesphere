import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FiSearch, FiGrid, FiMessageSquare, FiCode, FiLogOut, FiArrowUpRight } from 'react-icons/fi';
import useDebounce from '../hooks/useDebounce';
import axios from 'axios';
import { authActions } from '../store/slices/authSlice';

export default function Navbar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const debouncedQuery = useDebounce(query, 350);
  const { user, isLogged } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5555';
  useEffect(() => {
    if (!debouncedQuery.trim() || !isLogged) { setResults([]); return; }
    const controller = new AbortController();
    axios.get(`${apiUrl}/api/user/searchUsers`, {
      params: { query: debouncedQuery }, signal: controller.signal,
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    }).then(response => setResults(response.data)).catch(() => setResults([]));
    return () => controller.abort();
  }, [debouncedQuery, isLogged]);
  return <header className="site-header">
    <div className="nav-inner">
      <Link to={isLogged ? '/home' : '/'} className="brand" aria-label="Codosphere home"><span className="brand-mark">c<span>:</span></span>Codosphere<span className="brand-dot">.</span></Link>
      {isLogged ? <>
        <nav className="main-nav" aria-label="Main navigation">
          <NavLink to="/home"><FiGrid /><span>Feed</span></NavLink>
          <NavLink to="/chat"><FiMessageSquare /><span>Messages</span></NavLink>
          <NavLink to="/codeEditor"><FiCode /><span>Playground</span></NavLink>
        </nav>
        <div className="nav-search"><FiSearch /><input aria-label="Search people" placeholder="Find your people…" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Escape') setQuery(''); }} />
          {query && <div className="search-results">
            <div className="eyebrow">People</div>
            {results.length ? results.map(person => <Link key={person._id} to={`/dashboard/${person._id}`} onClick={() => setQuery('')}><span className="initial-avatar">{person.firstName?.[0]}{person.lastName?.[0]}</span><span>{person.firstName} {person.lastName}</span><FiArrowUpRight /></Link>) : <p className="muted">No matches yet. Try a name.</p>}
          </div>}
        </div>
        <Link to={`/dashboard/${user?._id}`} className="nav-avatar" aria-label="Your profile">{user?.firstName?.[0]}{user?.lastName?.[0]}</Link>
        <button className="icon-button logout-button" title="Log out" aria-label="Log out" onClick={() => dispatch(authActions.logout())}><FiLogOut /></button>
      </> : <Link className="button button-subtle" to="/login">Sign in <FiArrowUpRight /></Link>}
    </div>
  </header>;
}
