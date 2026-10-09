"""Route package: registers all API blueprints on the Flask app."""


def register_blueprints(app) -> None:
    from .auth_routes import auth_bp
    from .review_routes import review_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(review_bp)
