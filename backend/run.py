"""Development entry point: python run.py"""
from app import create_app
from app.config import Config

app = create_app()

if __name__ == "__main__":
    cfg = Config()
    app.run(host="0.0.0.0", port=cfg.PORT, debug=cfg.DEBUG)
