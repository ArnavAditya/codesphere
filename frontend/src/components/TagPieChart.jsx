import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Tooltip, Legend, Cell, ResponsiveContainer } from 'recharts';

const COLORS = [
  '#39886b', '#8db497', '#d0d8ad', '#e4c18d', '#a6b9c5', '#769e81', '#c7d5ba', '#a0c3b8', '#c5b6a6', '#527863'
];

import { fetchData } from '../utils/dataFetcher';

const processChartData = (submissions) => {
  const tagsCount = {};

  submissions.forEach(submission => {
    const { tags } = submission.problem;

    // Count tags
    tags.forEach(tag => {
      if (!tagsCount[tag]) tagsCount[tag] = 0;
      tagsCount[tag] += 1;
    });
  });

  return Object.entries(tagsCount).map(([tag, count]) => ({ tag, count }));
};

const TagPieChart = (props) => {
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
      const tagsCount = processChartData(submissions);
      setData(tagsCount);
      } catch (err) { setData([]); setError(err.message); }
    };

    getData();
  }, [user]);

  if (!user || !user.codeForcesHandle) {
    return null; // Do not render anything if user or codeForcesHandle is not present
  }

  if (error) return <p role="alert">{error}</p>;
  return (
    <div className="surface chart-card">
      <h2 >Topics explored</h2>
      <div>
        <ResponsiveContainer width="100%" height={300}><PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="tag"
            cx="50%"
            cy="50%"
            outerRadius={88} innerRadius={60} paddingAngle={3}
            fill="#39886b"
            className="focus:outline-none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 10 }} />
        </PieChart></ResponsiveContainer>
      </div>
    </div>
  );
};

export default TagPieChart;
