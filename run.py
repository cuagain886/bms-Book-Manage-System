import os
from app import create_app

# 获取配置环境，默认为开发环境
config_name = os.environ.get('FLASK_CONFIG') or 'development'
app = create_app(config_name)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)