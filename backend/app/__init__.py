"""Flask application factory.

Kept as a factory so later milestones (JWT auth, SQLAlchemy models, dashboard
endpoints) can register onto the same app without restructuring.
"""
from flask import Flask, jsonify
from flask_cors import CORS

from .config import Config
from . import db
from .routes import api
from .routes_auth import auth_api
from .routes_chat import chat_api
from .routes_farms import farms_api
from .services.kb_service import KnowledgeBase
from .services.llm_service import LLMService
from .services.model_service import load_model
from .services.news_service import NewsService
from .services.weather_service import WeatherService
from .services.forecast_service import ForecastService


def create_app(config: Config = None) -> Flask:
    config = config or Config()
    app = Flask(__name__)
    app.config["APP_CONFIG"] = config
    app.config["MAX_CONTENT_LENGTH"] = config.MAX_CONTENT_LENGTH

    CORS(app, resources={r"/api/*": {"origins": config.CORS_ORIGINS}})

    # Database (optional): enables login + dashboard when DATABASE_URL is set.
    if db.init_engine(config.DATABASE_URL):
        db.create_all()
        print("[db] PostgreSQL connected — auth & dashboard enabled.")
    else:
        print("[db] No DATABASE_URL — auth & dashboard disabled (rest of app runs).")

    # Initialise services once at startup and stash them on the app.
    kb = KnowledgeBase(config.KB_PATH)
    model = load_model(config)
    llm = LLMService(config)
    news = NewsService(config)
    weather = WeatherService(config)
    forecast = ForecastService(config, kb, weather)
    app.extensions["pest_services"] = {
        "kb": kb,
        "model": model,
        "llm": llm,
        "news": news,
        "weather": weather,
        "forecast": forecast,
    }

    app.register_blueprint(api, url_prefix="/api")
    app.register_blueprint(auth_api, url_prefix="/api")
    app.register_blueprint(farms_api, url_prefix="/api")
    app.register_blueprint(chat_api, url_prefix="/api")

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
                    "/api/geocode?q=",
                    "/api/weather?lat=&lon=",
                    "/api/forecast?lat=&lon=&months=",
                    "/api/auth/register (POST)",
                    "/api/auth/login (POST)",
                    "/api/farms (GET/POST)",
                    "/api/farms/overview",
                ],
            }
        )

    @app.errorhandler(413)
    def too_large(_):
        return jsonify({"error": "Image too large (max 8 MB)."}), 413

    return app
