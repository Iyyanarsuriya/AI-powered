from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.connection import Base


class Income(Base):
    __tablename__ = "incomes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    source = Column(String(100), nullable=False)  # e.g. "Salary", "Freelance", "Dividends", "Rental", "Side Business"
    amount = Column(Float, nullable=False)
    category = Column(String(50), nullable=False, default="Salary")  # "Salary", "Freelance", "Investments", "Bonus", "Other"
    notes = Column(String(255), nullable=True)
    date = Column(DateTime, server_default=func.now(), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    # Relationship back to User
    user = relationship("User", backref="incomes")
