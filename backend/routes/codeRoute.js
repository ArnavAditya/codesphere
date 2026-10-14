const router = require('express').Router();
const axios = require('axios');
const asyncHandler = require('express-async-handler');
const { verifyToken } = require('../middleware/authMiddleware');
const languages = new Set(['javascript', 'typescript', 'python', 'java', 'csharp', 'c', 'cpp', 'c++']);
function client() {
  if (!process.env.PISTON_URL) {
    const error = new Error('Code execution is unavailable. Please contact the site administrator.');
    error.status = 503;
    throw error;
  }
  return axios.create({
    baseURL: process.env.PISTON_URL.replace(/\/$/, ''), timeout: 20000,
    headers: process.env.PISTON_TOKEN ? { Authorization: `Bearer ${process.env.PISTON_TOKEN}` } : {},
  });
}
router.use(verifyToken);
router.get('/runtimes', asyncHandler(async (req, res) => {
  const { data } = await client().get('/runtimes');
  res.json(data.filter(runtime => [runtime.language, ...(runtime.aliases || [])].some(name => languages.has(name))));
}));
router.post('/execute', asyncHandler(async (req, res) => {
  const { language, version, code, stdin = '' } = req.body;
  if (!languages.has(language) || typeof version !== 'string' || typeof code !== 'string' || !code.trim() || code.length > 100000 || typeof stdin !== 'string' || stdin.length > 100000) {
    return res.status(400).json({ message: 'Choose a supported language and provide code/input under 100,000 characters' });
  }
  const { data } = await client().post('/execute', {
    language, version, files: [{ content: code }], stdin,
    compile_timeout: 10000, run_timeout: 3000,
  });
  res.json(data);
}));
module.exports = router;
