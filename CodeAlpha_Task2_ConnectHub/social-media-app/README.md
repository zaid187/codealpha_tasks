# ConnectHub - Social Media Application

A full-stack social media platform built for CodeAlpha Internship Task 2. Similar to Instagram/X with a simplified feature set.

## Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose
- **Auth:** JWT, bcryptjs
- **Uploads:** Multer

## Features

- User registration & login with JWT authentication
- Create posts with image upload and captions
- Like/unlike posts (with animation & double-tap to like)
- Comment on posts
- User profiles with edit functionality
- Follow/unfollow users
- Search users by username or name
- Notifications for likes, comments, and follows
- Dark mode toggle
- Infinite scroll feed
- Image lightbox
- Copy profile link
- Responsive design (desktop, tablet, mobile)

## Project Structure

```
social-media-app/
├── backend/
│   ├── config/db.js
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── uploads/
│   └── server.js
└── frontend/
    ├── css/
    ├── js/
    ├── images/
    └── *.html
```

## Setup Instructions

### Prerequisites

- Node.js (v18+)
- MongoDB running locally or a MongoDB Atlas connection string

### Backend

```bash
cd SM/social-media-app/backend
npm install
```

Update `.env` with your MongoDB URI and JWT secret:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/socialmedia
JWT_SECRET=your_secret_key
```

Start the server:

```bash
npm run dev
```

### Frontend

Open the frontend files in a browser. Use a local server for best results:

```bash
cd SM/social-media-app/frontend
npx serve .
```

Or open `login.html` directly in your browser.

> **Note:** The frontend API points to `http://localhost:5000`. Make sure the backend is running.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/users` | Search/list users |
| GET | `/api/users/:id` | Get user profile |
| PUT | `/api/users/:id` | Update profile |
| POST | `/api/users/:id/follow` | Follow/unfollow |
| GET | `/api/posts` | Get posts (paginated) |
| POST | `/api/posts` | Create post |
| DELETE | `/api/posts/:id` | Delete post |
| POST | `/api/posts/:id/like` | Like/unlike |
| POST | `/api/posts/:id/comment` | Add comment |
| GET | `/api/notifications` | Get notifications |

## Author

CodeAlpha Internship - Task 2
