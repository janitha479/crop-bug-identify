"""Authentication helpers: password hashing, JWT tokens, and a login_required
decorator that loads the current user from the Bearer token.
"""
from datetime import datetime, timedelta
from functools import wraps

import jwt
from flask import current_app, g, jsonify, request
from werkzeug.security import check_password_hash, generate_password_hash

from .db import get_session, is_enabled
from .models import User


def hash_password(password: str) -> str:
    return generate_password_hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return check_password_hash(password_hash, password)


def make_token(user: User) -> str:
    cfg = current_app.config["APP_CONFIG"]
    payload = {
        "sub": str(user.id),
        "email": user.email,
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(hours=cfg.JWT_EXPIRY_HOURS),
    }
    return jwt.encode(payload, cfg.JWT_SECRET, algorithm="HS256")


def _user_from_request():
    """Decode the Bearer token and load the user, or return None."""
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None, None
    token = auth[len("Bearer "):].strip()
    cfg = current_app.config["APP_CONFIG"]
    try:
        payload = jwt.decode(token, cfg.JWT_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError:
        return None, None

    session = get_session()
    if session is None:
        return None, None
    user = session.get(User, int(payload["sub"]))
    if user is None:
        session.close()
        return None, None
    return user, session


def login_required(fn):
    """Protect a route. Injects g.user (a User) and g.db (an open Session).

    The caller is responsible for closing g.db (the routes do this in a finally)."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if not is_enabled():
            return jsonify({"error": "Accounts are not configured on this server."}), 503
        user, session = _user_from_request()
        if user is None:
            return jsonify({"error": "Please sign in to continue."}), 401
        g.user = user
        g.db = session
        try:
            return fn(*args, **kwargs)
        finally:
            session.close()

    return wrapper


def optional_user():
    """Return (user, session) if a valid token is present, else (None, None).
    Caller must close the session if one is returned."""
    if not is_enabled():
        return None, None
    return _user_from_request()
