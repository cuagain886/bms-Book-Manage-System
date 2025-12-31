from app.routes.auth import auth_bp
from app.routes.book import book_bp
from app.routes.borrow import borrow_bp
from app.routes.user import user_bp

__all__ = ['auth_bp', 'book_bp', 'borrow_bp', 'user_bp']