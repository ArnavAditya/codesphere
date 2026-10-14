import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import { fetchData } from '../utils/dataFetcher';

const processChartData = (submissions) => {
  const problemRatings = {};

  submissions.forEach(submission => {
    const { rating } = submission.problem;

    // Count problem ratings
    if (rating) {
      if (!problemRatings[rating]) problemRatings[rating] = 0;
      problemRatings[rating] += 1;
    }
  });

  return Object.entries(problemRatings).map(([rating, count]) => ({ rating: parseInt(rating), count }));
};

const RatVsProb = (props) => {
  const [data, setData] = useState([]);
  const [error, setError] = useState('');
  const user = props.user;

  useEffect(() => {
    const getData = async () => {
      if (!user || !user.codeForcesHandle) {
        setData([]); // Reset data when user or handle is not present
        return;
      }

      try {
      setError('');
      const submissions = await fetchData(user.codeForcesHandle);
      const problemRatings = processChartData(submissions);
      setData(problemRatings);
      } catch (err) { setData([]); setError(err.message); }
    };

    getData();
  }, [user]);

  if (!user || !user.codeForcesHandle) {
    return (
      <div className="surface chart-card">
        <h2 >No Codeforces handle</h2>
      </div>
    ); // Display message if user or codeForcesHandle is not present
  }

  if (error) return <p role="alert">{error}</p>;
  return (
    <div className="surface chart-card">
      <h2 >Problem difficulty</h2>
      <ResponsiveContainer width="100%" height={300}><BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eaf0eb" />
        <XAxis dataKey="rating" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 10 }} />
        <Bar dataKey="count" fill="#8eaf8c" radius={[4,4,0,0]} />
      </BarChart></ResponsiveContainer>
    </div>
  );
};

export default RatVsProb;
