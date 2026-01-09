from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from core.models import User, UserCreate, UserUpdate
from core.database import get_db, get_users, create_user, update_user, delete_user, get_user_orm
from lib.dependencies import get_current_active_user, is_admin

router = APIRouter()

@router.get("/users/me/", response_model=User)
async def read_users_me(
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    return current_user

@router.get("/users/", response_model=List[User])
async def read_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    users = get_users(db, skip=skip, limit=limit)
    return users

@router.post("/users/", response_model=User, dependencies=[Depends(is_admin)])
async def create_new_user(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    db_user = get_user_orm(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    return create_user(db=db, user=user)

@router.put("/users/{username}", response_model=User, dependencies=[Depends(is_admin)])
async def update_existing_user(
    username: str,
    user_update: UserUpdate,
    db: Session = Depends(get_db)
):
    updated_user = update_user(db, username, user_update)
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    return updated_user

@router.delete("/users/{username}")
async def delete_existing_user(
    username: str,
    current_user: User = Depends(is_admin),
    db: Session = Depends(get_db)
):
    if current_user.username == username:
         raise HTTPException(status_code=400, detail="Cannot delete yourself")
    if not delete_user(db, username):
        raise HTTPException(status_code=404, detail="User not found")
    return {"msg": "User deleted"}