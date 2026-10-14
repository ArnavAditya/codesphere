# Codosphere

A coding-focused social app with JWT authentication, bcrypt password hashing, a personalized post feed, Cloudinary images, likes, threaded comments, Codeforces analytics, friend requests, Socket.IO messaging, and a Monaco editor with Piston execution.

## Run locally

1. Install dependencies with `npm ci` in `backend` and `frontend`.
2. Configure `backend/.env` using `backend/.env.example`. Keep actual secrets out of Git.
3. Use MongoDB Atlas or a MongoDB replica set. Friend acceptance and removal use transactions so both users' lists stay consistent. A standalone MongoDB server does not support these transactions.
4. Start the backend with `cd backend && npm start`.
5. Start the frontend with `cd frontend && npm run dev`. Set `VITE_API_URL` in `frontend/.env` if the backend is not at `http://localhost:5555`.

## Code execution

Set `PISTON_URL` on the backend to a Piston base API URL (ending in `/api/v2` or `/api/v2/piston`, depending on the instance). Set `PISTON_TOKEN` if that instance requires bearer authentication. Install the desired runtimes on a self-hosted instance. The editor fetches installed versions rather than relying on hardcoded versions, and shows compiler errors as well as program output. Credentials stay on the backend.

The public Piston service has required authorization since February 15, 2026. Its maintainers do not issue keys for portfolio projects; use a self-hosted instance for this project. See [Piston setup and API documentation](https://github.com/engineer-man/piston). Merely configuring a URL does not install or start Piston.

## Feature behavior

- Friend requests remain pending until the recipient accepts or rejects them on Home. Requests refresh every 15 seconds and can be refreshed manually. Accepted requests update both friend lists. Existing friendships are preserved.
- The feed contains the user's own and accepted friends' posts, newest first. It refreshes after creating a post or changing friends.
- Message endpoints require chat membership. Group mutations require the group admin. Sockets authenticate with JWTs and join only the authenticated user's room; message broadcasts originate from saved server records.
- Post/comment authors come from the JWT. Uploads require authentication and accept one JPEG/PNG of up to 10 MB. Replies must refer to a parent in the same post.
- Codeforces difficulty/tag charts count unique solved problems, not repeated accepted submissions. Rating history uses `user.rating`; solved distributions use `user.status`.

## Validation

- `cd backend && npm test`: regression tests with mocked database/provider boundaries for authorization, friend request decisions, feed filtering, solved counts, socket identity, uploads, and execution forwarding.
- `cd frontend && npm run lint`
- `cd frontend && npm run build`

These checks do not replace a live two-account smoke test with MongoDB, Cloudinary, Codeforces, and a configured Piston server. Verify request acceptance/rejection, feed updates, image posts, nested replies, direct/group messaging, and each installed execution language before demonstrating the project.
