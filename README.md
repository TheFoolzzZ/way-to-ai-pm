# Way to AI PM

一个基于 Next.js 的 AI 产品经理学习平台，采用赛博朋克风格设计。

## 技术栈

- **框架**: Next.js 16 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS 4
- **数据库**: Supabase
- **UI 组件**: Lucide React, Framer Motion
- **Markdown**: React Markdown + remark-gfm

## 本地开发

### 环境要求

- Node.js 20+
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 环境变量配置

创建 `.env.local` 文件并添加以下环境变量：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

### 构建生产版本

```bash
npm run build
npm start
```

## 部署到 Vercel

### 方式一：通过 Vercel CLI

1. 安装 Vercel CLI：
```bash
npm i -g vercel
```

2. 登录并部署：
```bash
vercel
```

### 方式二：通过 Vercel Dashboard

1. 访问 [Vercel](https://vercel.com)
2. 导入 GitHub 仓库：`https://github.com/TheFoolzzZ/way-to-ai-pm`
3. 配置环境变量：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. 点击 Deploy

### 环境变量设置

在 Vercel 项目设置中添加以下环境变量：

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名密钥 | `eyJhbGc...` |

### 部署配置

项目已包含 `vercel.json` 配置文件，包含：
- 🌏 香港区域部署 (更快的访问速度)
- 🔒 安全响应头配置
- ⚙️ 自动环境变量引用

## 项目结构

```
way-to-ai-pm-codex/
├── app/                    # Next.js App Router 页面
├── components/             # React 组件
│   ├── CategorySection.tsx
│   ├── HeroSection.tsx
│   ├── Navbar.tsx
│   ├── QuestionCard.tsx
│   └── QuestionModal.tsx
├── data/                   # 数据和 Mock
├── lib/                    # 工具函数
├── public/                 # 静态资源
├── supabase/              # Supabase 配置
├── .env.local             # 本地环境变量 (不提交)
├── vercel.json            # Vercel 部署配置
└── package.json
```

## 功能特性

- ✨ 赛博朋克风格 UI 设计
- 🎴 翻转卡片式题目展示
- 📱 响应式布局
- 🔄 Markdown 内容渲染
- 🎯 分类浏览系统
- 🌐 Supabase 数据集成

## 开发说明

### 添加新题目

题目数据存储在 Supabase 中，通过 `data/mock-data.ts` 定义数据结构。

### 样式自定义

全局样式定义在 `app/globals.css`，包含：
- CSS 变量定义
- 赛博朋克主题色
- 玻璃态效果
- 翻转动画

## License

MIT
