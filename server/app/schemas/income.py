from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class IncomeCreate(BaseModel):
    source: str = Field(min_length=1, max_length=100, description="Source of income, e.g. Salary")
    amount: float = Field(gt=0, description="Amount must be positive")
    category: str = Field(default="Salary", min_length=1, max_length=50)
    notes: Optional[str] = Field(default=None, max_length=255)
    date: Optional[datetime] = None


class IncomeUpdate(BaseModel):
    source: Optional[str] = Field(default=None, min_length=1, max_length=100)
    amount: Optional[float] = Field(default=None, gt=0)
    category: Optional[str] = Field(default=None, min_length=1, max_length=50)
    notes: Optional[str] = Field(default=None, max_length=255)
    date: Optional[datetime] = None


class IncomeResponse(BaseModel):
    id: int
    user_id: int
    source: str
    amount: float
    category: str
    notes: Optional[str] = None
    date: datetime
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class IncomeSourceBreakdown(BaseModel):
    source: str
    total_amount: float
    percentage: float
    count: int


class IncomeSummaryResponse(BaseModel):
    total_income: float
    monthly_income: float
    income_count: int
    source_breakdown: List[IncomeSourceBreakdown]
    recent_incomes: List[IncomeResponse]
