# 图书管理系统前端

基于 Next.js 16 和 shadcn/ui 构建的图书管理系统前端应用。

## 技术栈

- **框架**: Next.js 16 (App Router)
- **UI 组件**: shadcn/ui
- **样式**: Tailwind CSS 4
- **图标**: Lucide React
- **语言**: TypeScript

## 功能模块

### 认证模块
- 用户登录 (`/login`)
- 用户注册 (`/register`)
- 自动登录状态检测

### 仪表板 (`/dashboard`)
- 系统概览统计
- 最近借阅记录
- 快捷操作入口

### 图书管理 (`/dashboard/books`)
- 图书列表展示（分页）
- 图书搜索（按书名、作者、ISBN）
- 新增图书（管理员）
- 编辑图书（管理员）
- 删除图书（管理员）

### 借阅管理 (`/dashboard/borrows`)
- 借阅记录列表（分页）
- 按状态筛选（借阅中/已归还）
- 办理借阅（管理员）
- 办理归还（管理员）

### 用户管理 (`/dashboard/users`)（仅管理员）
- 用户列表展示（分页）
- 用户搜索
- 新增用户
- 编辑用户
- 删除用户

### 逾期记录 (`/dashboard/overdue`)（仅管理员）
- 逾期借阅列表
- 逾期天数显示
- 快速归还操作

### 个人中心 (`/dashboard/profile`)
- 个人信息展示
- 修改个人信息
- 修改密码
- 我的借阅记录

## 项目结构

```
bms/
├── app/                      # Next.js App Router 页面
│   ├── dashboard/           # 仪表板相关页面
│   │   ├── books/          # 图书管理
│   │   ├── borrows/        # 借阅管理
│   │   ├── users/          # 用户管理
│   │   ├── overdue/        # 逾期记录
│   │   ├── profile/        # 个人中心
│   │   ├── layout.tsx      # 仪表板布局
│   │   └── page.tsx        # 仪表板首页
│   ├── login/              # 登录页
│   ├── register/           # 注册页
│   ├── globals.css         # 全局样式
│   ├── layout.tsx          # 根布局
│   └── page.tsx            # 首页（重定向）
├── components/              # 组件
│   ├── ui/                 # shadcn/ui 组件
│   ├── dashboard-header.tsx # 顶部导航栏
│   └── dashboard-sidebar.tsx # 侧边栏
├── lib/                     # 工具库
│   ├── api.ts              # API 客户端
│   ├── auth-context.tsx    # 认证上下文
│   ├── types.ts            # TypeScript 类型定义
│   └── utils.ts            # 工具函数
├── hooks/                   # 自定义 Hooks
└── public/                  # 静态资源
```

## 开发指南

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

前端将在 http://localhost:3000 启动。

### 构建生产版本

```bash
npm run build
```

### 启动生产服务器

```bash
npm start
```

## API 代理配置

前端通过 Next.js 的 rewrites 功能将 `/api/*` 请求代理到后端服务器 `http://localhost:5000`。

如需修改后端地址，请编辑 `next.config.ts` 文件：

```typescript
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: 'http://localhost:5000/api/:path*', // 修改此处
    },
  ];
},
```

## 使用说明

1. 确保后端服务已启动（默认 http://localhost:5000）
2. 启动前端开发服务器
3. 访问 http://localhost:3000
4. 使用管理员账号登录（默认: admin/admin123）

## 权限说明

- **普通用户**: 可以浏览图书、查看自己的借阅记录、修改个人信息
- **管理员**: 拥有所有权限，包括图书管理、借阅管理、用户管理、逾期处理等
