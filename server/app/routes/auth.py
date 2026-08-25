from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status
)

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.user import User

from app.schemas.auth import (
    SignupRequest,
    LoginRequest,
    UserResponse,
    LoginResponse
)

from app.core.security import (
    hash_password,
    verify_password,
    create_access_token
)


# ==================================================
# AUTHENTICATION ROUTER
# ==================================================

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)


# ==================================================
# SIGN UP
# POST /api/auth/signup
# ==================================================

@router.post(
    "/signup",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
def signup(
    user_data: SignupRequest,
    db: Session = Depends(get_db)
):

    # ------------------------------------------------
    # 1. Check whether email already exists
    # ------------------------------------------------

    statement = select(User).where(
        User.email == user_data.email
    )

    existing_user = db.scalar(statement)

    if existing_user:

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )


    # ------------------------------------------------
    # 2. Hash the password
    # ------------------------------------------------

    hashed_password = hash_password(
        user_data.password
    )


    # ------------------------------------------------
    # 3. Create a new User object
    # ------------------------------------------------

    new_user = User(
        full_name=user_data.full_name,
        email=user_data.email,
        password=hashed_password,
        terms_accepted=user_data.terms_accepted
    )


    # ------------------------------------------------
    # 4. Add user to database session
    # ------------------------------------------------

    db.add(new_user)


    # ------------------------------------------------
    # 5. Save user to MySQL
    # ------------------------------------------------

    db.commit()


    # ------------------------------------------------
    # 6. Get generated ID and other database values
    # ------------------------------------------------

    db.refresh(new_user)


    # ------------------------------------------------
    # 7. Return user
    # ------------------------------------------------

    return new_user


# ==================================================
# LOGIN
# POST /api/auth/login
# ==================================================

@router.post(
    "/login",
    response_model=LoginResponse
)
def login(
    user_data: LoginRequest,
    db: Session = Depends(get_db)
):

    # ------------------------------------------------
    # 1. Find user using email
    # ------------------------------------------------

    statement = select(User).where(
        User.email == user_data.email
    )

    user = db.scalar(statement)


    # ------------------------------------------------
    # 2. Check whether user exists
    # ------------------------------------------------

    if not user:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )


    # ------------------------------------------------
    # 3. Verify password
    # ------------------------------------------------

    password_correct = verify_password(
        user_data.password,
        user.password
    )


    # ------------------------------------------------
    # 4. Check password result
    # ------------------------------------------------

    if not password_correct:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )


    # ------------------------------------------------
    # 5. Create JWT token
    # ------------------------------------------------

    access_token, expires_in = create_access_token(
        user_id=user.id,
        remember_me=user_data.remember_me
    )


    # ------------------------------------------------
    # 6. Return login response
    # ------------------------------------------------

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": expires_in,
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email
        }
    }