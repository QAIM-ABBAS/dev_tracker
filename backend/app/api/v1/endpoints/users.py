"""Users endpoint — registration, login, and user management."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import (
    Token,
    UserCreate,
    UserLogin,
    UserOut,
    UserUpdate,
)
from app.services import user_srv

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(payload: UserCreate, db: AsyncSession = Depends(get_db)) -> UserOut:
    """Register a new user account."""
    return await user_srv.register_user(db, payload)


@router.post("/login", response_model=Token)
async def login(payload: UserLogin, db: AsyncSession = Depends(get_db)) -> Token:
    """Authenticate and receive a JWT token."""
    return await user_srv.login_user(db, payload)


@router.get("/me", response_model=UserOut)
async def get_me(
    current_user: User = Depends(get_current_user),
) -> UserOut:
    """Get the current authenticated user's profile."""
    return UserOut.model_validate(current_user)


@router.get("", response_model=list[UserOut])
async def list_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[UserOut]:
    """List all users (requires authentication)."""
    return await user_srv.list_users(db)


@router.get("/{user_id}", response_model=UserOut)
async def get_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserOut:
    """Get a user by ID (requires authentication)."""
    return await user_srv.get_user(db, user_id)


@router.patch("/{user_id}", response_model=UserOut)
async def update_user(
    user_id: str,
    payload: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserOut:
    """Update a user (users can update themselves, admins can update anyone)."""
    return await user_srv.update_user(db, user_id, payload, current_user)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    """Delete a user (users can delete themselves, admins can delete anyone)."""
    await user_srv.delete_user(db, user_id, current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)