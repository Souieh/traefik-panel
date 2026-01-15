import uuid
from datetime import datetime, timedelta, timezone
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy import or_
from sqlalchemy.orm import Session

from core.config import settings
from core.database import UserORM, UserSession, get_db, get_user_orm
from core.dependencies import get_current_user
from core.models import (
    Token,
    User,
    UserChangePassword,
    UserForgotPassword,
    UserLogin,
    UserResetPassword,
)
from lib.security import create_access_token, get_password_hash, verify_password
from lib.smtp import EmailSender

router = APIRouter()
security_scheme = HTTPBearer()

MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_TIME_MINUTES = 15


# ---------------- LOGIN ----------------
@router.post("/login", response_model=Token)
async def login(
    request: Request, user_data: UserLogin, db: Annotated[Session, Depends(get_db)]
) -> Token:
    user: Optional[UserORM] = (
        db.query(UserORM)
        .filter(
            or_(
                UserORM.username == user_data.username,
                UserORM.email == user_data.username,
            )
        )
        .first()
    )

    now_utc = datetime.now(timezone.utc)

    # Check lockout
    if user and user.locked_until and user.locked_until > now_utc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account locked due to too many failed attempts. Please try again later.",
        )

    # Invalid login
    if not user or not verify_password(user_data.password, user.hashed_password):
        if user:
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= MAX_LOGIN_ATTEMPTS:
                user.locked_until = now_utc + timedelta(minutes=LOCKOUT_TIME_MINUTES)
            db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Reset failed attempts
    if user.failed_login_attempts > 0 or user.locked_until:
        user.failed_login_attempts = 0
        user.locked_until = None
        db.commit()

    # Token creation
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    jti = str(uuid.uuid4())
    expires_at = now_utc + access_token_expires

    user_session = UserSession(
        user_id=user.id,
        jti=jti,
        created_at=now_utc,
        expires_at=expires_at,
        ip_address=request.client.host if request.client else "127.0.0.1",
        user_agent=request.headers.get("user-agent"),
        is_active=True,
    )
    db.add(user_session)
    db.commit()

    access_token = create_access_token(
        data={"sub": user.username, "jti": jti}, expires_delta=access_token_expires
    )
    return Token(access_token=access_token, token_type="bearer")


# ---------------- CHANGE PASSWORD ----------------
@router.post("/change-password")
async def change_password(
    password_data: UserChangePassword,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    user_orm: Optional[UserORM] = get_user_orm(db, current_user.username)
    if not user_orm:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_password(password_data.old_password, user_orm.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid old password")

    user_orm.hashed_password = get_password_hash(password_data.new_password)
    db.commit()
    return {"msg": "Password updated successfully"}


# ---------------- FORGOT PASSWORD ----------------
@router.post("/forgot-password")
async def forgot_password(
    data: UserForgotPassword, db: Annotated[Session, Depends(get_db)]
) -> dict:
    user: Optional[UserORM] = (
        db.query(UserORM).filter(UserORM.email == data.email).first()
    )
    if not user:
        return {"msg": "If the email exists, a reset link has been sent."}

    expires = timedelta(minutes=15)
    reset_token = create_access_token(
        data={"sub": user.username, "scope": "reset_password"},
        expires_delta=expires,
    )

    sender = EmailSender()
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }}
            .container {{ max-width: 600px; margin: 0 auto; background: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }}
            .header {{ text-align: center; margin-bottom: 20px; }}
            .logo {{ max-width: 150px; }}
            .content {{ font-size: 16px; color: #333; line-height: 1.6; }}
            .code {{ display: block; width: fit-content; margin: 20px auto; padding: 15px 30px; background-color: #007bff; color: #ffffff; font-size: 16px; font-weight: bold; border-radius: 5px; word-break: break-all; text-align: center; }}
            .footer {{ margin-top: 20px; text-align: center; font-size: 12px; color: #888; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="https://traefik.io/img/traefik-proxy-logo.svg" alt="Traefik Panel Logo" class="logo">
            </div>
            <div class="content">
                <p>Hello,</p>
                <p>You have requested to reset your password. Please use the code below to proceed:</p>
                <div class="code">{reset_token}</div>
                <p>This code will expire in 15 minutes.</p>
                <p>If you did not request a password reset, please ignore this email.</p>
            </div>
            <div class="footer">
                <p>&copy; {datetime.now().year} Traefik Panel (TPM). All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """
    if user.email:
        sender.send_email(
            user.email, "Password Reset Request", html_content, is_html=True
        )
    else:
        print(f"Warning: User {user.username} has no email address to send reset link.")
    return {"msg": "If the email exists, a reset link has been sent."}


# ---------------- RESET PASSWORD ----------------
@router.post("/reset-password")
async def reset_password(
    data: UserResetPassword, db: Annotated[Session, Depends(get_db)]
) -> dict:
    try:
        payload = jwt.decode(
            data.token, settings.secret_key, algorithms=[settings.algorithm]
        )
        username: Optional[str] = payload.get("sub")
        scope: Optional[str] = payload.get("scope")

        if not username or scope != "reset_password":
            raise HTTPException(status_code=400, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid token")

    user: Optional[UserORM] = get_user_orm(db, username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = get_password_hash(data.new_password)
    db.commit()
    return {"msg": "Password reset successfully"}


# ---------------- LOGOUT ----------------
@router.post("/logout")
async def logout(
    token: Annotated[HTTPAuthorizationCredentials, Depends(security_scheme)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    try:
        payload = jwt.decode(
            token.credentials, settings.secret_key, algorithms=[settings.algorithm]
        )
        jti: Optional[str] = payload.get("jti")
        if jti:
            session: Optional[UserSession] = (
                db.query(UserSession).filter(UserSession.jti == jti).first()
            )
            if session:
                session.is_active = False  # type: ignore
                db.commit()
    except JWTError:
        # Ignore invalid tokens
        pass

    return {"msg": "Successfully logged out"}
