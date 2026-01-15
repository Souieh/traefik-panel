from datetime import datetime
from typing import Generator, List, Optional, cast

from sqlalchemy import ForeignKey, create_engine, text
from sqlalchemy.exc import OperationalError
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Mapped, Session, mapped_column, sessionmaker
from sqlalchemy.orm.attributes import InstrumentedAttribute

from core.config import settings
from core.models import UserCreate, UserInDB, UserRole, UserUpdate
from lib.security import get_password_hash

# ---------------------- DATABASE SETUP ----------------------
SQLALCHEMY_DATABASE_URL: str = settings.database_url

connect_args = (
    {"check_same_thread": False} if "sqlite" in SQLALCHEMY_DATABASE_URL else {}
)

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


# ---------------------- ORM MODELS ----------------------


class UserORM(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    username: Mapped[str] = mapped_column(unique=True, index=True)
    full_name: Mapped[Optional[str]] = mapped_column(nullable=True)
    email: Mapped[Optional[str]] = mapped_column(nullable=True)
    hashed_password: Mapped[str]
    disabled: Mapped[bool] = mapped_column(default=False)
    failed_login_attempts: Mapped[int] = mapped_column(default=0)
    locked_until: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    role: Mapped[str] = mapped_column(default=UserRole.OPERATOR.value)


class UserSession(Base):
    __tablename__ = "active_sessions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    jti: Mapped[str] = mapped_column(unique=True, index=True)
    created_at: Mapped[datetime]
    expires_at: Mapped[datetime]
    ip_address: Mapped[Optional[str]] = mapped_column(nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True)


# ---------------------- SCHEMA CREATION ----------------------
Base.metadata.create_all(bind=engine)


# ---------------------- AUTO-MIGRATION ----------------------
def _auto_migrate() -> None:
    with engine.connect() as conn:
        # failed_login_attempts
        try:
            conn.execute(text("SELECT failed_login_attempts FROM users LIMIT 1"))
        except OperationalError:
            try:
                conn.execute(
                    text(
                        "ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0"
                    )
                )
                conn.commit()
            except OperationalError:
                pass
        # locked_until
        try:
            conn.execute(text("SELECT locked_until FROM users LIMIT 1"))
        except OperationalError:
            try:
                conn.execute(text("ALTER TABLE users ADD COLUMN locked_until DATETIME"))
                conn.commit()
            except OperationalError:
                pass
        # role
        try:
            conn.execute(text("SELECT role FROM users LIMIT 1"))
        except OperationalError:
            try:
                conn.execute(
                    text("ALTER TABLE users ADD COLUMN role VARCHAR DEFAULT 'operator'")
                )
                conn.commit()
            except OperationalError:
                pass


_auto_migrate()


# ---------------------- DB DEPENDENCY ----------------------
def get_db() -> Generator[Session, None, None]:
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------------- USER HELPERS ----------------------


def get_user(db: Session, username: str) -> Optional[UserInDB]:
    db_user: Optional[UserORM] = cast(
        Optional[UserORM],
        db.query(UserORM)
        .filter(cast(InstrumentedAttribute, UserORM.username) == username)
        .first(),
    )
    if db_user:
        return UserInDB(
            username=db_user.username,
            full_name=db_user.full_name,
            email=db_user.email,
            hashed_password=db_user.hashed_password,
            disabled=db_user.disabled,
            role=UserRole(db_user.role) if db_user.role else UserRole.OPERATOR,
        )
    return None


def get_user_orm(db: Session, username: str) -> Optional[UserORM]:
    return cast(
        Optional[UserORM],
        db.query(UserORM)
        .filter(cast(InstrumentedAttribute, UserORM.username) == username)
        .first(),
    )


def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[UserORM]:
    return db.query(UserORM).offset(skip).limit(limit).all()


def create_user(db: Session, user: UserCreate) -> UserORM:
    hashed_password: str = get_password_hash(user.password)
    db_user: UserORM = UserORM(
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        hashed_password=hashed_password,
        disabled=user.disabled if user.disabled is not None else False,
        role=user.role.value if user.role else UserRole.OPERATOR.value,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def update_user(
    db: Session, username: str, user_update: UserUpdate
) -> Optional[UserORM]:
    db_user: Optional[UserORM] = get_user_orm(db, username)
    if not db_user:
        return None

    update_data: dict = user_update.model_dump(exclude_unset=True)
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


def delete_user(db: Session, username: str) -> bool:
    db_user: Optional[UserORM] = get_user_orm(db, username)
    if db_user:
        db.delete(db_user)
        db.commit()
        return True
    return False


# ---------------------- INIT DEFAULT USER ----------------------
def init_db() -> None:
    db: Session = SessionLocal()
    if not get_user(db, settings.default_user_username):
        default_user: UserORM = UserORM(
            username=settings.default_user_username,
            full_name=settings.default_user_full_name,
            email=settings.default_user_email,
            hashed_password=get_password_hash(settings.default_user_password),
            disabled=False,
            role=UserRole.ADMIN.value,
        )
        db.add(default_user)
        db.commit()
    db.close()
