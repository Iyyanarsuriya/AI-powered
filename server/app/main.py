from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database.connection import Base, engine
from app.routes.auth import router as auth_router
from app.routes.income import router as income_router

# Ensure all models are registered for table creation
import app.models  # noqa: F401

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(auth_router)
app.include_router(income_router)



@app.get("/")
def root():
    return {
        "message": "AI Expense Finance Assistant API is running"
    }


@app.get("/health")
def health():
    return {"status": "healthy"}