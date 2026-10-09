"""Main application entry point.

Run with:
    python backend-python/app.py
or:
    flask --app backend-python/app.py run --debug

The same process serves the JSON API under ``/api`` and the static frontend
from ``/frontend`` so the portal works on a single origin.
"""
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS

from config import settings
from models import Lecturer, db
from routes import register_blueprints


def seed_data() -> None:
    """Populate the lecturer table on first run."""
    if Lecturer.query.count() == 0:
        for entry in settings.SEED_LECTURERS:
            db.session.add(Lecturer(**entry))
        db.session.commit()


def create_app() -> Flask:
    app = Flask(__name__, static_folder=None)
    app.config.update(
        SECRET_KEY=settings.SECRET_KEY,
        SQLALCHEMY_DATABASE_URI=settings.SQLALCHEMY_DATABASE_URI,
        SQLALCHEMY_TRACK_MODIFICATIONS=settings.SQLALCHEMY_TRACK_MODIFICATIONS,
        JSON_SORT_KEYS=False,
    )

    CORS(app, resources={r"/api/*": {"origins": settings.CORS_ORIGINS}})
    db.init_app(app)
    register_blueprints(app)

    with app.app_context():
        db.create_all()
        seed_data()

    frontend_dir = str(settings.FRONTEND_DIR)

    @app.get("/")
    def index():
        return send_from_directory(frontend_dir, "index.html")

    @app.get("/<path:filename>")
    def frontend_files(filename):
        if filename.startswith("api/"):
            return jsonify({"success": False, "message": "Not found"}), 404
        return send_from_directory(frontend_dir, filename)

    @app.errorhandler(404)
    def not_found(_error):
        return jsonify({"success": False, "message": "Not found"}), 404

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host=settings.HOST, port=settings.PORT, debug=settings.DEBUG)
