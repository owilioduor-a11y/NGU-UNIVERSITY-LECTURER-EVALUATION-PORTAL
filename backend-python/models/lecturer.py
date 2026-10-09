"""Lecturer database model."""
from datetime import datetime

from werkzeug.security import check_password_hash, generate_password_hash

from . import db


class Lecturer(db.Model):
    __tablename__ = "lecturers"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), unique=True, nullable=False, index=True)
    department = db.Column(db.String(120), nullable=False, default="General")
    pin_hash = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    reviews = db.relationship(
        "Review",
        backref="lecturer",
        lazy=True,
        cascade="all, delete-orphan",
    )

    def set_pin(self, pin: str) -> None:
        self.pin_hash = generate_password_hash(str(pin))

    def check_pin(self, pin: str) -> bool:
        return bool(self.pin_hash) and check_password_hash(self.pin_hash, str(pin))

    @property
    def has_pin(self) -> bool:
        return bool(self.pin_hash)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "department": self.department,
            "has_pin": self.has_pin,
        }
