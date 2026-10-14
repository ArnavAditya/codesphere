import AuthLayout from '../components/AuthLayout';
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Signup = () => {
  const navigate = useNavigate();
  const [inputs, setInputs] = useState({ firstName: "", lastName: "", password: "", confirmPassword: "", email: "" });
  const [errorMessage, setErrorMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [emptyFields, setEmptyFields] = useState([]);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5555';

  const change = (e) => {
    const { name, value } = e.target;
    setInputs({ ...inputs, [name]: value });
  };

  const submit = async (e) => {
    e.preventDefault();

    // Reset empty fields array
    setEmptyFields([]);

    // Check for empty fields
    const emptyFieldsArray = [];
    for (const key in inputs) {
      if (!inputs[key]) {
        emptyFieldsArray.push(key);
      }
    }

    // Highlight empty fields and show alert
    if (emptyFieldsArray.length > 0) {
      setEmptyFields(emptyFieldsArray);
      setErrorMessage("Please fill in all the details.");
      return;
    }

    // Check if passwords match
    if (inputs.password !== inputs.confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    setBusy(true);
    setErrorMessage('');
    try {
      await axios.post(`${apiUrl}/api/auth/register`, {
        firstName: inputs.firstName,
        lastName: inputs.lastName,
        email: inputs.email,
        password: inputs.password,
      });
      navigate("/login");
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Unable to reach the server. Please try again.');
    } finally { setBusy(false); }
  };

  return <AuthLayout title="Find your people." subtitle="Create an account and start building your circle."><form onSubmit={submit} className="auth-form"><div className="form-columns">{[['firstName', 'First name', 'given-name'], ['lastName', 'Last name', 'family-name']].map(([name, label, autocomplete]) => <div key={name}><label htmlFor={name}>{label}</label><input id={name} name={name} autoComplete={autocomplete} required minLength={2} value={inputs[name]} onChange={change} placeholder={label} /></div>)}</div><label htmlFor="email">Email address</label><input id="email" name="email" type="email" autoComplete="email" required value={inputs.email} onChange={change} placeholder="you@example.com" /><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="new-password" required minLength={5} value={inputs.password} onChange={change} placeholder="At least 5 characters" /><label htmlFor="confirmPassword">Confirm password</label><input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required value={inputs.confirmPassword} onChange={change} placeholder="One more time" />{errorMessage && <p role="alert" className="error-notice">{errorMessage}</p>}<button className="button button-primary" disabled={busy}>{busy ? 'Creating your account…' : 'Create account →'}</button></form><p className="auth-switch">Already part of the community? <button onClick={() => navigate('/login')}>Sign in</button></p></AuthLayout>;
};
export default Signup;
