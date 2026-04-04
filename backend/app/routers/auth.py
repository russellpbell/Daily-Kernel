import base64
import hashlib
import hmac
import json
import time
from datetime import datetime, timedelta
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import settings
from app.database import get_db
from app.schemas import AuthResponse, LoginRequest, RegisterRequest

router = APIRouter(prefix="/auth", tags=["auth"])

security = HTTPBearer()

TOKEN_EXPIRE_DAYS = 30


def _b64encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _b64decode(s: str) -> bytes:
    padding = 4 - len(s) % 4
    if padding != 4:
        s += "=" * padding
    return base64.urlsafe_b64decode(s)


def create_token(user_id: str) -> str:
    header = _b64encode(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
    exp = int((datetime.utcnow() + timedelta(days=TOKEN_EXPIRE_DAYS)).timestamp())
    payload = _b64encode(json.dumps({"sub": user_id, "exp": exp}).encode())
    signing_input = f"{header}.{payload}"
    sig = hmac.new(
        settings.SECRET_KEY.encode(), signing_input.encode(), hashlib.sha256
    ).digest()
    return f"{signing_input}.{_b64encode(sig)}"


def decode_token(token: str) -> dict:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            raise ValueError("Invalid token")
        signing_input = f"{parts[0]}.{parts[1]}"
        expected_sig = hmac.new(
            settings.SECRET_KEY.encode(), signing_input.encode(), hashlib.sha256
        ).digest()
        actual_sig = _b64decode(parts[2])
        if not hmac.compare_digest(expected_sig, actual_sig):
            raise ValueError("Invalid signature")
        payload = json.loads(_b64decode(parts[1]))
        if payload.get("exp", 0) < time.time():
            raise ValueError("Token expired")
        return payload
    except Exception:
        raise ValueError("Invalid token")


def hash_pin(pin: str) -> str:
    salt = base64.urlsafe_b64encode(hashlib.sha256(pin.encode()).digest()[:16]).decode()
    return hashlib.pbkdf2_hmac("sha256", pin.encode(), salt.encode(), 100000).hex() + ":" + salt


def verify_pin(pin: str, pin_hash: str) -> bool:
    try:
        stored_hash, salt = pin_hash.split(":")
        computed = hashlib.pbkdf2_hmac("sha256", pin.encode(), salt.encode(), 100000).hex()
        return hmac.compare_digest(computed, stored_hash)
    except Exception:
        return False


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    token = credentials.credentials
    try:
        payload = decode_token(token)
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
            )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )

    async with get_db() as db:
        cursor = await db.execute("SELECT id FROM users WHERE id = ?", (user_id,))
        row = await cursor.fetchone()
        if row is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found"
            )

    return user_id


@router.post("/register", response_model=AuthResponse)
async def register(req: RegisterRequest):
    if len(req.pin) < 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PIN must be at least 4 characters",
        )

    async with get_db() as db:
        cursor = await db.execute(
            "SELECT id FROM users WHERE name = ?", (req.name,)
        )
        if await cursor.fetchone():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username already taken",
            )

        user_id = str(uuid4())
        pin_hashed = hash_pin(req.pin)
        now = datetime.utcnow().isoformat()

        await db.execute(
            "INSERT INTO users (id, name, pin_hash, cards_per_briefing, created_at) VALUES (?, ?, ?, ?, ?)",
            (user_id, req.name, pin_hashed, settings.CARDS_PER_BRIEFING_DEFAULT, now),
        )

        streak_id = str(uuid4())
        await db.execute(
            "INSERT INTO streaks (id, user_id, current_streak, longest_streak) VALUES (?, ?, 0, 0)",
            (streak_id, user_id),
        )

        await db.commit()

    token = create_token(user_id)
    return AuthResponse(user_id=user_id, token=token, name=req.name)


@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    async with get_db() as db:
        cursor = await db.execute(
            "SELECT id, name, pin_hash FROM users WHERE name = ?", (req.name,)
        )
        row = await cursor.fetchone()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )

    if not verify_pin(req.pin, row["pin_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )

    token = create_token(row["id"])
    return AuthResponse(user_id=row["id"], token=token, name=row["name"])
