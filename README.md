# 图书管理系统

基于 Flask 的图书管理系统，实现图书的增删改查、借阅管理等核心功能。

## 一、系统概述

### 1.1 核心角色（极简版仅需2类）

1. **管理员**：负责图书和借阅记录的管理
2. **普通用户/借阅人**：仅能查询图书、借阅/归还图书

### 1.2 技术栈

- **后端框架**：Flask (Python)
- **数据库**：SQLite（开发环境）/ MySQL（生产环境）
- **ORM**：SQLAlchemy
- **前端**：HTML + CSS + JavaScript（Bootstrap）
- **用户认证**：Flask-Login

## 二、功能模块设计

### 2.1 管理员核心功能（系统核心）

#### 2.1.1 图书管理

| 具体子功能 | 作用说明 |
|-----------|---------|
| 新增图书 | 录入图书基础信息（书名、作者、ISBN、数量），是系统的基础数据来源 |
| 删除/修改图书 | 修正错误信息（如ISBN输错）、移除下架图书 |
| 查询图书 | 按书名/作者/ISBN快速查找图书，确认库存 |

#### 2.1.2 借阅管理

| 具体子功能 | 作用说明 |
|-----------|---------|
| 办理借阅 | 记录"用户+图书+借阅时间+应还时间"，扣减图书库存 |
| 办理归还 | 记录归还时间，恢复图书库存；（极简版可暂不做逾期提醒） |
| 查看借阅记录 | 按用户/图书查询借阅情况，确认未还图书 |

#### 2.1.3 用户管理（可选极简版）

| 具体子功能 | 作用说明 |
|-----------|---------|
| 新增用户 | 录入借阅人基础信息（姓名、手机号/学号，唯一标识） |
| 查询用户 | 快速找到借阅人，核对身份 |

### 2.2 普通用户核心功能（仅查询+基础操作）

| 功能模块 | 具体子功能 | 作用说明 |
|---------|-----------|---------|
| 图书查询 | 按条件查图书 | 仅能看"书名、作者、是否可借"，无法修改数据 |
| 借阅记录查询 | 查自己的借阅/未还图书 | 确认自己的借阅情况，避免逾期 |

## 三、数据库设计

### 3.1 数据表结构

#### 3.1.1 用户表 (users)

| 字段名 | 类型 | 说明 |
|-------|------|------|
| id | INTEGER | 主键，自增 |
| username | VARCHAR(50) | 用户名，唯一 |
| password_hash | VARCHAR(128) | 密码哈希 |
| name | VARCHAR(50) | 真实姓名 |
| phone | VARCHAR(20) | 手机号/学号 |
| role | VARCHAR(10) | 角色：admin/user |
| created_at | DATETIME | 创建时间 |

#### 3.1.2 图书表 (books)

| 字段名 | 类型 | 说明 |
|-------|------|------|
| id | INTEGER | 主键，自增 |
| title | VARCHAR(100) | 书名 |
| author | VARCHAR(50) | 作者 |
| isbn | VARCHAR(20) | ISBN号，唯一 |
| quantity | INTEGER | 总数量 |
| available | INTEGER | 可借数量 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

#### 3.1.3 借阅记录表 (borrow_records)

| 字段名 | 类型 | 说明 |
|-------|------|------|
| id | INTEGER | 主键，自增 |
| user_id | INTEGER | 外键，关联用户表 |
| book_id | INTEGER | 外键，关联图书表 |
| borrow_date | DATETIME | 借阅时间 |
| due_date | DATETIME | 应还时间 |
| return_date | DATETIME | 实际归还时间（NULL表示未还） |
| status | VARCHAR(10) | 状态：borrowed/returned |

### 3.2 ER图

```
+----------+       +----------------+       +-------+
|  users   |       | borrow_records |       | books |
+----------+       +----------------+       +-------+
| id (PK)  |<----->| user_id (FK)   |       | id(PK)|
| username |       | book_id (FK)   |<----->| title |
| password |       | borrow_date    |       | author|
| name     |       | due_date       |       | isbn  |
| phone    |       | return_date    |       |quantity|
| role     |       | status         |       |available|
+----------+       +----------------+       +-------+
```

## 四、API接口设计

### 4.1 用户认证接口

| 方法 | 路径 | 说明 |
|-----|------|------|
| POST | /api/auth/login | 用户登录 |
| POST | /api/auth/logout | 用户登出 |
| POST | /api/auth/register | 用户注册 |

### 4.2 图书管理接口

| 方法 | 路径 | 说明 | 权限 |
|-----|------|------|------|
| GET | /api/books | 获取图书列表 | 所有用户 |
| GET | /api/books/{id} | 获取图书详情 | 所有用户 |
| POST | /api/books | 新增图书 | 管理员 |
| PUT | /api/books/{id} | 修改图书 | 管理员 |
| DELETE | /api/books/{id} | 删除图书 | 管理员 |
| GET | /api/books/search | 搜索图书 | 所有用户 |

### 4.3 借阅管理接口

| 方法 | 路径 | 说明 | 权限 |
|-----|------|------|------|
| GET | /api/borrows | 获取借阅记录 | 管理员/本人 |
| POST | /api/borrows | 办理借阅 | 管理员 |
| PUT | /api/borrows/{id}/return | 办理归还 | 管理员 |
| GET | /api/borrows/user/{user_id} | 查询用户借阅记录 | 管理员/本人 |

### 4.4 用户管理接口

| 方法 | 路径 | 说明 | 权限 |
|-----|------|------|------|
| GET | /api/users | 获取用户列表 | 管理员 |
| GET | /api/users/{id} | 获取用户详情 | 管理员/本人 |
| POST | /api/users | 新增用户 | 管理员 |
| PUT | /api/users/{id} | 修改用户 | 管理员 |
| DELETE | /api/users/{id} | 删除用户 | 管理员 |

## 五、项目结构

```
图书管理系统/
├── README.md                 # 项目说明文档
├── requirements.txt          # Python依赖
├── config.py                 # 配置文件
├── run.py                    # 启动文件
├── app/
│   ├── __init__.py          # Flask应用初始化
│   ├── models/              # 数据模型
│   │   ├── __init__.py
│   │   ├── user.py          # 用户模型
│   │   ├── book.py          # 图书模型
│   │   └── borrow.py        # 借阅记录模型
│   ├── routes/              # 路由/视图
│   │   ├── __init__.py
│   │   ├── auth.py          # 认证路由
│   │   ├── book.py          # 图书路由
│   │   ├── borrow.py        # 借阅路由
│   │   └── user.py          # 用户路由
│   ├── services/            # 业务逻辑层
│   │   ├── __init__.py
│   │   ├── book_service.py
│   │   ├── borrow_service.py
│   │   └── user_service.py
│   ├── static/              # 静态文件
│   │   ├── css/
│   │   └── js/
│   └── templates/           # HTML模板
│       ├── base.html        # 基础模板
│       ├── index.html       # 首页
│       ├── login.html       # 登录页
│       ├── books/           # 图书相关页面
│       ├── borrows/         # 借阅相关页面
│       └── users/           # 用户相关页面
└── tests/                   # 测试文件
    ├── __init__.py
    ├── test_book.py
    ├── test_borrow.py
    └── test_user.py
```

## 六、页面设计

### 6.1 页面列表

| 页面 | 路径 | 说明 | 访问权限 |
|-----|------|------|---------|
| 登录页 | /login | 用户登录 | 公开 |
| 注册页 | /register | 用户注册 | 公开 |
| 首页/仪表盘 | / | 系统概览 | 登录用户 |
| 图书列表 | /books | 查看所有图书 | 登录用户 |
| 图书详情 | /books/{id} | 查看图书详情 | 登录用户 |
| 新增图书 | /books/add | 添加新图书 | 管理员 |
| 编辑图书 | /books/{id}/edit | 编辑图书信息 | 管理员 |
| 借阅记录 | /borrows | 查看借阅记录 | 登录用户 |
| 办理借阅 | /borrows/add | 新增借阅 | 管理员 |
| 用户列表 | /users | 查看所有用户 | 管理员 |
| 用户详情 | /users/{id} | 查看用户详情 | 管理员/本人 |

### 6.2 页面原型

#### 登录页
- 用户名输入框
- 密码输入框
- 登录按钮
- 注册链接

#### 首页/仪表盘
- 图书总数统计
- 借阅中数量统计
- 用户数量统计（管理员可见）
- 最近借阅记录

#### 图书列表页
- 搜索框（按书名/作者/ISBN）
- 图书表格（书名、作者、ISBN、库存、操作）
- 新增按钮（管理员可见）
- 分页组件

## 七、安装与运行

### 7.1 环境要求

- Python 3.8+
- pip

### 7.2 安装步骤

```bash
# 1. 进入项目目录
cd 图书管理系统

# 2. 创建虚拟环境
python -m venv venv

# 3. 激活虚拟环境
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 4. 安装依赖
pip install -r requirements.txt

# 5. 运行项目（首次运行会自动创建数据库和管理员账户）
python run.py
```

### 7.3 API 文档访问

启动服务后，可通过以下链接访问 API 文档：

| 格式 | 链接 |
|-----|------|
| Swagger UI 界面 | http://localhost:5000/api/docs |
| OpenAPI YAML | http://localhost:5000/api/openapi.yaml |
| OpenAPI JSON | http://localhost:5000/api/openapi.json |

### 7.4 默认账户

| 角色 | 用户名 | 密码 |
|-----|-------|------|
| 管理员 | admin | admin123 |
| 普通用户 | user | user123 |

## 八、开发计划

### 第一阶段：基础框架搭建
- [x] 项目结构设计
- [ ] 数据库模型实现
- [ ] Flask应用初始化

### 第二阶段：核心功能实现
- [ ] 用户认证（登录/注册/登出）
- [ ] 图书管理（CRUD）
- [ ] 借阅管理（借阅/归还）

### 第三阶段：前端页面
- [ ] 登录/注册页面
- [ ] 图书管理页面
- [ ] 借阅管理页面
- [ ] 用户管理页面

### 第四阶段：测试与优化
- [ ] 单元测试
- [ ] 功能测试
- [ ] 性能优化

## 九、注意事项

1. **安全性**：密码使用哈希存储，敏感操作需要权限验证
2. **数据完整性**：借阅时检查库存，归还时更新库存
3. **用户体验**：提供友好的错误提示和操作反馈
4. **可扩展性**：采用分层架构，便于后续功能扩展

## 十、许可证

MIT License