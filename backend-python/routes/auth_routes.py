"""Authentication endpoints: students, administrators and lecturer PINs."""
from flask import Blueprint, jsonify, request
from sqlalchemy import or_

from models import Lecturer, User, db

auth_bp = Blueprint("auth", __name__, url_prefix="/api")


def _json_error(message: str, status: int = 400):
    return jsonify({"success": False, "message": message}), status


# --------------------------------------------------------------------------
# Student accounts
# --------------------------------------------------------------------------
@auth_bp.post("/auth/signup")
def signup():
    payload = request.get_json(silent=True) or {}
    name = (payload.get("name") or "").strip()
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or payload.get("pass") or ""

    if not name or not email or not password:
        return _json_error("Name, email and password are required.")

    if User.query.filter_by(email=email).first():
        return _json_error("An account with that email already exists.", 409)

    user = User(name=name, email=email, role="student")
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    return jsonify({"success": True, "user": user.to_dict()}), 201


@auth_bp.post("/auth/login")
def login():
    payload = request.get_json(silent=True) or {}
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or payload.get("pass") or ""

    user = User.query.filter_by(email=email, role="student").first()
    if not user or not user.check_password(password):
        return _json_error("Invalid email or password.", 401)

    return jsonify({"success": True, "user": user.to_dict()})


# --------------------------------------------------------------------------
# Admin
# --------------------------------------------------------------------------
@auth_bp.post("/auth/admin/bootstrap")
def admin_bootstrap():
    if User.query.filter_by(role="admin").first():
        return _json_error("An administrator account already exists.", 409)

    payload = request.get_json(silent=True) or {}
    username = (payload.get("username") or "").strip()
    password = payload.get("password") or ""
    if not username or not password:
        return _json_error("Username and password are required.")

    email = username if "@" in username else f"{username.lower().replace(' ', '.')}@ngu.local"
    admin = User(name=username, email=email, role="admin")
    admin.set_password(password)
    db.session.add(admin)
    db.session.commit()

    return jsonify({"success": True, "user": admin.to_dict()}), 201


@auth_bp.post("/auth/admin/login")
def admin_login():
    payload = request.get_json(silent=True) or {}
    username = (payload.get("username") or "").strip()
    password = payload.get("password") or ""

    admin = (
        User.query.filter_by(role="admin")
        .filter(or_(User.name == username, User.email == username.lower()))
        .first()
    )
    if not admin or not admin.check_password(password):
        return _json_error("Unauthorized.", 401)

    return jsonify({"success": True, "user": admin.to_dict()})


# --------------------------------------------------------------------------
# Lecturer PINs
# --------------------------------------------------------------------------
@auth_bp.get("/lecturers/pins/<string:name>")
def lecturer_pin_status(name):
    lecturer = Lecturer.query.filter_by(name=name).first()
    return jsonify({"name": name, "pin_set": bool(lecturer and lecturer.has_pin)})


@auth_bp.post("/lecturers/pins")
def lecturer_set_pin():
    payload = request.get_json(silent=True) or {}
    name = (payload.get("name") or "").strip()
    pin = payload.get("pin")
    if not name or not pin:
        return _json_error("Lecturer name and PIN are required.")

    lecturer = Lecturer.query.filter_by(name=name).first()
    if not lecturer:
        lecturer = Lecturer(name=name, department=payload.get("department", "General"))
        db.session.add(lecturer)

    lecturer.set_pin(str(pin))
    db.session.commit()

    return jsonify({"success": True, "lecturer": lecturer.to_dict()})


@auth_bp.post("/lecturers/login")
def lecturer_login():
    payload = request.get_json(silent=True) or {}
    name = (payload.get("name") or "").strip()
    pin = payload.get("pin")

    lecturer = Lecturer.query.filter_by(name=name).first()
    if not lecturer or not lecturer.check_pin(pin):
        return _json_error("Invalid PIN.", 401)

    return jsonify({"success": True, "lecturer": lecturer.to_dict()})
