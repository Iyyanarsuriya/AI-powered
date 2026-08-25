from fastapi import FastAPI

from app.core.config import settings

from app.database.connection import Base, engine

from app.models import User


# Create database tables
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title=settings.APP_NAME
)


@app.get("/")
def root():
    return {
        "message": "AI Expense Finance Assistant API is running"
    }


@app.get("/health")
def health():
    return {"status": "healthy"}