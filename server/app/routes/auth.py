from fastapi import (APIRouter,Depends,HTTPException,status)
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.user import User
from app.schemas.auth import (SignupRequest,LoginRequest,UserResponse,LoginResponse)
from app.core.security import (hash_password,verify_password,create_access_token)



router = APIRouter(prefix="/api/auth",tags=["Authentication"])

@router.post("/signup",response_model=UserResponse,status_code=status.HTTP_201_CREATED)
def signup(user_data: SignupRequest,db: Session = Depends(get_db)):


    statement = select(User).where(User.email == user_data.email)

    existing_user = db.scalar(statement)

    if existing_user:

        raise HTTPException(status_code=status.HTTP_409_CONFLICT,detail="Email already registered")

    hashed_password = hash_password(user_data.password)

    new_user = User(full_name=user_data.full_name,email=user_data.email,password=hashed_password,terms_accepted=user_data.terms_accepted)

    db.add(new_user)

    db.commit()

    db.refresh(new_user)

    return new_user


# ==================================================
# LOGIN
# POST /api/auth/login
# ==================================================

@router.post("/login",response_model=LoginResponse)
def login(user_data: LoginRequest,db: Session = Depends(get_db)):


    statement = select(User).where(User.email == user_data.email)

    user = db.scalar(statement)

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail="Invalid email or password")


    password_correct = verify_password(user_data.password,user.password)



    if not password_correct:

        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail="Invalid email or password")



    access_token, expires_in = create_access_token(user_id=user.id,remember_me=user_data.remember_me)



    return {"access_token": access_token,"token_type": "bearer","expires_in": expires_in,"user": {"id": user.id,"full_name": user.full_name,"email": user.email}}