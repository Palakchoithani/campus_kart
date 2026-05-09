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
VITE_API_URL=/api
```

## Install

```bash
cd backend && npm install
cd ../frontend && npm install
```

The backend already uses `mongoose` and the frontend already uses `socket.io-client`.

## Run Locally

Start both frontend and backend together from project root:

```bash
npm run dev
```

Or run them separately in two terminals:

```bash
cd backend
npm run dev
```

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

- Deploy the frontend to Vercel
- Deploy the backend to Render or Railway
- Set `VITE_API_URL` in Vercel to the deployed backend URL
- Set `MONGODB_URI`, `JWT_SECRET`, `CORS_ORIGIN`, and `STRIPE_SECRET_KEY` in your backend host
- Keep MongoDB accessible from the backend host

## Demo Seed Data

On first backend startup, the app seeds a demo user and sample listings if the database is empty.

- Demo email: `demo@example.com`
- Demo password: `password123`
