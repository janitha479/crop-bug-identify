"""Database setup (SQLAlchemy + PostgreSQL).

A single engine/session factory built from DATABASE_URL. If DATABASE_URL is not
set, the database stays disabled (engine is None) and the auth/dashboard routes
return a clear "not configured" error instead of crashing — so the pest chatbot,
weather and forecast features keep working without a database.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

Base = declarative_base()

_engine = None
_SessionLocal = None


def _normalise_url(url: str) -> str:
    # Some providers (Heroku/older Neon) hand out 'postgres://'; SQLAlchemy wants
    # the explicit driver scheme 'postgresql+psycopg2://'.
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]
    if url.startswith("postgresql://"):
        url = "postgresql+psycopg2://" + url[len("postgresql://"):]
    return url


def init_engine(database_url: str):
    """Create the engine + session factory. Returns True if a DB is configured."""
    global _engine, _SessionLocal
    if not database_url:
        return False
    _engine = create_engine(
        _normalise_url(database_url),
        pool_pre_ping=True,   # recover dropped cloud connections transparently
        pool_recycle=300,
    )
    _SessionLocal = sessionmaker(bind=_engine, autoflush=False, expire_on_commit=False)
    return True


def create_all():
    """Create tables for all imported models (safe to call repeatedly)."""
    if _engine is None:
        return
    # Import models so they register on Base before create_all.
    from . import models  # noqa: F401

    Base.metadata.create_all(_engine)


def get_session():
    """Return a new Session, or None if the database isn't configured."""
    if _SessionLocal is None:
        return None
    return _SessionLocal()


def is_enabled() -> bool:
    return _SessionLocal is not None
