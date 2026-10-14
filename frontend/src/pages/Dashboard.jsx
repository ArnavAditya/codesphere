import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useSelector } from 'react-redux'; // Import useSelector for accessing Redux store
import UserCard from "../components/UserCard";
import RatingChart from '../components/RatingsChart';
import AddForcesHandle from "../components/AddForcesHandle";
import TagPieChart from '../components/TagPieChart';
import RatVsProb from '../components/RatVsProb';

const Dashboard = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const loggedInUser = useSelector((state) => state.auth.user); // Get logged-in user from Redux store
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5555';

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`${apiUrl}/api/user/getUserObjId/${id}`);
        setUser(response.data);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    fetchUser();
  }, [id]);

  return <div className="page-shell"><div className="page-heading"><div><p className="eyebrow">DEVELOPER PROFILE</p><h1>A little progress, every day<span className="accent">.</span></h1><p className="muted">Your journey, visualized. Every problem is a step forward.</p></div><span className="status-pill"><span /> Codeforces insights</span></div><div className="profile-layout"><UserCard user={user} setUser={setUser} /><main className="charts-grid">{!user ? <div className="surface empty-state"><p>Loading profile...</p></div> : user.codeForcesHandle ? <><section className="surface chart-card"><p className="eyebrow">THE BIG PICTURE</p><h2>Rating over time</h2><RatingChart user={user} /></section><div className="chart-pair"><TagPieChart user={user} /><RatVsProb user={user} /></div></> : <section className="surface empty-state"><h2>Your next milestone awaits.</h2><p>Connect a Codeforces handle to see rating history, problem difficulty, and the topics you have explored.</p>{loggedInUser?._id === user._id && <AddForcesHandle />}</section>}</main></div></div>;
};
export default Dashboard;
