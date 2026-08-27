import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
from jose import jwt
from app.core.config import settings


def hash_password(password: str) -> str:
    pwd_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        pwd_bytes = plain_password.encode("utf-8")
        hashed_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(pwd_bytes, hashed_bytes)
    except Exception:
        return False


def create_access_token(user_id: int, remember_me: bool = False) -> Tuple[str, int]:
    if remember_me:
        expires_in = settings.REMEMBER_ME_EXPIRE_DAYS * 24 * 60 * 60
    else:
        expires_in = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60

    expire = datetime.now(timezone.utc) + timedelta(seconds=expires_in)
    payload = {"sub": str(user_id), "exp": expire}
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    return token, expires_in