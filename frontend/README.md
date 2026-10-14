# Codosphere frontend

React + Vite interface for the Codosphere developer community.

## Development

Run `npm ci` and `npm run dev` from this directory. Set `VITE_API_URL` in `.env` when the backend is not at `http://localhost:5555`. See the root README for backend and provider configuration.

## Interface

The app uses a light slate background, white surfaces, emerald accents, and a shared set of navigation, card, button, input, and dialog styles in `src/index.css`.

- Responsive feed with profile summary, post composer, connection requests, and a playground shortcut.
- Developer profiles with responsive Codeforces charts.
- Chat list and message panel with a mobile back button.
- Dedicated sign-in and signup layouts with inline validation and loading feedback.
- Keyboard focus management, Escape dismissal, and reduced-motion support for dialogs.
- Monaco playground with language selection, custom input, and execution output.

## Checks

- `npm run lint`
- `npm run build`
- `npm run preview` to serve the production build locally.

The editor requires a configured Piston instance on the backend. Live feeds, requests, messages, and analytics require their corresponding backend and provider connections.
