# NGU University Lecturer Evaluation Portal

A full-stack lecturer evaluation portal for Nexus Global University (NGU).
Students search lecturers, submit anonymous satisfaction reviews (0–100%), and
view aggregated ratings and sentiment. Lecturers sign in with a PIN to read their
own feedback, and administrators manage the registry.

The project ships a **Flask + SQLite** backend, an **optional Spring Boot**
microservice, and a static **HTML/CSS/JS** frontend.

## Project structure

```
lecturer-review-app/
├── .gitignore
├── README.md
├── requirements.txt
├── .env
│
├── backend-python/                 # Python (Flask) backend
│   ├── app.py                      # Main application entry point
│   ├── config/
│   │   └── settings.py             # App configuration & database URI
│   ├── models/
│   │   ├── __init__.py             # SQLAlchemy db instance
│   │   ├── user.py                 # Student / admin accounts
│   │   ├── lecturer.py             # Lecturer model
│   │   └── review.py               # Review model
│   ├── routes/
│   │   ├── __init__.py             # Blueprint registration
│   │   ├── auth_routes.py          # Login / signup endpoints
│   │   └── review_routes.py        # Lecturer, review & analytics endpoints
│   └── services/
│       └── analytics_service.py    # Rating & sentiment analysis
│
├── backend-java/                   # Optional Spring Boot microservice
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/review/app/
│       │   ├── Application.java
│       │   ├── controller/         # REST controllers
│       │   ├── model/              # JPA entities
│       │   └── repository/         # Spring Data repositories
│       └── resources/
│           └── application.properties
│
├── frontend/                       # Static UI
│   ├── css/
│   │   ├── style.css               # Layout, responsive design, colours, typography
│   │   └── components.css          # Cards, forms, buttons, badges
│   ├── js/
│   │   └── main.js                 # Interactivity / fetch requests
│   ├── index.html                  # Home / lecturer search
│   ├── lecturer.html               # Lecturer profile & reviews
│   ├── add-review.html             # Submit a review
│   └── login.html                  # Authentication
│
└── database/
    └── schema.sql                  # SQL initialization script
```

> `models/user.py` was added beyond the original sketch because authentication
> (students and admins) needs a persisted account table.

## Quick start (Python backend)

```bash
# 1. Create and activate a virtual environment
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS / Linux

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run the server (serves the API *and* the frontend)
python backend-python/app.py
```

Open <http://localhost:5000>. The SQLite database is created automatically at
`database/app.db` and seeded with sample lecturers on first run.

### Configuration

Settings live in `.env`:

| Variable           | Default                     | Purpose                          |
| ------------------ | --------------------------- | -------------------------------- |
| `SECRET_KEY`       | `change-me-in-production`   | Flask session key                |
| `DATABASE_URL`     | `sqlite:///database/app.db` | SQLAlchemy connection string     |
| `HOST` / `PORT`    | `0.0.0.0` / `5000`          | Bind address                     |
| `CORS_ORIGINS`     | `*`                         | Allowed frontend origins         |

## API reference

| Method | Endpoint                              | Description                         |
| ------ | ------------------------------------- | ----------------------------------- |
| GET    | `/api/health`                         | Service health check                |
| GET    | `/api/lecturers`                      | List every lecturer with stats      |
| GET    | `/api/lecturers/search?q=`            | Search lecturers by name            |
| GET    | `/api/lecturers/{id}`                 | Lecturer profile + reviews          |
| POST   | `/api/lecturers`                      | Create a lecturer                   |
| GET    | `/api/reviews`                        | List reviews                        |
| POST   | `/api/reviews`                        | Submit a review                     |
| GET    | `/api/reviews/lecturer/{id}`          | Reviews for one lecturer            |
| GET    | `/api/analytics/overview`             | Portal-wide analytics               |
| GET    | `/api/analytics/lecturer/{id}`        | Per-lecturer analytics              |
| GET    | `/api/academic-data`                  | Departments, units and lecturers    |
| POST   | `/api/auth/signup`                    | Register a student                  |
| POST   | `/api/auth/login`                     | Student login                       |
| POST   | `/api/auth/admin/bootstrap`           | Create the first administrator      |
| POST   | `/api/auth/admin/login`              | Administrator login                 |
| GET    | `/api/lecturers/pins/{name}`          | Whether a lecturer has set a PIN    |
| POST   | `/api/lecturers/pins`                 | Register/update a lecturer PIN      |
| POST   | `/api/lecturers/login`                | Lecturer PIN login                  |

## Optional Java microservice

```bash
cd backend-java
mvn spring-boot:run     # http://localhost:8080
```

It shares the SQLite database at `../database/app.db` and exposes the same
core endpoints. Set `DATABASE_URL` to override the connection.

## Database

Flask-SQLAlchemy creates the schema automatically. To initialize manually:

```bash
sqlite3 database/app.db < database/schema.sql
```

## Notes

* Reviews are stored with a sentiment label computed by
  `analytics_service.analyze_sentiment` (lexicon-based, no external services).
* Passwords and lecturer PINs are hashed with Werkzeug (Python) / BCrypt (Java).
* The frontend uses the API on the same origin; when opened from `file://` it
  falls back to `http://localhost:5000/api`.
