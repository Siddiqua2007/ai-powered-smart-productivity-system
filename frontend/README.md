# AI-Powered Smart Productivity System

An AI-powered task management web app for anyone with too much to do — students, doctors, engineers, lawyers, freelancers. Most to-do apps just store tasks. This one helps you figure out what actually matters *right now*.

**Live Demo:** [Add link after deployment]
**Video Walkthrough:** [Optional — add if you record one]

## Why this exists

Most task apps assume one type of user (usually "student" or "office worker") and bury you in features you don't need. This one is intentionally simple and works for anyone: categories are fully custom (type whatever fits your life — "Patients," "Court Filing," "Gym," anything), and the AI layer is designed to be calm and encouraging, not another source of pressure.

## Features

- **Secure authentication** — JWT-based register/login, passwords hashed with bcrypt, protected routes on both API and frontend
- **Full task management** — create, edit, delete, mark complete, with priority, deadline, and fully custom categories (not hardcoded to any one profession)
- **Search, filter, and sort** — find any task instantly by keyword, category, priority, or status
- **AI-powered features (Google Gemini)**:
  - **Smart Recommendation** — tells you the single most important task to do next, with reasoning
  - **Today's Plan** — a realistic, ordered plan for your day based on your real pending tasks
  - **Productivity Insights** — a warm, honest summary of how you're doing, gently flags anything overdue
  - **Productivity Score** — a 0-100 score with explanation, based on your task history
- **Account management** — update your name/email, change your password, all changes reflected instantly across the app
- **Calm, distinct UI** — a custom design system (warm palette, serif headings) instead of a generic admin-template look

## Tech Stack

| Layer    | Technology                                  |
|----------|-----------------------------------------------|
| Frontend | React 19, Vite, React Router, Axios          |
| Backend  | Node.js, Express                              |
| Database | MongoDB Atlas, Mongoose                       |
| AI       | Google Gemini API (`gemini-2.5-flash`)        |
| Auth     | JSON Web Tokens (JWT), bcrypt                 |
| Deployment | Vercel (frontend), Render (backend), MongoDB Atlas (database) |

## Architecture Notes

A couple of deliberate decisions worth mentioning:

- **The Gemini API key never touches the frontend.** All AI calls happen through this app's own backend (`/api/ai/*`), which then calls Gemini server-side. Anything shipped to the frontend is visible in the browser, so an API key there would be exposed to anyone visiting the site.
- **Categories are free-text, not a fixed list.** Early versions hardcoded categories like "DSA" and "Academics," which only made sense for one type of user. The schema was refactored to accept any string, with the frontend showing dynamically-generated suggestions based on what a user has already typed — this is what actually makes the app usable by anyone, not just students.

## Project Structure
## Getting Started

### Prerequisites
- Node.js 18+
- A free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
- A free [Google Gemini API key](https://aistudio.google.com/apikey)

### Backend setup
```bash
cd backend
npm install
cp .env.example .env
```
Fill in `backend/.env` with your real MongoDB URI, a generated JWT secret, and your Gemini API key, then:
```bash
npm run dev
```

### Frontend setup
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
Open `http://localhost:5173`.

## API Reference

| Method | Endpoint                     | Auth | Description                       |
|--------|--------------------------------|------|------------------------------------|
| POST   | `/api/auth/register`           | No   | Create a new account               |
| POST   | `/api/auth/login`              | No   | Log in, returns a JWT              |
| GET    | `/api/users/profile`           | Yes  | Get the logged-in user's info      |
| PUT    | `/api/users/profile`           | Yes  | Update name/email                  |
| PUT    | `/api/users/change-password`   | Yes  | Change password                    |
| POST   | `/api/tasks`                    | Yes  | Create a task                      |
| GET    | `/api/tasks`                    | Yes  | Get all of your tasks              |
| PUT    | `/api/tasks/:id`                 | Yes  | Update a task (or mark complete)   |
| DELETE | `/api/tasks/:id`                 | Yes  | Delete a task                      |
| POST   | `/api/ai/recommend`             | Yes  | Get an AI-recommended next task    |
| POST   | `/api/ai/today-plan`            | Yes  | Get an AI-generated plan for today |
| POST   | `/api/ai/insights`              | Yes  | Get an AI summary of your progress |
| POST   | `/api/ai/productivity-score`    | Yes  | Get a 0-100 AI productivity score  |

Protected routes require an `Authorization: Bearer <token>` header.

## Screenshots

[Add 3-4 screenshots here after deployment: Login page, Dashboard with AI recommendation, Tasks page with AI insights/plan, Profile page]

## Deployment

1. **Database** — MongoDB Atlas, Network Access set to allow connections from anywhere.
2. **Backend → Render** — Web Service pointing at the `backend` folder. Environment variables: `MONGO_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, `CLIENT_URL` (your deployed frontend URL). Build command: `npm install`. Start command: `npm start`.
3. **Frontend → Vercel** — Project root set to `frontend`. Environment variable: `VITE_API_URL` set to your deployed Render backend URL + `/api`.

## Security Notes

- `.env` files are never committed — only `.env.example` with placeholders is tracked
- Passwords are hashed with bcrypt before being stored
- The Gemini API key and JWT secret are server-side only, never exposed to the frontend
- If credentials are ever accidentally exposed, rotate them immediately

## What I learned building this

- Building a JWT auth flow from scratch, including the difference between writing a token to `localStorage` versus actually syncing React state through Context — a subtle bug that broke login until I traced it
- Designing flexible data models (free-text categories) instead of hardcoding assumptions about who'd use the app
- Calling an LLM API safely from a backend, including basic retry logic for transient model overload errors
- That "looks done" and "is done" are different things — most of the actual debugging time went into deployment-specific issues (case-sensitive file imports, CORS, environment variables) that never show up when everything runs on one laptop

## License

This project is for educational and portfolio purposes.