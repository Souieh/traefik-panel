import uuid
from datetime import datetime, timedelta, timezone
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from sqlalchemy import or_
from core.config import settings
from core.models import Token, UserLogin, UserChangePassword, UserForgotPassword, UserResetPassword, User
from core.database import get_db, get_user_orm, UserSession, User as UserORM
from lib.security import verify_password, create_access_token, get_password_hash
from lib.smtp import EmailSender
from lib.dependencies import get_current_user

router = APIRouter()
security_scheme = HTTPBearer()

MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_TIME_MINUTES = 15

@router.post("/login", response_model=Token)
async def login(
    request: Request,
    user_data: UserLogin,
    db: Annotated[Session, Depends(get_db)]
):
    user = db.query(UserORM).filter(
        or_(UserORM.username == user_data.username, UserORM.email == user_data.username)
    ).first()
    
    # Check if account is locked
    if user and user.locked_until:
        if user.locked_until > datetime.now(timezone.utc).replace(tzinfo=None):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account locked due to too many failed attempts. Please try again later.",
            )

    if not user or not verify_password(user_data.password, user.hashed_password):
        # Increment failed attempts
        if user:
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= MAX_LOGIN_ATTEMPTS:
                user.locked_until = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=LOCKOUT_TIME_MINUTES)
            db.commit()
            
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Reset failed attempts on success
    if user.failed_login_attempts > 0 or user.locked_until:
        user.failed_login_attempts = 0
        user.locked_until = None
        db.commit()

    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    
    # Create session
    jti = str(uuid.uuid4())
    expires_at = datetime.now(timezone.utc) + access_token_expires
    user_session = UserSession(
        user_id=user.id,
        jti=jti,
        created_at=datetime.now(timezone.utc).replace(tzinfo=None),
        expires_at=expires_at.replace(tzinfo=None),
        ip_address=request.client.host if request.client else "127.0.0.1",
        user_agent=request.headers.get("user-agent"),
        is_active=True
    )
    db.add(user_session)
    db.commit()

    access_token = create_access_token(
        data={"sub": user.username, "jti": jti}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/change-password")
async def change_password(
    password_data: UserChangePassword,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
):
    user_orm = get_user_orm(db, current_user.username)
    if not user_orm:
        raise HTTPException(status_code=404, detail="User not found")
        
    if not verify_password(password_data.old_password, user_orm.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid old password")
    
    user_orm.hashed_password = get_password_hash(password_data.new_password)
    db.commit()
    return {"msg": "Password updated successfully"}

@router.post("/forgot-password")
async def forgot_password(
    data: UserForgotPassword,
    db: Annotated[Session, Depends(get_db)]
):
    user = db.query(UserORM).filter(UserORM.email == data.email).first()
    if user:
        expires = timedelta(minutes=15)
        reset_token = create_access_token(
            data={"sub": user.username, "scope": "reset_password"},
            expires_delta=expires
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
                    <img src="https://traefik.io/img/traefik-proxy-logo.svg" alt="Traefik Proxy Manager Logo" class="logo">
                </div>
                <div class="content">
                    <p>Hello,</p>
                    <p>You have requested to reset your password. Please use the code below to proceed:</p>
                    <div class="code">{reset_token}</div>
                    <p>This code will expire in 15 minutes.</p>
                    <p>If you did not request a password reset, please ignore this email.</p>
                </div>
                <div class="footer">
                    <p>&copy; {datetime.now().year} Traefik Proxy Manager (TPM). All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        sender.send_email(user.email, "Password Reset Request", html_content, is_html=True)
        
    return {"msg": "If the email exists, a reset link has been sent."}

@router.post("/reset-password")
async def reset_password(
    data: UserResetPassword,
    db: Annotated[Session, Depends(get_db)]
):
    try:
        payload = jwt.decode(data.token, settings.secret_key, algorithms=[settings.algorithm])
        username: str = payload.get("sub")
        scope: str = payload.get("scope")
        
        if username is None or scope != "reset_password":
            raise HTTPException(status_code=400, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid token")
        
    user = get_user_orm(db, username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.hashed_password = get_password_hash(data.new_password)
    db.commit()
    return {"msg": "Password reset successfully"}

@router.post("/logout")
async def logout(
    token: Annotated[HTTPAuthorizationCredentials, Depends(security_scheme)],
    db: Annotated[Session, Depends(get_db)]
):
    try:
        payload = jwt.decode(token.credentials, settings.secret_key, algorithms=[settings.algorithm])
        jti = payload.get("jti")
        if jti:
            session = db.query(UserSession).filter(UserSession.jti == jti).first()
            if session:
                session.is_active = False
                db.commit()
    except Exception:
        # If token is invalid, we just ignore it for logout
        pass
    return {"msg": "Successfully logged out"}