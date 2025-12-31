# 图书管理系统 - 前端

基于 Next.js 16 和 shadcn/ui 构建的图书管理系统前端应用。

## 技术栈

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

### 认证模块
- 用户登录 (`/login`)
- 用户注册 (`/register`)
- 自动登录状态检测
- 基于 Context 的全局认证状态管理

### 仪表板 (`/dashboard`)
- 系统概览统计（图书总数、借阅中数量、用户数量）
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

### 用户管理 (`/dashboard/users`)
> 仅管理员可访问

- 用户列表展示（分页）
- 用户搜索
- 新增用户
- 编辑用户
- 删除用户

### 逾期记录 (`/dashboard/overdue`)
> 仅管理员可访问

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
│   │   │   └── page.tsx
│   │   ├── borrows/        # 借阅管理
│   │   │   └── page.tsx
│   │   ├── users/          # 用户管理
│   │   │   └── page.tsx
│   │   ├── overdue/        # 逾期记录
│   │   │   └── page.tsx
│   │   ├── profile/        # 个人中心
│   │   │   └── page.tsx
│   │   ├── layout.tsx      # 仪表板布局
│   │   └── page.tsx        # 仪表板首页
│   ├── login/              # 登录页
│   │   └── page.tsx
│   ├── register/           # 注册页
│   │   └── page.tsx
│   ├── globals.css         # 全局样式
│   ├── layout.tsx          # 根布局
│   └── page.tsx            # 首页（重定向到仪表板）
├── components/              # React 组件
│   ├── ui/                 # shadcn/ui 组件
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   ├── table.tsx
│   │   └── ...
│   ├── dashboard-header.tsx # 顶部导航栏
│   └── dashboard-sidebar.tsx # 侧边栏导航
├── lib/                     # 工具库
│   ├── api.ts              # API 客户端封装
│   ├── auth-context.tsx    # 认证上下文 Provider
│   ├── types.ts            # TypeScript 类型定义
│   └── utils.ts            # 工具函数
├── hooks/                   # 自定义 Hooks
│   └── use-mobile.ts       # 移动端检测
├── public/                  # 静态资源
├── next.config.ts          # Next.js 配置
├── tailwind.config.ts      # Tailwind 配置
├── tsconfig.json           # TypeScript 配置
└── package.json            # 项目依赖
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

### 代码检查

```bash
npm run lint
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

| 功能 | 普通用户 | 管理员 |
|-----|---------|-------|
| 浏览图书 | ✅ | ✅ |
| 图书管理 | ❌ | ✅ |
| 查看自己的借阅记录 | ✅ | ✅ |
| 借阅管理 | ❌ | ✅ |
| 用户管理 | ❌ | ✅ |
| 逾期处理 | ❌ | ✅ |
| 修改个人信息 | ✅ | ✅ |

## 组件说明

### UI 组件 (shadcn/ui)

项目使用 shadcn/ui 组件库，所有 UI 组件位于 `components/ui/` 目录下，包括：

- `button` - 按钮组件
- `card` - 卡片组件
- `dialog` - 对话框组件
- `form` - 表单组件
- `input` - 输入框组件
- `table` - 表格组件
- `select` - 选择器组件
- `pagination` - 分页组件
- `alert-dialog` - 确认对话框
- `dropdown-menu` - 下拉菜单
- `tabs` - 标签页组件
- `badge` - 徽章组件
- `skeleton` - 骨架屏组件
- `sonner` - Toast 通知组件

### 业务组件

- `dashboard-header.tsx` - 仪表板顶部导航栏，包含用户信息和登出功能
- `dashboard-sidebar.tsx` - 侧边栏导航，根据用户角色显示不同菜单项

## 类型定义

主要类型定义位于 `lib/types.ts`：

```typescript
// 用户类型
interface User {
  id: number;
  username: string;
  name: string;
  phone: string;
  role: 'admin' | 'user';
  created_at: string;
}

// 图书类型
interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  quantity: number;
  available: number;
  created_at: string;
  updated_at: string;
}

// 借阅记录类型
interface BorrowRecord {
  id: number;
  user_id: number;
  book_id: number;
  borrow_date: string;
  due_date: string;
  return_date: string | null;
  status: 'borrowed' | 'returned';
  user?: User;
  book?: Book;
}
```

## 许可证

MIT License
