from datetime import datetime, timedelta, timezone

from jose import jwt

from passlib.context import CryptContext

from app.core.config import settings


# ==================================================
# PASSWORD HASHING CONFIGURATION
# ==================================================

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


# ==================================================
# HASH PASSWORD
# ==================================================

def hash_password(password: str) -> str:

    return pwd_context.hash(password)


# ==================================================
# VERIFY PASSWORD
# ==================================================

def verify_password(plain_password: str,hashed_password: str) -> bool:

    return pwd_context.verify(plain_password,hashed_password)


# ==================================================
# CREATE JWT ACCESS TOKEN
# ==================================================

def create_access_token(user_id: int,remember_me: bool = False):

    # ----------------------------------------------
    # Decide token expiration
    # ----------------------------------------------

    if remember_me:

        expires_in = (settings.REMEMBER_ME_EXPIRE_DAYS*24*60*60)

    else:

        expires_in = (settings.ACCESS_TOKEN_EXPIRE_MINUTES*60)


    # ----------------------------------------------
    # Calculate expiration time
    # ----------------------------------------------

    expire = (datetime.now(timezone.utc)+ timedelta(seconds=expires_in))


    # ----------------------------------------------
    # JWT payload
    # ----------------------------------------------

    payload = {"sub": str(user_id),"exp": expire}


    # ----------------------------------------------
    # Generate JWT
    # ----------------------------------------------

    token = jwt.encode(payload,settings.SECRET_KEY,algorithm=settings.ALGORITHM)


    return token, expires_in