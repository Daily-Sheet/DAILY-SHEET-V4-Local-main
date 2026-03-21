# Daily Sheet Vite Client Setup

## 1. Install dependencies

cd client
npm install

## 2. Create a .env.local file (optional, for custom API URL)

cp ../.env.example .env.local
# Edit VITE_API_URL if backend is not on same origin

## 3. Start the Vite dev server

npm run dev

# The Vite dev server will run on http://localhost:5173 by default.
# The frontend expects the backend API at http://localhost:5173/api (proxy to backend).

## 4. (Optional) Set up Vite proxy for /api

# In vite.config.ts, add to the 'server' section:
# server: {
#   proxy: {
#     '/api': 'http://localhost:5000',
#   },
# },

# This will forward frontend /api requests to your backend running on port 5000.

## 5. Open http://localhost:5173 in your browser

# You should see the Daily Sheet app and be able to log in with your seeded credentials.
