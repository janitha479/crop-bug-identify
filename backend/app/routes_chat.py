"""Saved chat conversations, so a farmer can reopen past advice after closing the chat."""
from flask import Blueprint, g, jsonify

from .auth import login_required
from .models import Conversation

chat_api = Blueprint("chat_api", __name__)


@chat_api.get("/conversations")
@login_required
def list_conversations():
    """Newest-first list of the farmer's saved chats (without message bodies)."""
    convs = (
        g.db.query(Conversation)
        .filter_by(user_id=g.user.id)
        .order_by(Conversation.updated_at.desc())
        .limit(50)
        .all()
    )
    return jsonify({"conversations": [c.to_dict() for c in convs]})


@chat_api.get("/conversations/<int:conv_id>")
@login_required
def get_conversation(conv_id):
    """Full transcript of one saved chat."""
    conv = g.db.get(Conversation, conv_id)
    if conv is None or conv.user_id != g.user.id:
        return jsonify({"error": "Conversation not found."}), 404
    return jsonify({"conversation": conv.to_dict(with_messages=True)})


@chat_api.delete("/conversations/<int:conv_id>")
@login_required
def delete_conversation(conv_id):
    conv = g.db.get(Conversation, conv_id)
    if conv is None or conv.user_id != g.user.id:
        return jsonify({"error": "Conversation not found."}), 404
    g.db.delete(conv)
    g.db.commit()
    return jsonify({"ok": True})
