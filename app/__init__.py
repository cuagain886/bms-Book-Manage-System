from flask import Flask, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_migrate import Migrate
from flask_swagger_ui import get_swaggerui_blueprint
from config import config
import os

db = SQLAlchemy()
login_manager = LoginManager()
migrate = Migrate()

# Swagger UI 配置
SWAGGER_URL = '/api/docs'  # Swagger UI 访问路径
API_URL = '/api/openapi.yaml'  # OpenAPI 文档路径


def create_app(config_name='default'):
    """应用工厂函数"""
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # 初始化扩展
    db.init_app(app)
    login_manager.init_app(app)
    migrate.init_app(app, db)
    
    # 配置登录管理
    login_manager.login_view = 'auth.login'
    login_manager.login_message = '请先登录'
    
    # 注册 Swagger UI 蓝图
    swaggerui_blueprint = get_swaggerui_blueprint(
        SWAGGER_URL,
        API_URL,
        config={
            'app_name': "图书管理系统 API"
        }
    )
    app.register_blueprint(swaggerui_blueprint, url_prefix=SWAGGER_URL)
    
    # 提供 OpenAPI 文档 (YAML)
    @app.route('/api/openapi.yaml')
    def serve_openapi_yaml():
        return send_from_directory(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            'openapi.yaml',
            mimetype='text/yaml'
        )
    
    # 提供 OpenAPI 文档 (JSON)
    @app.route('/api/openapi.json')
    def serve_openapi_json():
        return send_from_directory(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            'openapi.json',
            mimetype='application/json'
        )
    
    # 注册蓝图
    from app.routes.auth import auth_bp
    from app.routes.book import book_bp
    from app.routes.borrow import borrow_bp
    from app.routes.user import user_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(book_bp, url_prefix='/api/books')
    app.register_blueprint(borrow_bp, url_prefix='/api/borrows')
    app.register_blueprint(user_bp, url_prefix='/api/users')
    
    # 创建数据库表
    with app.app_context():
        db.create_all()
        # 初始化默认管理员账户
        from app.models.user import User
        if not User.query.filter_by(username='admin').first():
            admin = User(
                username='admin',
                name='管理员',
                phone='10000000000',
                role='admin'
            )
            admin.set_password('admin123')
            db.session.add(admin)
            db.session.commit()
    
    return app