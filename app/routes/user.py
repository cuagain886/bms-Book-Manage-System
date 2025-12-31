from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app import db
from app.models.user import User

user_bp = Blueprint('user', __name__)


def admin_required(f):
    """管理员权限装饰器"""
    from functools import wraps
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or not current_user.is_admin():
            return jsonify({'success': False, 'message': '需要管理员权限'}), 403
        return f(*args, **kwargs)
    return decorated_function


@user_bp.route('', methods=['GET'])
@login_required
@admin_required
def get_users():
    """获取用户列表"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    pagination = User.query.order_by(User.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    users = [user.to_dict() for user in pagination.items]
    
    return jsonify({
        'success': True,
        'users': users,
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    })


@user_bp.route('/<int:user_id>', methods=['GET'])
@login_required
def get_user(user_id):
    """获取用户详情"""
    # 非管理员只能查看自己的信息
    if not current_user.is_admin() and user_id != current_user.id:
        return jsonify({'success': False, 'message': '无权查看此用户信息'}), 403
    
    user = User.query.get_or_404(user_id)
    return jsonify({
        'success': True,
        'user': user.to_dict()
    })


@user_bp.route('', methods=['POST'])
@login_required
@admin_required
def create_user():
    """新增用户"""
    data = request.get_json()
    
    if not data:
        return jsonify({'success': False, 'message': '请提供用户信息'}), 400
    
    username = data.get('username')
    password = data.get('password')
    name = data.get('name')
    phone = data.get('phone')
    role = data.get('role', 'user')
    
    if not username or not password or not name:
        return jsonify({'success': False, 'message': '用户名、密码和姓名不能为空'}), 400
    
    if User.query.filter_by(username=username).first():
        return jsonify({'success': False, 'message': '用户名已存在'}), 400
    
    if role not in ['admin', 'user']:
        return jsonify({'success': False, 'message': '角色只能是admin或user'}), 400
    
    user = User(
        username=username,
        name=name,
        phone=phone,
        role=role
    )
    user.set_password(password)
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': '用户创建成功',
        'user': user.to_dict()
    }), 201


@user_bp.route('/<int:user_id>', methods=['PUT'])
@login_required
def update_user(user_id):
    """修改用户"""
    # 非管理员只能修改自己的信息
    if not current_user.is_admin() and user_id != current_user.id:
        return jsonify({'success': False, 'message': '无权修改此用户信息'}), 403
    
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    
    if not data:
        return jsonify({'success': False, 'message': '请提供用户信息'}), 400
    
    # 更新字段
    if 'name' in data:
        user.name = data['name']
    if 'phone' in data:
        user.phone = data['phone']
    
    # 只有管理员可以修改用户名和角色
    if current_user.is_admin():
        if 'username' in data:
            # 检查用户名是否重复
            existing = User.query.filter_by(username=data['username']).first()
            if existing and existing.id != user_id:
                return jsonify({'success': False, 'message': '用户名已存在'}), 400
            user.username = data['username']
        if 'role' in data:
            if data['role'] not in ['admin', 'user']:
                return jsonify({'success': False, 'message': '角色只能是admin或user'}), 400
            user.role = data['role']
        if 'password' in data and data['password']:
            user.set_password(data['password'])
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': '用户更新成功',
        'user': user.to_dict()
    })


@user_bp.route('/<int:user_id>', methods=['DELETE'])
@login_required
@admin_required
def delete_user(user_id):
    """删除用户"""
    user = User.query.get_or_404(user_id)
    
    # 不能删除自己
    if user_id == current_user.id:
        return jsonify({'success': False, 'message': '不能删除自己'}), 400
    
    # 检查是否有未归还的借阅记录
    borrowed_count = user.borrow_records.filter_by(status='borrowed').count()
    if borrowed_count > 0:
        return jsonify({'success': False, 'message': f'该用户有{borrowed_count}本书未归还，无法删除'}), 400
    
    db.session.delete(user)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': '用户删除成功'
    })


@user_bp.route('/search', methods=['GET'])
@login_required
@admin_required
def search_users():
    """搜索用户"""
    keyword = request.args.get('keyword', '')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    query = User.query
    
    if keyword:
        query = query.filter(
            db.or_(
                User.username.contains(keyword),
                User.name.contains(keyword),
                User.phone.contains(keyword)
            )
        )
    
    pagination = query.order_by(User.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    users = [user.to_dict() for user in pagination.items]
    
    return jsonify({
        'success': True,
        'users': users,
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    })