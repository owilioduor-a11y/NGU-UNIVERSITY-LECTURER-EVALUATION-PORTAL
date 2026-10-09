"""Review database model."""
from datetime import datetime

from . import db


class Review(db.Model):
    __tablename__ = "reviews"

    id = db.Column(db.Integer, primary_key=True)
    student_name = db.Column(db.String(120), nullable=False, default="Anonymous")
    student_email = db.Column(db.String(180), nullable=True, index=True)
    lecturer_id = db.Column(
        db.Integer, db.ForeignKey("lecturers.id"), nullable=False, index=True
    )
    unit = db.Column(db.String(180), nullable=False)
    score = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.Text, nullable=True)
    sentiment = db.Column(db.String(20), nullable=False, default="neutral")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "student_name": self.student_name,
            "student_email": self.student_email,
            "lecturer_id": self.lecturer_id,
            "lecturer_name": self.lecturer.name if self.lecturer else None,
            "unit": self.unit,
            "score": self.score,
            "comment": self.comment,
            "sentiment": self.sentiment,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
