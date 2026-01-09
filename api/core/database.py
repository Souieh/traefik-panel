from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, ForeignKey, text
from sqlalchemy.exc import OperationalError
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from core.config import settings
from core.models import UserInDB
from core.models import User, UserCreate, UserUpdate, UserRole
from lib.security import get_password_hash

SQLALCHEMY_DATABASE_URL = settings.database_url

connect_args = {"check_same_thread": False} if "sqlite" in SQLALCHEMY_DATABASE_URL else {}

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args=connect_args
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    full_name = Column(String)
    email = Column(String)
    hashed_password = Column(String)
    disabled = Column(Boolean, default=False)
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)
    role = Column(String, default=UserRole.OPERATOR.value)

class UserSession(Base):
    __tablename__ = "active_sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    jti = Column(String, unique=True, index=True)
    created_at = Column(DateTime)
    expires_at = Column(DateTime)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)

Base.metadata.create_all(bind=engine)

def _auto_migrate():
    with engine.connect() as conn:
        try:
            conn.execute(text("SELECT failed_login_attempts FROM users LIMIT 1"))
        except OperationalError:
            try:
                conn.execute(text("ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0"))
                conn.commit()
            except OperationalError:
                pass
        try:
            conn.execute(text("SELECT locked_until FROM users LIMIT 1"))
        except OperationalError:
            try:
                conn.execute(text("ALTER TABLE users ADD COLUMN locked_until DATETIME"))
                conn.commit()
            except OperationalError:
                pass
        try:
            conn.execute(text("SELECT role FROM users LIMIT 1"))
        except OperationalError:
            try:
                conn.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR DEFAULT 'operator'"))
                conn.commit()
            except OperationalError:
                pass

_auto_migrate()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_user(db: Session, username: str):
    user = db.query(User).filter(User.username == username).first()
    if user:
        return UserInDB(
            username=user.username,
            full_name=user.full_name,
            email=user.email,
            hashed_password=user.hashed_password,
            disabled=user.disabled,
            role=UserRole(user.role) if user.role else UserRole.OPERATOR,
        )
    return None

def get_user_orm(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()


def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(User).offset(skip).limit(limit).all()

def create_user(db: Session, user: UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = User(
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        hashed_password=hashed_password,
        disabled=user.disabled if user.disabled is not None else False,
        role=user.role.value if user.role else UserRole.OPERATOR.value
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, username: str, user_update: UserUpdate):
    db_user = get_user_orm(db, username)
    if not db_user:
        return None
    
    update_data = user_update.model_dump(exclude_unset=True)
    if "password" in update_data:
        password = update_data.pop("password")
        if password:
            db_user.hashed_password = get_password_hash(password)
            
    for key, value in update_data.items():
        if isinstance(value, UserRole):
            value = value.value
        setattr(db_user, key, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user

def delete_user(db: Session, username: str):
    db_user = get_user_orm(db, username)
    if db_user:
        db.delete(db_user)
        db.commit()
        return True
    return False


def init_db():
    db = SessionLocal()
    if not get_user(db, settings.default_user_username):
        user = User(
            username=settings.default_user_username,
            full_name=settings.default_user_full_name,
            email=settings.default_user_email,
            hashed_password=get_password_hash(settings.default_user_password),
            disabled=False,
            role=UserRole.ADMIN.value
        )
        db.add(user)
        db.commit()
    db.close()
