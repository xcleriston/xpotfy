# Roulette Game Backend (Node.js + SQLite3)

This is a lightweight, portable backend for the Roulette game application, built with Node.js, Express, and SQLite3.

## Features

- **User Authentication**: JWT-based authentication system
- **Real-time Updates**: WebSocket support for live game updates
- **Admin Dashboard**: Manage users, view statistics, and adjust credits
- **Portable**: Uses SQLite3 as the database (no external DB required)
- **RESTful API**: Well-structured endpoints for all game operations

## Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)

## Installation

1. Clone the repository
2. Navigate to the backend directory:
   ```bash
   cd backend_js
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

## Configuration

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
2. Edit the `.env` file with your configuration:
   ```env
   PORT=8001
   JWT_SECRET=your-super-secret-jwt-key
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=admin123
   ```

## Running the Server

### Development

```bash
npm run dev
```

This will start the server with nodemon for automatic reloading.

### Production

```bash
npm start
```

## API Documentation

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get JWT token

### User Endpoints

- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update current user profile
- `GET /api/users/me/history` - Get current user's bet history

### Bet Endpoints

- `GET /api/bets` - Get bet history
- `POST /api/bets` - Place a new bet
- `GET /api/bets/:id` - Get bet details

### Admin Endpoints (Requires admin role)

- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:id` - Get user details
- `POST /api/admin/users/:userId/credits` - Add/remove user credits
- `GET /api/admin/stats` - Get system statistics

## WebSocket

The server supports WebSocket connections at `ws://localhost:8001` (or your configured port).

### Events

- `connection_established` - Sent when a client connects
- `BET_RESULT` - Sent when a bet is resolved
- `CREDITS_UPDATED` - Sent when a user's credits are updated

## Database

The application uses SQLite3 with the following schema:

- `users` - User accounts
- `tickets` - User credits and settings
- `bet_rounds` - Bet history
- `automation_configs` - Bot automation settings
- `admin_transactions` - Admin credit adjustments

## Security

- All passwords are hashed using bcrypt
- JWT tokens are used for authentication
- SQL injection prevention using parameterized queries
- CORS is enabled for all origins (restrict in production)

## License

MIT
