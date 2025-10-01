from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncIterator

from sqlalchemy import inspect, text
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base declarative class for SQLAlchemy models."""


def build_database_url(base_directory: Path) -> str:
    """Return a SQLite URL located within *base_directory*."""
    database_path = base_directory / "app.db"
    database_path.parent.mkdir(parents=True, exist_ok=True)
    return f"sqlite+aiosqlite:///{database_path}".replace("\\", "/")


def create_engine(database_url: str, *, echo: bool = False) -> AsyncEngine:
    """Create an async SQLAlchemy engine."""
    return create_async_engine(database_url, echo=echo, future=True)


def create_sessionmaker(engine: AsyncEngine) -> async_sessionmaker[AsyncSession]:
    """Return an async session factory bound to *engine*."""
    return async_sessionmaker(engine, expire_on_commit=False)


@asynccontextmanager
async def lifespan_sessionmaker(
    factory: async_sessionmaker[AsyncSession],
) -> AsyncIterator[AsyncSession]:
    """Yield an :class:`AsyncSession` and ensure it is closed afterwards."""
    session = factory()
    try:
        yield session
    finally:
        await session.close()


def _ensure_sqlite_schema(sync_connection) -> None:
    """Apply lightweight migrations for existing SQLite databases."""

    inspector = inspect(sync_connection)

    documents_columns = {column["name"] for column in inspector.get_columns("documents")}
    if "recommended_provider" not in documents_columns:
        sync_connection.execute(text("ALTER TABLE documents ADD COLUMN recommended_provider VARCHAR(64)"))
    if "recommendation_reason" not in documents_columns:
        sync_connection.execute(text("ALTER TABLE documents ADD COLUMN recommendation_reason TEXT"))
    if "selected_provider" not in documents_columns:
        sync_connection.execute(text("ALTER TABLE documents ADD COLUMN selected_provider VARCHAR(64)"))

    page_columns = {column["name"] for column in inspector.get_columns("document_pages")}
    if "image_path" not in page_columns:
        sync_connection.execute(text("ALTER TABLE document_pages ADD COLUMN image_path VARCHAR(255)"))


async def initialize_database(engine: AsyncEngine) -> None:
    """Create tables and apply SQLite-compatible schema upgrades."""
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
        await connection.run_sync(_ensure_sqlite_schema)
