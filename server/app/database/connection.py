from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.core.config import settings


# ==================================================
# DATABASE ENGINE
# ==================================================

engine = create_engine(
    settings.DATABASE_URL,
    echo=True
)


# ==================================================
# DATABASE SESSION
# ==================================================

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


# ==================================================
# BASE CLASS
# ==================================================

Base = declarative_base()


# ==================================================
# DATABASE DEPENDENCY
# ==================================================

def get_db():

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()