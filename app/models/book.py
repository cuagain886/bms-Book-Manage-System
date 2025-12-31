from datetime import datetime
from app import db


class Book(db.Model):
    """图书模型"""
    __tablename__ = 'books'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False, index=True)
    author = db.Column(db.String(50), nullable=False, index=True)
    isbn = db.Column(db.String(20), unique=True, nullable=False, index=True)
    quantity = db.Column(db.Integer, default=1)  # 总数量
    available = db.Column(db.Integer, default=1)  # 可借数量
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关联借阅记录
    borrow_records = db.relationship('BorrowRecord', backref='book', lazy='dynamic')
    
    def is_available(self):
        """判断是否可借"""
        return self.available > 0
    
    def borrow_one(self):
        """借出一本"""
        if self.available > 0:
            self.available -= 1
            return True
        return False
    
    def return_one(self):
        """归还一本"""
        if self.available < self.quantity:
            self.available += 1
            return True
        return False
    
    def to_dict(self):
        """转换为字典"""
        return {
            'id': self.id,
            'title': self.title,
            'author': self.author,
            'isbn': self.isbn,
            'quantity': self.quantity,
            'available': self.available,
            'is_available': self.is_available(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<Book {self.title}>'