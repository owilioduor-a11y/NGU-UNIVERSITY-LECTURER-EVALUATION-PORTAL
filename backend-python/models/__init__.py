"""Database extension and model registry.

Importing this package gives access to the shared SQLAlchemy ``db`` instance and
re-exports every model so that ``db.create_all()`` discovers them.
"""
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

from .user import User  # noqa: E402,F401
from .lecturer import Lecturer  # noqa: E402,F401
from .review import Review  # noqa: E402,F401
