# PBJ - Proyek Baru Jawa

Sistem manajemen proyek konstruksi pemerintah di Pulau Jawa.

## Tech Stack

- **Backend**: Go 1.23+ with `lib/pq` (PostgreSQL driver)
- **Frontend**: React 19 + Vite + Tailwind CSS

## Project Structure

```
pbj/
├── backend/
│   ├── cmd/server/          # Application entry point
│   ├── internal/
│   │   ├── handlers/        # HTTP handlers
│   │   ├── repository/      # Data access layer
│   │   └── models/          # Data models
│   └── go.mod
└── frontend/
    ├── src/
    │   ├── components/      # React components
    │   ├── pages/           # Page components
    │   └── main.jsx         # Entry point
    └── package.json
```

## Getting Started

### Backend

```bash
cd backend

# Install dependencies
go mod tidy

# Setup environment
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# Run server
go run cmd/server/main.go
```

Server akan berjalan di `http://localhost:8080`

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

Frontend akan berjalan di `http://localhost:5173`

## Database

Setup PostgreSQL:

```sql
CREATE DATABASE pbj;

CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    ministry VARCHAR(100) NOT NULL,
    province VARCHAR(100) NOT NULL,
    city VARCHAR(100),
    budget BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'planned',
    start_date DATE,
    end_date DATE,
    progress INTEGER DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

- `GET /health` - Health check
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `GET /api/projects` - List projects (with query filters)
- `GET /api/projects/{id}` - Get project by ID
- `POST /api/projects` - Create project
- `PUT /api/projects/{id}` - Update project
- `DELETE /api/projects/{id}` - Delete project
- `GET /api/projects/stats` - Project statistics

## Frontend Features

- **Dashboard**: Overview of project statistics
- **Project List**: Filterable project listing with search
- **Project Details**: View individual project information
- **Project Form**: Create and edit projects
- **Authentication**: Login functionality

## Development Notes

- The frontend dev server is configured with a proxy to forward `/api` requests to the backend server at `http://localhost:8080`
- Make sure the backend server is running before starting the frontend dev server

## License

MIT