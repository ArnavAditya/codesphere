import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from './components/Navbar';
import { useDispatch, useSelector } from 'react-redux';
import { authActions } from './store/slices/authSlice.jsx';
import { useEffect } from 'react';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Post from './components/Post.jsx';
import CreatePostForm from './components/CreatePostForm.jsx';
import Home from './pages/Home.jsx';
import axios from 'axios';
import Dashboard from './pages/Dashboard.jsx';
import ChatPage from './pages/ChatPage.jsx';
import CodeEditor from './components/CodeEditor.jsx';



export default function App() {
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);
  const protectedPage = page => user ? page : localStorage.getItem('token') ? <p>Loading your account…</p> : <Navigate to="/login" replace />;
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5555';
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get JWT token from local storage (assuming it's stored there after login)
        const token = localStorage.getItem('token');

        if (!token) {
          throw new Error('No token found');
        }

        // Make API call to backend to get user data
        const response = await axios.get(`${apiUrl}/api/user/getUserByjwt`, {
          headers: {
            Authorization: `Bearer ${token}` // Attach JWT token to the request
          }
        });

        // setUserData(response.data);
        dispatch(authActions.login({user:response.data}));
      } catch (error) {
        localStorage.removeItem('token');
        dispatch(authActions.logout());
        console.error(error.message);
      }
    };

    fetchUserData();
  }, []);
  return (
    <div className="app-shell">
      <Router>
        <Navbar />
        <div className="app-content">
          <Routes>
            <Route exact path='/login' element={<Login />} />
            <Route exact path='/' element={<Signup />} />
            <Route exact path='/post' element={<Navigate to="/home" replace />} />
            <Route exact path='/createPost' element={protectedPage(<CreatePostForm />)} />
            <Route exact path='/home' element={protectedPage(<Home />)} />
            <Route exact path='/chat' element={protectedPage(<ChatPage />)} />
            <Route exact path='/dashboard/:id' element={<Dashboard />} />
            <Route exact path='/codeEditor' element={protectedPage(<CodeEditor />)} />
          </Routes>
        </div>
      </Router>
    </div>
  );
}