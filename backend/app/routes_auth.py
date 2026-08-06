"""Auth endpoints: register, login, and current-user."""
import re

from flask import Blueprint, g, jsonify, request

from .auth import hash_password, login_required, make_token, verify_password
from .db import get_session, is_enabled
from .models import User

auth_api = Blueprint("auth_api", __name__)

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _require_db():
    if not is_enabled():
        return jsonify({"error": "Accounts are not configured on this server."}), 503
    return None


@auth_api.post("/auth/register")
def register():
    guard = _require_db()
    if guard:
        return guard

    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    full_name = (data.get("full_name") or "").strip()
    district = (data.get("district") or "").strip()

    if not _EMAIL_RE.match(email):
        return jsonify({"error": "Enter a valid email address."}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters."}), 400

    session = get_session()
    try:
        if session.query(User).filter_by(email=email).first():
            return jsonify({"error": "An account with that email already exists."}), 409
        user = User(
            email=email,
            password_hash=hash_password(password),
            full_name=full_name,
            district=district,
        )
        session.add(user)
        session.commit()
        token = make_token(user)
        return jsonify({"token": token, "user": user.to_dict()}), 201
    finally:
        session.close()


@auth_api.post("/auth/login")
def login():
    guard = _require_db()
    if guard:
        return guard

    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    session = get_session()
    try:
        user = session.query(User).filter_by(email=email).first()
        if user is None or not verify_password(password, user.password_hash):
            return jsonify({"error": "Wrong email or password."}), 401
        token = make_token(user)
        return jsonify({"token": token, "user": user.to_dict()})
    finally:
        session.close()


@auth_api.get("/auth/me")
@login_required
def me():
    return jsonify({"user": g.user.to_dict()})
