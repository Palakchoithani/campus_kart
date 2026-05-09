# CampusKart

A hyperlocal marketplace for college students to buy, sell, rent, chat, rate, and promote listings.

## Tech Stack

- Frontend: Vite + React
- Backend: Node.js + Express
- Database: MongoDB + Mongoose
- Auth: JWT
- Realtime chat: Socket.IO
- Payments: Stripe-ready premium flow

## Project Structure

- `frontend/` - browser app
- `backend/` - API server and Socket.IO

## Prerequisites

- Node.js 18+
- MongoDB running locally or a MongoDB Atlas connection string

## Environment Variables

Create these files:

- `backend/.env`
- `frontend/.env`

Example values:

```env
# backend/.env
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/campus_kart
JWT_SECRET=change-this-in-production
STRIPE_SECRET_KEY=sk_test_change_me
CORS_ORIGIN=http://localhost:5173,http://localhost:5174
```

```env
# frontend/.env
VITE_API_URL=http://localhost:4000
```

## Install

```bash
cd backend && npm install
cd ../frontend && npm install
```

The backend already uses `mongoose` and the frontend already uses `socket.io-client`.

## Run Locally

Start the backend first:

```bash
cd backend
npm run dev
```

Then start the frontend in a second terminal:

```bash
cd frontend
npm run dev
```

## Current Features

- JWT signup/login
- Browse listings with search, category, location, and sort filters
- Create listings
- Listing detail view
- Direct chat between buyer and seller
- Ratings per listing
- Premium listing upgrade flow
- Urgent listing flag

## Deployment Notes

Use this flow for production launch (Vercel + Render + MongoDB Atlas):

1. Create a MongoDB Atlas cluster and copy the connection string.
2. Deploy `backend/` as a Render Web Service.
3. Set backend env vars on Render:
	- `NODE_ENV=production`
	- `PORT=4000`
	- `MONGODB_URI=<your atlas uri>`
	- `JWT_SECRET=<long random secret>`
	- `STRIPE_SECRET_KEY=<your stripe secret>`
	- `FRONTEND_URL=https://<your-vercel-domain>`
	- `CORS_ORIGIN=https://<your-vercel-domain>`
4. Confirm backend health endpoint: `https://<render-service>/health`.
5. Deploy `frontend/` as a Vercel project.
6. Set frontend env var on Vercel:
	- `VITE_API_URL=https://<your-render-service>`
7. Redeploy frontend after env var is saved.
8. Open the live app and verify:
	- signup/login
	- create listing
	- message flow
	- ratings
9. In Stripe dashboard, replace test keys with live keys before real payments.
10. Add custom domain and HTTPS in both Vercel and Render before launch.
