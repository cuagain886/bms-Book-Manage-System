from datetime import datetime, timedelta
from app import db


class BorrowRecord(db.Model):
    """借阅记录模型"""
    __tablename__ = 'borrow_records'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    book_id = db.Column(db.Integer, db.ForeignKey('books.id'), nullable=False, index=True)
    borrow_date = db.Column(db.DateTime, default=datetime.utcnow)
    due_date = db.Column(db.DateTime, nullable=False)
    return_date = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(10), default='borrowed')  # borrowed 或 returned
    
    def __init__(self, **kwargs):
        super(BorrowRecord, self).__init__(**kwargs)
        # 如果没有设置应还日期，默认30天后
        if not self.due_date:
            self.due_date = datetime.utcnow() + timedelta(days=30)
    
    def is_overdue(self):
        """判断是否逾期"""
        if self.status == 'returned':
            return False
        return datetime.utcnow() > self.due_date
    
    def return_book(self):
        """归还图书"""
        self.return_date = datetime.utcnow()
        self.status = 'returned'
    
    def to_dict(self):
        """转换为字典"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'book_id': self.book_id,
            'user': self.user.to_dict() if self.user else None,
            'book': self.book.to_dict() if self.book else None,
            'borrow_date': self.borrow_date.isoformat() if self.borrow_date else None,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'return_date': self.return_date.isoformat() if self.return_date else None,
            'status': self.status,
            'is_overdue': self.is_overdue()
        }
    
    def __repr__(self):
        return f'<BorrowRecord {self.id}>'