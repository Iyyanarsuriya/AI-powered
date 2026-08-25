from sqlalchemy import (Column,Integer,String,Boolean,DateTime)

from sqlalchemy.sql import func

from app.database.connection import Base


class User(Base):

    __tablename__ = "users"

    # Primary key
    id = Column(Integer,primary_key=True,index=True)

    # User's full name
    full_name = Column(String(100),nullable=False)

    # User's email
    email = Column(String(255),unique=True,nullable=False,index=True)

    # Hashed password
    password = Column(String(255),nullable=False)

    # Terms and privacy acceptance
    terms_accepted = Column(Boolean,nullable=False,default=False)

    # Account creation time
    created_at = Column(DateTime,server_default=func.now())
