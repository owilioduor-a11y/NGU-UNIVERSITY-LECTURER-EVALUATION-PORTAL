"""Lecturer, review and analytics endpoints."""
from flask import Blueprint, jsonify, request

from config import settings
from models import Lecturer, Review, db
from services import analytics_service

review_bp = Blueprint("reviews", __name__, url_prefix="/api")


def _json_error(message: str, status: int = 400):
    return jsonify({"success": False, "message": message}), status


# --------------------------------------------------------------------------
# Lecturers
# --------------------------------------------------------------------------
@review_bp.get("/health")
def health():
    return jsonify({"success": True, "status": "ok", "service": "lecturer-review-api"})


@review_bp.get("/lecturers")
def list_lecturers():
    query = Lecturer.query
    department = request.args.get("department")
    search = request.args.get("q")
    if department:
        query = query.filter(Lecturer.department == department)
    if search:
        query = query.filter(Lecturer.name.ilike(f"%{search}%"))

    lecturers = query.order_by(Lecturer.name).all()
    return jsonify([analytics_service.lecturer_summary(lec) for lec in lecturers])


@review_bp.get("/lecturers/search")
def search_lecturers():
    search = (request.args.get("q") or "").strip()
    query = Lecturer.query
    if search:
        query = query.filter(Lecturer.name.ilike(f"%{search}%"))
    lecturers = query.order_by(Lecturer.name).all()
    return jsonify([analytics_service.lecturer_summary(lec) for lec in lecturers])


@review_bp.get("/lecturers/<int:lecturer_id>")
def get_lecturer(lecturer_id):
    lecturer = Lecturer.query.get(lecturer_id)
    if not lecturer:
        return _json_error("Lecturer not found.", 404)

    payload = analytics_service.lecturer_summary(lecturer)
    payload["reviews"] = [
        review.to_dict()
        for review in sorted(lecturer.reviews, key=lambda r: r.created_at, reverse=True)
    ]
    return jsonify(payload)


@review_bp.post("/lecturers")
def create_lecturer():
    payload = request.get_json(silent=True) or {}
    name = (payload.get("name") or "").strip()
    if not name:
        return _json_error("Lecturer name is required.")
    if Lecturer.query.filter_by(name=name).first():
        return _json_error("A lecturer with that name already exists.", 409)

    lecturer = Lecturer(name=name, department=payload.get("department", "General"))
    db.session.add(lecturer)
    db.session.commit()
    return jsonify({"success": True, "lecturer": lecturer.to_dict()}), 201


# --------------------------------------------------------------------------
# Reviews
# --------------------------------------------------------------------------
@review_bp.get("/reviews")
def list_reviews():
    reviews = Review.query.order_by(Review.created_at.desc()).all()
    return jsonify([review.to_dict() for review in reviews])


@review_bp.get("/reviews/lecturer/<int:lecturer_id>")
def reviews_for_lecturer(lecturer_id):
    lecturer = Lecturer.query.get(lecturer_id)
    if not lecturer:
        return _json_error("Lecturer not found.", 404)
    reviews = (
        Review.query.filter_by(lecturer_id=lecturer_id)
        .order_by(Review.created_at.desc())
        .all()
    )
    return jsonify([review.to_dict() for review in reviews])


@review_bp.post("/reviews")
def create_review():
    payload = request.get_json(silent=True) or {}

    lecturer = None
    if payload.get("lecturer_id"):
        lecturer = Lecturer.query.get(payload["lecturer_id"])
    elif payload.get("lecturer") or payload.get("lec"):
        name = (payload.get("lecturer") or payload.get("lec")).strip()
        lecturer = Lecturer.query.filter_by(name=name).first()
        if not lecturer:
            lecturer = Lecturer(name=name, department=payload.get("department", "General"))
            db.session.add(lecturer)

    if not lecturer:
        return _json_error("A valid lecturer is required.")

    unit = (payload.get("unit") or "").strip()
    if not unit:
        return _json_error("Unit is required.")

    try:
        score = int(payload.get("score"))
    except (TypeError, ValueError):
        return _json_error("Score must be an integer between 0 and 100.")
    if not 0 <= score <= 100:
        return _json_error("Score must be between 0 and 100.")

    comment = (payload.get("comment") or "").strip()
    review = Review(
        student_name=(payload.get("student_name") or payload.get("name") or "Anonymous").strip(),
        student_email=(payload.get("student_email") or payload.get("email") or "").strip() or None,
        lecturer_id=lecturer.id,
        unit=unit,
        score=score,
        comment=comment,
        sentiment=analytics_service.analyze_sentiment(comment),
    )
    db.session.add(review)
    db.session.commit()

    return jsonify({"success": True, "review": review.to_dict()}), 201


# --------------------------------------------------------------------------
# Analytics
# --------------------------------------------------------------------------
@review_bp.get("/analytics/overview")
def analytics_overview():
    lecturers = Lecturer.query.all()
    reviews = Review.query.all()
    return jsonify(analytics_service.overview(lecturers, reviews))


@review_bp.get("/analytics/lecturer/<int:lecturer_id>")
def analytics_lecturer(lecturer_id):
    lecturer = Lecturer.query.get(lecturer_id)
    if not lecturer:
        return _json_error("Lecturer not found.", 404)
    return jsonify(analytics_service.lecturer_summary(lecturer))


# --------------------------------------------------------------------------
# Reference data
# --------------------------------------------------------------------------
@review_bp.get("/academic-data")
def academic_data():
    return jsonify(
        {
            "departments": settings.DEPARTMENTS,
            "units": settings.UNITS,
            "lecturers": [lecturer.to_dict() for lecturer in Lecturer.query.all()],
        }
    )


@review_bp.get("/departments")
def departments():
    return jsonify(settings.DEPARTMENTS)


@review_bp.get("/units")
def units():
    return jsonify(settings.UNITS)
