# RUMI AI Agent Backend

Backend API for RUMI AI Agent - A multilingual chat and verse search system based on Rumi's poetry.

## Overview

This system provides a comprehensive backend API for an AI agent that offers advice based on Rumi's poetry using RAG (Retrieval-Augmented Generation) and LLM technologies. The system supports multiple languages (Farsi, English, Korean) and provides verse search, citation management, and user feedback capabilities.

## Key Features

- **Multilingual Chat API**: Submit questions and receive advice based on Rumi's poetry (FA/EN/KR)
- **Verse Search**: Search through Rumi's verses with multilingual support
- **Citation Management**: Detailed citation information with PDF bounding boxes
- **User Authentication**: JWT-based authentication and user management
- **Books API**: Access book pages with highlighted verses
- **Feedback System**: Report issues with AI responses, OCR, or translations
- **API Gateway**: Rate limiting, request validation, and security middleware

## Architecture

The system follows a microservices architecture with an API Gateway pattern:

- **API Gateway Layer**: Authentication, rate limiting, request validation
- **Chat Service**: Handles chat interactions with RAG and LLM
- **Search Service**: Verse search with multilingual reranking
- **Books API**: Book and page management
- **Citation Service**: Citation data management

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed architecture documentation.

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Python 3.9+ (for local development)

### Using Docker Compose (Recommended)

1. **Clone and navigate to the project directory**

2. **Create environment file**
   ```bash
   # Create .env file with your configuration
   # See DEPLOYMENT_CHECKLIST.md for required variables
   ```

3. **Start services**
   ```bash
   docker-compose up -d
   ```

4. **Initialize database**
   ```bash
   docker-compose exec api alembic upgrade head
   ```

5. **Access the API**
   - API: http://localhost:8000
   - API Docs: http://localhost:8000/docs
   - Database Admin: http://localhost:8080

### Local Development

1. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up PostgreSQL database**
   - Create database: `createdb rumi_ai`
   - Update `DATABASE_URL` in `.env`

3. **Run migrations**
   ```bash
   alembic upgrade head
   ```

4. **Start the server**
   ```bash
   uvicorn main:app --reload
   ```

## API Documentation

### Main Endpoints

- **POST /api/chat** - Submit question and get advice (multilingual)
- **GET /api/search** - Search verses by keyword
- **GET /api/citation/:id** - Get citation details
- **GET /api/books/:id/pages/:n** - Get book page with verses
- **POST /api/auth/login** - User login
- **POST /api/auth/signup** - User registration
- **GET /api/user/me** - Get user profile
- **PATCH /api/user/settings** - Update user settings
- **POST /api/feedback** - Submit feedback

See [API_ENDPOINTS.md](API_ENDPOINTS.md) for complete API documentation.

## Database Schema

The system uses PostgreSQL with the following main entities:

- **Users** - User accounts and authentication
- **Chat_Sessions** - Chat session management
- **Messages** - Individual chat messages
- **Feedback_Reports** - User feedback on messages
- **Books** - Book metadata
- **Verses** - Verse content (multilingual: FA/EN/KR)
- **Citations** - Citation data with page references

See [database_schema.sql](database_schema.sql) for complete schema definition.

## Configuration

Configuration is managed through environment variables. Key variables:

- `DATABASE_URL` - PostgreSQL connection string
- `SECRET_KEY` - Application secret key (change in production!)
- `LLM_API_KEY` - LLM API key for chat generation
- `LLM_API_URL` - LLM API endpoint
- `REDIS_URL` - Redis connection (optional, for caching)
- `ALLOWED_HOSTS` - CORS allowed hosts

See [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) for complete configuration guide.

## Project Structure

```
.
├── app/
│   ├── __init__.py
│   ├── config.py              # Configuration management
│   ├── database.py            # Database connection
│   ├── models.py              # SQLAlchemy models
│   ├── schemas.py             # Pydantic schemas
│   ├── middleware/            # API Gateway middleware
│   │   ├── auth.py            # JWT authentication
│   │   ├── rate_limit.py      # Rate limiting
│   │   └── request_validator.py
│   ├── routers/               # API route handlers
│   │   ├── auth.py
│   │   ├── chat.py
│   │   ├── search.py
│   │   ├── books.py
│   │   ├── feedback.py
│   │   ├── citation.py
│   │   └── user.py
│   └── services/              # Business logic
│       ├── chat_service.py
│       ├── multilingual_generation.py
│       ├── llm_generation.py
│       ├── search_service.py
│       └── citation_service.py
├── alembic/                   # Database migrations
├── main.py                    # FastAPI application
├── docker-compose.yml         # Docker services
├── Dockerfile                 # API container
└── requirements.txt           # Python dependencies
```

## Development

### Running Tests

```bash
pytest
```

### Database Migrations

Create a new migration:
```bash
alembic revision --autogenerate -m "Description"
```

Apply migrations:
```bash
alembic upgrade head
```

Rollback:
```bash
alembic downgrade -1
```

## Deployment

See [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) for complete deployment guide.

### Production Considerations

1. **Security**
   - Change `SECRET_KEY` to a strong random value
   - Use environment-specific `.env` files
   - Enable HTTPS/TLS
   - Configure proper CORS settings

2. **Database**
   - Use managed PostgreSQL service
   - Set up regular backups
   - Configure connection pooling

3. **Monitoring**
   - Set up application logging
   - Configure health checks
   - Monitor database performance
   - Track API metrics

## License

MIT

## Support

For issues and questions, contact the RUMI AI backend team.
