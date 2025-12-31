from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app import db
from app.models.book import Book

book_bp = Blueprint('book', __name__)


def admin_required(f):
    """管理员权限装饰器"""
    from functools import wraps
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or not current_user.is_admin():
            return jsonify({'success': False, 'message': '需要管理员权限'}), 403
        return f(*args, **kwargs)
    return decorated_function


@book_bp.route('', methods=['GET'])
@login_required
def get_books():
    """获取图书列表"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    pagination = Book.query.order_by(Book.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    books = [book.to_dict() for book in pagination.items]
    
    return jsonify({
        'success': True,
        'books': books,
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    })


@book_bp.route('/<int:book_id>', methods=['GET'])
@login_required
def get_book(book_id):
    """获取图书详情"""
    book = Book.query.get_or_404(book_id)
    return jsonify({
        'success': True,
        'book': book.to_dict()
    })


@book_bp.route('', methods=['POST'])
@login_required
@admin_required
def create_book():
    """新增图书"""
    data = request.get_json()
    
    if not data:
        return jsonify({'success': False, 'message': '请提供图书信息'}), 400
    
    title = data.get('title')
    author = data.get('author')
    isbn = data.get('isbn')
    quantity = data.get('quantity', 1)
    
    if not title or not author or not isbn:
        return jsonify({'success': False, 'message': '书名、作者和ISBN不能为空'}), 400
    
    if Book.query.filter_by(isbn=isbn).first():
        return jsonify({'success': False, 'message': 'ISBN已存在'}), 400
    
    book = Book(
        title=title,
        author=author,
        isbn=isbn,
        quantity=quantity,
        available=quantity
    )
    
    db.session.add(book)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': '图书添加成功',
        'book': book.to_dict()
    }), 201


@book_bp.route('/<int:book_id>', methods=['PUT'])
@login_required
@admin_required
def update_book(book_id):
    """修改图书"""
    book = Book.query.get_or_404(book_id)
    data = request.get_json()
    
    if not data:
        return jsonify({'success': False, 'message': '请提供图书信息'}), 400
    
    # 更新字段
    if 'title' in data:
        book.title = data['title']
    if 'author' in data:
        book.author = data['author']
    if 'isbn' in data:
        # 检查ISBN是否重复
        existing = Book.query.filter_by(isbn=data['isbn']).first()
        if existing and existing.id != book_id:
            return jsonify({'success': False, 'message': 'ISBN已存在'}), 400
        book.isbn = data['isbn']
    if 'quantity' in data:
        new_quantity = data['quantity']
        # 计算已借出数量
        borrowed = book.quantity - book.available
        if new_quantity < borrowed:
            return jsonify({'success': False, 'message': f'库存不能少于已借出数量({borrowed})'}), 400
        book.available = new_quantity - borrowed
        book.quantity = new_quantity
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': '图书更新成功',
        'book': book.to_dict()
    })


@book_bp.route('/<int:book_id>', methods=['DELETE'])
@login_required
@admin_required
def delete_book(book_id):
    """删除图书"""
    book = Book.query.get_or_404(book_id)
    
    # 检查是否有未归还的借阅记录
    borrowed_count = book.quantity - book.available
    if borrowed_count > 0:
        return jsonify({'success': False, 'message': f'该图书有{borrowed_count}本未归还，无法删除'}), 400
    
    db.session.delete(book)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': '图书删除成功'
    })


@book_bp.route('/search', methods=['GET'])
@login_required
def search_books():
    """搜索图书"""
    keyword = request.args.get('keyword', '')
    search_type = request.args.get('type', 'all')  # all, title, author, isbn
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    query = Book.query
    
    if keyword:
        if search_type == 'title':
            query = query.filter(Book.title.contains(keyword))
        elif search_type == 'author':
            query = query.filter(Book.author.contains(keyword))
        elif search_type == 'isbn':
            query = query.filter(Book.isbn.contains(keyword))
        else:
            # 搜索所有字段
            query = query.filter(
                db.or_(
                    Book.title.contains(keyword),
                    Book.author.contains(keyword),
                    Book.isbn.contains(keyword)
                )
            )
    
    pagination = query.order_by(Book.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    books = [book.to_dict() for book in pagination.items]
    
    return jsonify({
        'success': True,
        'books': books,
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    })