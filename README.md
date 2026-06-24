# Pulse — Premium Social Networking Platform

A production-ready social platform inspired by Instagram, Facebook, Threads, and X (Twitter). Built with vanilla HTML/CSS/JavaScript frontend, Node.js/Express backend, MongoDB, and Socket.io for real-time messaging.

## Features

- **Authentication** — Register, login, JWT auth, bcrypt password hashing, email verification, forgot/reset password
- **User Profiles** — Profile/cover images, bio, location, website, social links, followers/following
- **Posts** — Text posts, multiple images, edit/delete, infinite scroll feed
- **Comments** — Nested replies, edit/delete, real-time counts
- **Likes** — Like/unlike posts and comments with duplicate prevention
- **Follow System** — Follow/unfollow, suggested users, personalized feed
- **News Feed** — Home (following), trending, and latest posts
- **Notifications** — Follows, likes, comments, replies with read/unread status
- **Search** — Users, posts, hashtags with autocomplete suggestions
- **Dashboard** — Profile statistics and recent activity
- **Settings** — Profile, password, privacy, notifications, account deletion
- **UI/UX** — Responsive design, dark/light mode, skeleton loaders, toast notifications

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | HTML, CSS, JavaScript (ES Modules) |
| Backend  | Node.js, Express.js                 |
| Database | MongoDB, Mongoose                   |
| Auth     | JWT, bcryptjs                       |
| Media    | Local storage or Cloudinary         |
| Email    | Nodemailer (SMTP)                   |

## Project Structure

```
social media/
├── backend/
│   ├── config/          # Database & Cloudinary config
│   ├── controllers/     # Route handlers (MVC)
│   ├── middleware/      # Auth, upload, validation, errors
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API routes
│   ├── utils/           # Email, tokens, upload helpers
│   ├── uploads/         # Local image storage
│   └── server.js        # Entry point
├── frontend/
│   ├── css/             # Stylesheets
│   ├── js/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page modules
│   │   ├── api.js       # API client
│   │   ├── auth.js      # Auth state
│   │   └── app.js       # Router & app init
│   └── index.html
└── README.md
```

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MongoDB](https://www.mongodb.com/) v6+ (local or Atlas)

## Quick Start

### 1. Clone and install

```bash
cd "social media"
npm run install:all
```

### 2. Configure environment

Copy the example env file and update values:

```bash
cp backend/.env.example backend/.env
```

Key variables:

| Variable       | Description                          | Default                              |
|----------------|--------------------------------------|--------------------------------------|
| `PORT`         | API server port                      | `5000`                               |
| `MONGODB_URI`  | MongoDB connection string            | `mongodb://localhost:27017/socialmedia` |
| `JWT_SECRET`   | Secret for signing JWTs              | (required in production)             |
| `CLIENT_URL`   | Frontend URL for email links         | `http://localhost:3000`              |
| `STORAGE_TYPE` | `local` or `cloudinary`              | `local`                              |
| `SMTP_*`       | Email settings for verification      | (optional — logs to console in dev)  |

### 3. Start MongoDB

```bash
# macOS with Homebrew
brew services start mongodb-community

# Or run manually
mongod
```

### 4. Run the application

**Terminal 1 — Backend:**
```bash
npm run dev:backend
```

**Terminal 2 — Frontend:**
```bash
npm run dev:frontend
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Endpoints

### Authentication
| Method | Endpoint                    | Description           |
|--------|-----------------------------|-----------------------|
| POST   | `/api/auth/register`        | Register new user     |
| POST   | `/api/auth/login`           | Login                 |
| POST   | `/api/auth/verify-email`    | Verify email          |
| POST   | `/api/auth/forgot-password` | Request password reset|
| POST   | `/api/auth/reset-password`  | Reset password        |
| GET    | `/api/auth/me`              | Get current user      |

### Users
| Method | Endpoint                      | Description          |
|--------|-------------------------------|----------------------|
| GET    | `/api/users/:username`        | Get user profile     |
| PUT    | `/api/users/profile`          | Update profile       |
| POST   | `/api/users/profile-image`    | Upload profile pic   |
| POST   | `/api/users/cover-image`      | Upload cover image   |
| GET    | `/api/users/search?q=`        | Search users         |
| GET    | `/api/users/suggested`        | Suggested users      |
| PUT    | `/api/users/settings`         | Privacy & notifications |
| DELETE | `/api/users/account`          | Delete account       |

### Posts
| Method | Endpoint                | Description        |
|--------|-------------------------|--------------------|
| GET    | `/api/posts/feed`       | Personalized feed  |
| GET    | `/api/posts/trending`   | Trending posts     |
| GET    | `/api/posts/latest`     | Latest posts       |
| POST   | `/api/posts`            | Create post        |
| GET    | `/api/posts/:id`        | Get single post    |
| PUT    | `/api/posts/:id`        | Update post        |
| DELETE | `/api/posts/:id`        | Delete post        |
| POST   | `/api/posts/:id/like`   | Toggle like        |

### Comments
| Method | Endpoint                        | Description     |
|--------|---------------------------------|-----------------|
| GET    | `/api/comments/post/:postId`    | Get comments    |
| POST   | `/api/comments/post/:postId`    | Add comment     |
| PUT    | `/api/comments/:id`             | Edit comment    |
| DELETE | `/api/comments/:id`             | Delete comment  |
| POST   | `/api/comments/:id/like`        | Toggle like     |

### Follow
| Method | Endpoint                          | Description    |
|--------|-----------------------------------|----------------|
| POST   | `/api/follow/:username/follow`    | Follow user    |
| DELETE | `/api/follow/:username/follow`    | Unfollow user  |
| GET    | `/api/follow/:username/followers` | Get followers  |
| GET    | `/api/follow/:username/following` | Get following  |

### Notifications
| Method | Endpoint                           | Description        |
|--------|------------------------------------|--------------------|
| GET    | `/api/notifications`               | Get notifications  |
| GET    | `/api/notifications/unread-count`  | Unread count       |
| PUT    | `/api/notifications/:id/read`      | Mark as read       |
| PUT    | `/api/notifications/read-all`      | Mark all as read   |

### Search & Dashboard
| Method | Endpoint                    | Description          |
|--------|-----------------------------|----------------------|
| GET    | `/api/search?q=&type=`      | Search all           |
| GET    | `/api/search/suggestions`   | Autocomplete         |
| GET    | `/api/dashboard`            | User dashboard stats |

## Cloudinary Setup (Optional)

1. Create a [Cloudinary](https://cloudinary.com/) account
2. Set in `backend/.env`:
   ```
   STORAGE_TYPE=cloudinary
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

## Email Setup (Optional)

For email verification and password reset in production, configure SMTP:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=ConnectShare <noreply@yourdomain.com>
```

Without SMTP configured, emails are logged to the backend console in development.

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a strong `JWT_SECRET`
3. Use MongoDB Atlas or a managed MongoDB instance
4. Configure Cloudinary or a persistent volume for uploads
5. Set up SMTP for transactional emails
6. Serve the frontend via nginx/CDN and proxy `/api` to the backend
7. Update `CLIENT_URL` to your production domain

## Security Features

- JWT-based authentication with protected routes
- bcrypt password hashing (12 rounds)
- Helmet security headers
- Rate limiting (200 req/15 min per IP)
- Input validation with express-validator
- Role-based authorization (user/admin)
- CORS configuration
- Image validation and compression

## License

MIT
