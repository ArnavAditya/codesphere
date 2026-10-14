export const fetchData = async (codeForcesHandle) => {
    const response = await fetch(`https://codeforces.com/api/user.status?handle=${codeForcesHandle}`);
    const data = await response.json();
    if (!response.ok || data.status !== 'OK' || !Array.isArray(data.result)) {
      throw new Error(data.comment || 'Could not fetch Codeforces submissions');
    }
    const solved = new Map();
    data.result.filter(submission => submission.verdict === 'OK').forEach(submission => {
      const problem = submission.problem;
      solved.set(`${problem.contestId ?? submission.contestId}:${problem.index}`, submission);
    });
    return [...solved.values()];
  };
  
  export const processChartData = (submissions) => {
    const problemRatings = {};
    const tagsCount = {};
  
    submissions.forEach(submission => {
      const { rating, tags } = submission.problem;
  
      // Count problem ratings
      if (rating) {
        if (!problemRatings[rating]) problemRatings[rating] = 0;
        problemRatings[rating] += 1;
      }
  
      // Count tags
      tags.forEach(tag => {
        if (!tagsCount[tag]) tagsCount[tag] = 0;
        tagsCount[tag] += 1;
      });
    });
  
    return {
      problemRatings: Object.entries(problemRatings).map(([rating, count]) => ({ rating: parseInt(rating), count })),
      tagsCount: Object.entries(tagsCount).map(([tag, count]) => ({ tag, count }))
    };
  };