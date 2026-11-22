import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import NullPool
load_dotenv()

raw_url = os.getenv("DATABASE_URL", "").strip()

if raw_url:
    if raw_url.startswith("postgres://"):
        raw_url = raw_url.replace("postgres://", "postgresql+psycopg://", 1)
    elif raw_url.startswith("postgresql://"):
        raw_url = raw_url.replace("postgresql://", "postgresql+psycopg://", 1)
    DATABASE_URL = raw_url
    engine = create_engine(
        DATABASE_URL,
        poolclass=NullPool,
        connect_args={"prepare_threshold": None},
    )
else:
    # Fallback to local SQLite; on Vercel serverless use /tmp if no DATABASE_URL is set
    if os.getenv("VERCEL"):
        DATABASE_URL = "sqlite:////tmp/petpuja_pos.db"
    else:
        DATABASE_URL = "sqlite:///./petpuja_pos.db"
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
