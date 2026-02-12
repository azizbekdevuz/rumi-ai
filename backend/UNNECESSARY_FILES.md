# Unnecessary Files for Deletion

This document lists files that are no longer needed after the architecture refactoring.

## Old Routers (Not Used in main.py)

These routers are from the old document processing architecture and are not imported in the current main.py:

1. **app/routers/documents.py** - Old document management API (replaced by Books API)
2. **app/routers/ocr.py** - Old OCR integration API (not part of new architecture)
3. **app/routers/text.py** - Old text retrieval API (not part of new architecture)
4. **app/routers/status.py** - Old status tracking API (not part of new architecture)

## Old Services (Only Used by Old Routers)

These services are only referenced by the old routers above:

5. **app/services/pipeline.py** - Old pipeline orchestration (not used in new architecture)
6. **app/services/text_processor.py** - Old text processing (not used in new architecture)

## Outdated Documentation

These documentation files describe the old architecture and are no longer accurate:

7. **IMPLEMENTATION_SUMMARY.md** - Describes old document processing implementation
8. **api_specification.md** - Describes old API endpoints (replaced by API_ENDPOINTS.md)
9. **pipeline_flow.md** - Describes old pipeline flow (not applicable to new architecture)
10. **TEAM_INTEGRATION.md** - Describes old team integration (OCR/NLP teams, not applicable)
11. **system_architecture.md** - Describes old system architecture (replaced by ARCHITECTURE.md)
12. **next_week_plan.md** - Planning document, not needed for deployment

## Optional Files

13. **init-scripts/01-init.sql** - Database initialization script (may not be needed if using Alembic migrations exclusively)

## Files to Keep

### Core Application
- main.py
- app/config.py
- app/database.py
- app/models.py (updated for new schema)
- app/schemas.py (updated for new API)

### New Routers
- app/routers/auth.py
- app/routers/chat.py
- app/routers/search.py
- app/routers/books.py
- app/routers/feedback.py
- app/routers/citation.py
- app/routers/user.py

### New Services
- app/services/chat_service.py
- app/services/multilingual_generation.py
- app/services/llm_generation.py
- app/services/search_service.py
- app/services/citation_service.py

### Middleware
- app/middleware/auth.py
- app/middleware/rate_limit.py
- app/middleware/request_validator.py

### Database
- database_schema.sql (updated for new schema)
- alembic/ (migrations)

### Documentation
- README.md (needs update)
- ARCHITECTURE.md (new)
- API_ENDPOINTS.md (new)
- DEPLOYMENT_CHECKLIST.md (new)

### Configuration
- requirements.txt
- pyproject.toml
- Dockerfile
- docker-compose.yml
- nginx.conf
- .env.example (new)
- .gitignore

## Deletion Command

To delete all unnecessary files:

```bash
# Old routers
rm app/routers/documents.py
rm app/routers/ocr.py
rm app/routers/text.py
rm app/routers/status.py

# Old services
rm app/services/pipeline.py
rm app/services/text_processor.py

# Outdated documentation
rm IMPLEMENTATION_SUMMARY.md
rm api_specification.md
rm pipeline_flow.md
rm TEAM_INTEGRATION.md
rm system_architecture.md
rm next_week_plan.md

# Optional
rm -rf init-scripts/
```
