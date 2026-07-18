"""Flask application factory.

Kept as a factory so later milestones (JWT auth, SQLAlchemy models, dashboard
endpoints) can register onto the same app without restructuring.
"""
from flask import Flask, jsonify
from flask_cors import CORS

from .config import Config
from .routes import api
from .services.kb_service import KnowledgeBase
from .services.llm_service import LLMService
from .services.model_service import load_model
from .services.news_service import NewsService


def create_app(config: Config = None) -> Flask:
    config = config or Config()
    app = Flask(__name__)
    app.config["APP_CONFIG"] = config
    app.config["MAX_CONTENT_LENGTH"] = config.MAX_CONTENT_LENGTH

    CORS(app, resources={r"/api/*": {"origins": config.CORS_ORIGINS}})

    # Initialise services once at startup and stash them on the app.
    kb = KnowledgeBase(config.KB_PATH)
    model = load_model(config)
    llm = LLMService(config)
    news = NewsService(config)
    app.extensions["pest_services"] = {"kb": kb, "model": model, "llm": llm, "news": news}

    app.register_blueprint(api, url_prefix="/api")

    @app.get("/")
    def index():
        return jsonify(
            {
                "name": "Smart Pest Detection & Prediction System API",
                "endpoints": [
                    "/api/health",
                    "/api/detect (POST)",
                    "/api/chat (POST)",
                    "/api/news",
                ],
            }
        )

    @app.errorhandler(413)
    def too_large(_):
        return jsonify({"error": "Image too large (max 8 MB)."}), 413

    return app
