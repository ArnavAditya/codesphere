const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const Chat = require('../models/chat');
const User = require('../models/user');
const Post = require('../models/post');
const Message = require('../models/message');
const Request = require('../models/friendRequest');
const messages = require('../controllers/messageController');
const chats = require('../controllers/chatController');
const posts = require('../controllers/postController');
const requests = require('../controllers/friendRequestController');
const restorers = [];
function replace(object, key, value) {
  const original = object[key]; object[key] = value;
  restorers.push(() => { if (original === undefined) delete object[key]; else object[key] = original; });
}
afterEach(() => { while (restorers.length) restorers.pop()(); });
function response() {
  return { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(value) { this.body = value; return this; }, sendStatus(code) { this.statusCode = code; return this; } };
}
async function invoke(handler, req) {
  const res = response();
  await handler(req, res, error => { throw error; });
  return res;
}
const member = '507f1f77bcf86cd799439011';
const other = '507f1f77bcf86cd799439012';
test('nonmembers cannot read messages', async () => {
  replace(Chat, 'exists', async query => { assert.equal(query.users, member); return null; });
  replace(Message, 'find', () => { assert.fail('Must not query private messages'); });
  const res = await invoke(messages.allMessages, { user: { id: member }, params: { chatId: other } });
  assert.equal(res.statusCode, 403);
});
test('nonmembers cannot send messages', async () => {
  replace(Chat, 'exists', async () => null);
  replace(Message, 'create', () => { assert.fail('Must not save unauthorized messages'); });
  const res = await invoke(messages.sendMessage, { user: { id: member }, body: { content: 'hello', chatId: other } });
  assert.equal(res.statusCode, 403);
});
test('group changes require the authenticated group admin', async () => {
  replace(Chat, 'exists', async query => { assert.equal(query.groupAdmin, member); assert.equal(query.isGroupChat, true); return null; });
  replace(Chat, 'findByIdAndUpdate', () => { assert.fail('Must not change group'); });
  for (const handler of [chats.renameGroup, chats.addToGroup, chats.removeFromGroup]) {
    const res = await invoke(handler, { user: { id: member }, body: { chatId: other, userId: other, chatName: 'Changed' } });
    assert.equal(res.statusCode, 403);
  }
});
test('feed is restricted to self and accepted friends and ordered newest first', async () => {
  replace(User, 'findById', async () => ({ friends: [other] }));
  replace(Post, 'find', query => {
    assert.deepEqual(query, { userId: { $in: [member, other] } });
    return { sort: async order => { assert.deepEqual(order, { createdAt: -1 }); return []; } };
  });
  const res = await invoke(posts.getFeedPosts, { user: { id: member } });
  assert.deepEqual(res.body, []);
});
test('post author comes from the JWT rather than the request body', async () => {
  replace(User, 'findById', async id => { assert.equal(id, member); return { firstName: 'Real', lastName: 'Author', friends: [] }; });
  replace(Post.prototype, 'save', async function () { assert.equal(this.userId, member); return this; });
  replace(Post, 'find', () => ({ sort: async () => [] }));
  const res = await invoke(posts.createPost, { user: { id: member }, body: { userId: other, description: 'hello' } });
  assert.equal(res.statusCode, 201);
});
test('replies cannot refer to a comment in another post', async () => {
  replace(Post, 'findById', async () => ({ comments: { id: () => null } }));
  const res = await invoke(posts.addComment, { user: { id: member }, params: { postId: other }, body: { content: 'reply', parentId: other } });
  assert.equal(res.statusCode, 400);
});
test('sending a friend request creates pending state without adding friends', async () => {
  replace(User, 'findById', async () => ({ friends: [] }));
  replace(User, 'updateOne', () => assert.fail('Sending must not establish friendship'));
  replace(Request, 'findOneAndUpdate', async (filter, update) => {
    assert.equal(filter.pair, [member, other].sort().join(':'));
    assert.equal(update.$set.status, 'pending');
    return update.$set;
  });
  const res = await invoke(requests.send, { user: { id: member }, params: { userId: other } });
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.status, 'pending');
});
test('only the recipient can decide a pending request', async () => {
  replace(mongoose, 'startSession', async () => ({ withTransaction: async fn => fn(), endSession: async () => {} }));
  replace(Request, 'findOneAndUpdate', async filter => {
    assert.equal(filter.recipient, member);
    assert.equal(filter.status, 'pending');
    return null;
  });
  replace(User, 'updateOne', () => assert.fail('Must not establish unauthorized friendship'));
  await assert.rejects(invoke(requests.decide, { user: { id: member }, params: { requestId: other }, body: { action: 'accept' } }), /Pending request not found/);
});
test('accepting a request adds both users inside the transaction', async () => {
  const session = { withTransaction: async fn => fn(), endSession: async () => {} };
  replace(mongoose, 'startSession', async () => session);
  replace(Request, 'findOneAndUpdate', async (filter, update, options) => {
    assert.equal(filter.recipient, member);
    assert.equal(update.$set.status, 'accepted');
    assert.equal(options.session, session);
    return { sender: other, recipient: member };
  });
  replace(User, 'exists', () => ({ session: async () => true }));
  const changes = [];
  replace(User, 'updateOne', async (filter, update, options) => {
    assert.equal(options.session, session); changes.push([filter._id, update.$addToSet.friends]);
  });
  replace(User, 'findById', () => ({ select: () => ({ session: async () => ({ _id: member, friends: [other] }) }) }));
  const res = await invoke(requests.decide, { user: { id: member }, params: { requestId: other }, body: { action: 'accept' } });
  assert.deepEqual(changes, [[other, member], [member, other]]);
  assert.deepEqual(res.body.user.friends, [other]);
});
test('rejecting a request never creates a friendship', async () => {
  replace(mongoose, 'startSession', async () => ({ withTransaction: async fn => fn(), endSession: async () => {} }));
  replace(Request, 'findOneAndUpdate', async (filter, update) => {
    assert.equal(update.$set.status, 'rejected'); return { sender: other, recipient: member };
  });
  replace(User, 'updateOne', () => assert.fail('Reject must not add friends'));
  replace(User, 'findById', () => ({ select: () => ({ session: async () => ({ _id: member, friends: [] }) }) }));
  const res = await invoke(requests.decide, { user: { id: member }, params: { requestId: other }, body: { action: 'reject' } });
  assert.deepEqual(res.body.user.friends, []);
});
test('socket authentication rejects missing tokens and joins only the signed user room', async () => {
  const jwt = require('jsonwebtoken');
  replace(process.env, 'JWT_SECRET', 'test-only-secret');
  replace(User, 'exists', async () => true);
  const io = { use(handler) { this.authenticate = handler; }, on(event, handler) { this.connect = handler; } };
  require('../socket')(io);
  let error;
  await io.authenticate({ handshake: { auth: {} } }, value => { error = value; });
  assert.match(error.message, /Authentication required/);
  const joined = [];
  const socket = { handshake: { auth: { token: jwt.sign({ id: member }, process.env.JWT_SECRET) } }, join: room => joined.push(room), emit() {}, on() {} };
  await io.authenticate(socket, value => { error = value; });
  assert.equal(error, undefined);
  io.connect(socket);
  assert.deepEqual(joined, [member]);
});
test('Codeforces counts unique solved problems and reports API failures', async () => {
  const fs = require('node:fs');
  const source = fs.readFileSync(require('node:path').join(__dirname, '../../frontend/src/utils/dataFetcher.jsx'), 'utf8');
  const { fetchData, processChartData } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
  const submission = { verdict: 'OK', problem: { contestId: 1, index: 'A', rating: 800, tags: ['math'] } };
  replace(global, 'fetch', async () => ({ ok: true, json: async () => ({ status: 'OK', result: [submission, submission, { ...submission, verdict: 'WRONG_ANSWER' }] }) }));
  const solved = await fetchData('example');
  assert.equal(solved.length, 1);
  assert.deepEqual(processChartData(solved), { problemRatings: [{ rating: 800, count: 1 }], tagsCount: [{ tag: 'math', count: 1 }] });
  replace(global, 'fetch', async () => ({ ok: true, json: async () => ({ status: 'FAILED', comment: 'Invalid handle' }) }));
  await assert.rejects(fetchData('invalid'), /Invalid handle/);
});
test('Cloudinary upload errors reject instead of returning an empty URL', async () => {
  const cloudinary = require('cloudinary').v2;
  replace(cloudinary.uploader, 'upload', async () => { throw new Error('Upload rejected'); });
  await assert.rejects(require('../cloudinary').uploads('fake.png', 'Image'), /Upload rejected/);
});
test('Piston proxy forwards code and timeouts to the configured server', async () => {
  replace(process.env, 'PISTON_URL', 'http://piston.test/api/v2');
  replace(process.env, 'PISTON_TOKEN', 'test-only-token');
  replace(require('axios'), 'create', config => {
    assert.equal(config.baseURL, 'http://piston.test/api/v2');
    assert.equal(config.headers.Authorization, 'Bearer test-only-token');
    return { post: async (path, payload) => {
      assert.equal(path, '/execute'); assert.equal(payload.files[0].content, 'print(1)'); assert.equal(payload.run_timeout, 3000);
      return { data: { run: { output: '1\n' } } };
    } };
  });
  const router = require('../routes/codeRoute');
  const execute = router.stack.find(layer => layer.route?.path === '/execute').route.stack[0].handle;
  const res = await invoke(execute, { body: { language: 'python', version: '3.10.0', code: 'print(1)' } });
  assert.equal(res.body.run.output, '1\n');
});
test('API route modules load and mutations cannot bypass token middleware', () => {
  const { verifyToken } = require('../middleware/authMiddleware');
  for (const name of ['chatRoute', 'messageRoute', 'postRoute', 'userRoute', 'codeRoute']) {
    const router = require(`../routes/${name}`);
    for (const layer of router.stack.filter(item => item.route)) {
      const route = layer.route;
      if (route.methods.post || route.methods.patch || route.methods.put || route.methods.delete) {
        const preceding = router.stack.slice(0, router.stack.indexOf(layer));
        assert.ok(route.stack[0].handle === verifyToken || preceding.some(item => item.handle === verifyToken), `${name} ${route.path} requires a JWT`);
      }
    }
  }
});
