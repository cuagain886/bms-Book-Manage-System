from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app import db
from app.models.book import Book
from app.models.borrow import BorrowRecord
from app.models.user import User

borrow_bp = Blueprint('borrow', __name__)


def admin_required(f):
    """管理员权限装饰器"""
    from functools import wraps
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or not current_user.is_admin():
            return jsonify({'success': False, 'message': '需要管理员权限'}), 403
        return f(*args, **kwargs)
    return decorated_function


@borrow_bp.route('', methods=['GET'])
@login_required
def get_borrows():
    """获取借阅记录列表"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    status = request.args.get('status', '')  # borrowed, returned, all
    
    query = BorrowRecord.query
    
    # 非管理员只能查看自己的借阅记录
    if not current_user.is_admin():
        query = query.filter_by(user_id=current_user.id)
    
    # 按状态筛选
    if status == 'borrowed':
        query = query.filter_by(status='borrowed')
    elif status == 'returned':
        query = query.filter_by(status='returned')
    
    pagination = query.order_by(BorrowRecord.borrow_date.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    records = [record.to_dict() for record in pagination.items]
    
    return jsonify({
        'success': True,
        'records': records,
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    })


@borrow_bp.route('/<int:record_id>', methods=['GET'])
@login_required
def get_borrow(record_id):
    """获取借阅记录详情"""
    record = BorrowRecord.query.get_or_404(record_id)
    
    # 非管理员只能查看自己的借阅记录
    if not current_user.is_admin() and record.user_id != current_user.id:
        return jsonify({'success': False, 'message': '无权查看此记录'}), 403
    
    return jsonify({
        'success': True,
        'record': record.to_dict()
    })


@borrow_bp.route('', methods=['POST'])
@login_required
@admin_required
def create_borrow():
    """办理借阅"""
    data = request.get_json()
    
    if not data:
        return jsonify({'success': False, 'message': '请提供借阅信息'}), 400
    
    user_id = data.get('user_id')
    book_id = data.get('book_id')
    days = data.get('days', 30)  # 借阅天数，默认30天
    
    if not user_id or not book_id:
        return jsonify({'success': False, 'message': '用户ID和图书ID不能为空'}), 400
    
    # 检查用户是否存在
    user = User.query.get(user_id)
    if not user:
        return jsonify({'success': False, 'message': '用户不存在'}), 404
    
    # 检查图书是否存在
    book = Book.query.get(book_id)
    if not book:
        return jsonify({'success': False, 'message': '图书不存在'}), 404
    
    # 检查图书是否可借
    if not book.is_available():
        return jsonify({'success': False, 'message': '该图书暂无库存'}), 400
    
    # 检查用户是否已借阅该书且未归还
    existing = BorrowRecord.query.filter_by(
        user_id=user_id,
        book_id=book_id,
        status='borrowed'
    ).first()
    if existing:
        return jsonify({'success': False, 'message': '该用户已借阅此书且未归还'}), 400
    
    # 创建借阅记录
    record = BorrowRecord(
        user_id=user_id,
        book_id=book_id,
        borrow_date=datetime.utcnow(),
        due_date=datetime.utcnow() + timedelta(days=days),
        status='borrowed'
    )
    
    # 扣减库存
    book.borrow_one()
    
    db.session.add(record)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': '借阅成功',
        'record': record.to_dict()
    }), 201


@borrow_bp.route('/<int:record_id>/return', methods=['PUT'])
@login_required
@admin_required
def return_book(record_id):
    """办理归还"""
    record = BorrowRecord.query.get_or_404(record_id)
    
    if record.status == 'returned':
        return jsonify({'success': False, 'message': '该图书已归还'}), 400
    
    # 归还图书
    record.return_book()
    
    # 恢复库存
    book = Book.query.get(record.book_id)
    if book:
        book.return_one()
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': '归还成功',
        'record': record.to_dict()
    })


@borrow_bp.route('/user/<int:user_id>', methods=['GET'])
@login_required
def get_user_borrows(user_id):
    """查询用户借阅记录"""
    # 非管理员只能查看自己的借阅记录
    if not current_user.is_admin() and user_id != current_user.id:
        return jsonify({'success': False, 'message': '无权查看此用户的借阅记录'}), 403
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    status = request.args.get('status', '')
    
    query = BorrowRecord.query.filter_by(user_id=user_id)
    
    if status == 'borrowed':
        query = query.filter_by(status='borrowed')
    elif status == 'returned':
        query = query.filter_by(status='returned')
    
    pagination = query.order_by(BorrowRecord.borrow_date.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    records = [record.to_dict() for record in pagination.items]
    
    return jsonify({
        'success': True,
        'records': records,
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    })


@borrow_bp.route('/book/<int:book_id>', methods=['GET'])
@login_required
@admin_required
def get_book_borrows(book_id):
    """查询图书借阅记录"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    status = request.args.get('status', '')
    
    query = BorrowRecord.query.filter_by(book_id=book_id)
    
    if status == 'borrowed':
        query = query.filter_by(status='borrowed')
    elif status == 'returned':
        query = query.filter_by(status='returned')
    
    pagination = query.order_by(BorrowRecord.borrow_date.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    records = [record.to_dict() for record in pagination.items]
    
    return jsonify({
        'success': True,
        'records': records,
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    })


@borrow_bp.route('/overdue', methods=['GET'])
@login_required
@admin_required
def get_overdue_borrows():
    """获取逾期借阅记录"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    query = BorrowRecord.query.filter(
        BorrowRecord.status == 'borrowed',
        BorrowRecord.due_date < datetime.utcnow()
    )
    
    pagination = query.order_by(BorrowRecord.due_date.asc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    records = [record.to_dict() for record in pagination.items]
    
    return jsonify({
        'success': True,
        'records': records,
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    })