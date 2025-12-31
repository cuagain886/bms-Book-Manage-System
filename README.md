# 图书管理系统

基于 Flask + Next.js 的全栈图书管理系统，实现图书的增删改查、借阅管理等核心功能。

## 项目概述

本项目采用前后端分离架构：
- **后端**：Flask RESTful API 服务
- **前端**：Next.js 16 现代化 Web 应用

### 核心角色

1. **管理员**：负责图书和借阅记录的管理、用户管理
2. **普通用户**：查询图书、借阅/归还图书、查看个人借阅记录

## 技术栈

### 后端技术栈

| 技术 | 版本 | 说明 |
|-----|------|------|
| Python | 3.8+ | 编程语言 |
| Flask | 3.0.0 | Web 框架 |
| SQLAlchemy | 3.1.1 | ORM 框架 |
| Flask-Login | 0.6.3 | 用户认证 |
| Flask-Migrate | 4.0.5 | 数据库迁移 |
| SQLite/MySQL | - | 数据库 |
| Swagger UI | 4.11.1 | API 文档 |

### 前端技术栈

| 技术 | 版本 | 说明 |
|-----|------|------|
| Next.js | 16.1.1 | React 框架 (App Router) |
| React | 19.2.3 | UI 库 |
| TypeScript | 5.x | 类型安全 |
| Tailwind CSS | 4.x | 样式框架 |
| shadcn/ui | - | UI 组件库 |
| Lucide React | 0.562.0 | 图标库 |
| React Hook Form | 7.69.0 | 表单处理 |
| Zod | 4.2.1 | 数据验证 |

## 功能模块

### 用户认证
- 用户登录/注册/登出
- 基于 Session 的身份验证
- 角色权限控制（管理员/普通用户）

### 图书管理
- 图书列表展示（分页、搜索）
- 图书 CRUD 操作（管理员）
- 按书名/作者/ISBN 搜索
- 库存管理

### 借阅管理
- 借阅记录列表（分页、筛选）
- 办理借阅/归还（管理员）
- 借阅状态跟踪
- 逾期记录管理

### 用户管理（管理员）
- 用户列表展示
- 用户 CRUD 操作
- 用户角色管理

### 个人中心
- 个人信息查看/修改
- 密码修改
- 我的借阅记录

## 项目结构

```
图书管理系统/
├── README.md                 # 项目说明文档
├── requirements.txt          # Python 依赖
├── config.py                 # 后端配置文件
├── run.py                    # 后端启动文件
├── openapi.yaml              # OpenAPI 文档 (YAML)
├── openapi.json              # OpenAPI 文档 (JSON)
├── app/                      # Flask 后端应用
│   ├── __init__.py          # 应用初始化
│   ├── models/              # 数据模型
│   │   ├── user.py          # 用户模型
│   │   ├── book.py          # 图书模型
│   │   └── borrow.py        # 借阅记录模型
│   └── routes/              # API 路由
│       ├── auth.py          # 认证接口
│       ├── book.py          # 图书接口
│       ├── borrow.py        # 借阅接口
│       └── user.py          # 用户接口
└── bms/                      # Next.js 前端应用
    ├── app/                 # 页面路由
    │   ├── login/           # 登录页
    │   ├── register/        # 注册页
    │   └── dashboard/       # 仪表板
    │       ├── books/       # 图书管理
    │       ├── borrows/     # 借阅管理
    │       ├── users/       # 用户管理
    │       ├── overdue/     # 逾期记录
    │       └── profile/     # 个人中心
    ├── components/          # React 组件
    │   ├── ui/              # shadcn/ui 组件
    │   ├── dashboard-header.tsx
    │   └── dashboard-sidebar.tsx
    └── lib/                 # 工具库
        ├── api.ts           # API 客户端
        ├── auth-context.tsx # 认证上下文
        └── types.ts         # 类型定义
```

## 数据库设计

### 用户表 (users)

| 字段名 | 类型 | 说明 |
|-------|------|------|
| id | INTEGER | 主键，自增 |
| username | VARCHAR(50) | 用户名，唯一 |
| password_hash | VARCHAR(128) | 密码哈希 |
| name | VARCHAR(50) | 真实姓名 |
| phone | VARCHAR(20) | 手机号/学号 |
| role | VARCHAR(10) | 角色：admin/user |
| created_at | DATETIME | 创建时间 |

### 图书表 (books)

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

### 借阅记录表 (borrow_records)

| 字段名 | 类型 | 说明 |
|-------|------|------|
| id | INTEGER | 主键，自增 |
| user_id | INTEGER | 外键，关联用户表 |
| book_id | INTEGER | 外键，关联图书表 |
| borrow_date | DATETIME | 借阅时间 |
| due_date | DATETIME | 应还时间 |
| return_date | DATETIME | 实际归还时间 |
| status | VARCHAR(10) | 状态：borrowed/returned |

## API 接口

### 认证接口

| 方法 | 路径 | 说明 |
|-----|------|------|
| POST | /api/auth/login | 用户登录 |
| POST | /api/auth/logout | 用户登出 |
| POST | /api/auth/register | 用户注册 |
| GET | /api/auth/me | 获取当前用户信息 |

### 图书接口

| 方法 | 路径 | 说明 | 权限 |
|-----|------|------|------|
| GET | /api/books | 获取图书列表 | 所有用户 |
| GET | /api/books/{id} | 获取图书详情 | 所有用户 |
| POST | /api/books | 新增图书 | 管理员 |
| PUT | /api/books/{id} | 修改图书 | 管理员 |
| DELETE | /api/books/{id} | 删除图书 | 管理员 |

### 借阅接口

| 方法 | 路径 | 说明 | 权限 |
|-----|------|------|------|
| GET | /api/borrows | 获取借阅记录 | 管理员/本人 |
| POST | /api/borrows | 办理借阅 | 管理员 |
| PUT | /api/borrows/{id}/return | 办理归还 | 管理员 |
| GET | /api/borrows/overdue | 获取逾期记录 | 管理员 |

### 用户接口

| 方法 | 路径 | 说明 | 权限 |
|-----|------|------|------|
| GET | /api/users | 获取用户列表 | 管理员 |
| GET | /api/users/{id} | 获取用户详情 | 管理员/本人 |
| POST | /api/users | 新增用户 | 管理员 |
| PUT | /api/users/{id} | 修改用户 | 管理员 |
| DELETE | /api/users/{id} | 删除用户 | 管理员 |

## 快速开始

### 环境要求

- Python 3.8+
- Node.js 18+
- npm 或 yarn

### 后端启动

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

# 5. 启动后端服务
python run.py
```

后端服务将在 http://localhost:5000 启动。

### 前端启动

```bash
# 1. 进入前端目录
cd bms

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev
```

前端应用将在 http://localhost:3000 启动。

### API 文档

启动后端服务后，可通过以下链接访问 API 文档：

| 格式 | 链接 |
|-----|------|
| Swagger UI | http://localhost:5000/api/docs |
| OpenAPI YAML | http://localhost:5000/api/openapi.yaml |
| OpenAPI JSON | http://localhost:5000/api/openapi.json |

## 默认账户

| 角色 | 用户名 | 密码 |
|-----|-------|------|
| 管理员 | admin | admin123 |

## 开发说明

### 前端 API 代理

前端通过 Next.js 的 rewrites 功能将 `/api/*` 请求代理到后端服务器。如需修改后端地址，请编辑 `bms/next.config.ts`：

```typescript
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: 'http://localhost:5000/api/:path*',
    },
  ];
},
```

### 构建生产版本

```bash
# 前端构建
cd bms
npm run build
npm start

# 后端生产部署建议使用 gunicorn
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 "app:create_app()"
```

## 注意事项

1. **安全性**：密码使用哈希存储，敏感操作需要权限验证
2. **数据完整性**：借阅时检查库存，归还时更新库存
3. **用户体验**：提供友好的错误提示和操作反馈
4. **可扩展性**：采用前后端分离架构，便于独立扩展

## 许可证

MIT License