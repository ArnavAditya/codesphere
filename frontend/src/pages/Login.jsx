import AuthLayout from '../components/AuthLayout';

import React, { useState } from 'react';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { authActions } from '../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  const [inputs, setInputs] = useState({ email: "", password: "" });
  const dispatch = useDispatch();
  const [errorMessage, setErrorMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5555';

  const change = (e) => {
    const { name, value } = e.target;
    setInputs({ ...inputs, [name]: value });
  };

  const submit = async (e) => {
    e.preventDefault();

    setBusy(true);
    setErrorMessage('');
    try {
      const response = await axios.post(`${apiUrl}/api/auth/login`, inputs);
      const token = response.data.token;
      const user = response.data.user;

      localStorage.setItem("token", token);
      dispatch(authActions.login({ user: user }));

      // Redirect to the home page after successful login
      navigate('/home');
    } catch (error) {
      setErrorMessage(error.response?.data?.msg || error.response?.data?.error || 'Unable to sign in. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return <AuthLayout title="Welcome back." subtitle="Pick up where you left off. Your community is waiting.">
    <form onSubmit={submit} className="auth-form"><label htmlFor="email">Email address</label><input id="email" name="email" type="email" autoComplete="email" required value={inputs.email} onChange={change} placeholder="you@example.com" /><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="current-password" required value={inputs.password} onChange={change} placeholder="Enter your password" />{errorMessage && <p role="alert" className="error-notice">{errorMessage}</p>}<button disabled={busy} className="button button-primary">{busy ? 'Signing in…' : 'Sign in →'}</button></form><p className="auth-switch">New around here? <button onClick={() => navigate('/')}>Create an account</button></p>
  </AuthLayout>;
};
export default Login;
