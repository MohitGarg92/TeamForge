# TeamForge

TeamForge is a student-focused team formation platform for Thapar Institute of Engineering and Technology. It helps students create profiles, discover open teams, send join requests, and manage teams for hackathons, academic projects, and collaborative competitions.

## Features

- Student registration and login flow
- Student profiles with skills, GitHub, LinkedIn, and contact details
- Team creation with required skills, capacity, and hackathon information
- Browse available teams
- Filter teams by skills and hackathons
- Send join requests to team leaders
- Accept or reject pending join requests
- Automatically mark teams as full when capacity is reached

## Tech Stack

**Frontend:** HTML, CSS, JavaScript

**Backend:** Node.js, Express.js, MySQL, Passport.js, Google OAuth 2.0

## Project Structure

```text
TeamForge/
├── index.html
├── pages/              # Frontend pages
├── css/                # Stylesheets
├── js/                 # Frontend JavaScript and mock data
├── backend/            # Express backend
│   ├── server.js
│   ├── db.js
│   ├── package.json
│   └── db/
│       ├── schema.sql
│       └── seed.sql
├── Documentations/     # Project reports and diagrams
└── README.md
```

## Current Status

The frontend currently uses `localStorage` to simulate users, teams, and join requests.

The backend is available separately and includes:

- Express server setup
- MySQL connection setup
- Google OAuth setup
- Health check route
- Team listing route
- Development mock login route

Frontend-backend integration is still in progress.

## Getting Started

### Prerequisites

- Node.js
- npm
- MySQL
- A local static server, such as VS Code Live Server or Python's built-in HTTP server

### Run the Frontend

From the project root:

```bash
python3 -m http.server 5500
```

Open:

```text
http://localhost:5500/
```

The frontend is served on port `5500` because the backend currently allows requests from `http://localhost:5500`.

### Run the Backend

Go to the backend folder:

```bash
cd backend
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Update `.env` with your local values:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=teammatcher

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SESSION_SECRET=your_session_secret
```

Start the backend:

```bash
npm start
```

The backend runs at:

```text
http://localhost:3000
```

Test it with:

```bash
curl http://localhost:3000/api/health
```

Expected response:

```json
{
  "status": "ok"
}
```

## Database Setup

Create the MySQL database:

```sql
CREATE DATABASE teammatcher;
```

Run the schema:

```bash
mysql -u root -p teammatcher < backend/db/schema.sql
```

Load sample data:

```bash
mysql -u root -p teammatcher < backend/db/seed.sql
```

## API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/health` | Check backend status |
| GET | `/api/auth/google` | Start Google OAuth login |
| GET | `/api/auth/google/callback` | Google OAuth callback |
| GET | `/api/auth/me` | Get current authenticated user |
| GET | `/api/auth/logout` | Logout user |
| POST | `/api/auth/mock-login` | Development-only mock login |
| GET | `/api/teams` | List teams from MySQL |
| GET | `/api/debug/teams` | Debug team listing route |

## Roadmap

- Connect frontend pages to backend APIs
- Replace `localStorage` data with MySQL-backed data
- Restrict authentication to valid student accounts
- Add backend APIs for team creation, join requests, and profile updates
- Improve validation and error handling
- Add deployment instructions

## Documentation

Additional project documents are available in the `Documentations/` folder, including the project proposal, SRS, progress report, use case diagram, and activity diagram.

## License

This project is licensed under the MIT License.
