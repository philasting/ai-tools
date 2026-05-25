# ToolBox - 在线工具箱

免费在线工具箱，包含开发工具、文本处理、图片工具、编码加密等42种实用工具，纯前端运行，数据不离开浏览器。

## 功能概览

### 开发工具 (Dev)
- JSON 格式化 | Base64 编解码 | URL 编解码 | 时间戳转换 | 正则表达式测试
- 文件哈希计算 | 进制转换 | 颜色转换 | JWT 解码 | Cron 表达式
- SQL 格式化 | HTML 实体编码 | 文本差异对比 | 二维码生成/解析

### 文本工具 (Text)
- 字数统计 | 文本去重 | 大小写转换
- 简繁转换 | 汉字转拼音 | 文本批量替换
- Markdown 预览 | 文本加密/解密

### 图片工具 (Image)
- 图片压缩 | 图片格式转换 | 图片调整尺寸 | 图片 Base64 互转
- ICO 图标生成 | 图片取色器 | 水印添加 | 九宫格切图

### 文档工具 (Doc)
- PDF 合并 | PDF 拆分 | 图片转 PDF

### 编码加密 (Crypto)
- 哈希计算 | RSA 密钥生成 | 摩斯密码 | Unicode 转换

### 生活效率 (Life)
- 密码生成器 | IP 查询 | UUID 生成器 | 单位换算 | 人民币大写

## 技术栈

- **框架**: Next.js 16 (App Router, Static Export)
- **UI**: React 19 + shadcn/ui + Tailwind CSS 4
- **状态管理**: Zustand
- **搜索**: FlexSearch (延迟加载)
- **主题**: next-themes (暗色/亮色模式)
- **PDF**: pdf-lib
- **二维码**: qrcode + jsQR
- **Markdown**: marked

## 本地开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 预览构建结果
pnpm start
```

## 部署

本项目使用 `output: 'export'` 配置，构建后生成纯静态文件，可部署到任何静态托管服务：

### Vercel
```bash
pnpm build
# 自动部署，无需额外配置
```

### GitHub Pages
```bash
pnpm build
# 将 out/ 目录部署到 GitHub Pages
```

### 自托管 (Nginx)
```bash
pnpm build
# 将 out/ 目录复制到服务器
# 配置 Nginx 指向 out/ 目录
```

## 项目结构

```
my-toolbox/
├── public/              # 静态资源
│   ├── manifest.json    # PWA 清单
│   ├── sw.js            # Service Worker
│   ├── sitemap.xml      # 站点地图
│   ├── robots.txt       # 搜索引擎配置
│   └── icons/           # PWA 图标
├── src/
│   ├── app/             # Next.js App Router
│   │   ├── layout.tsx   # 根布局
│   │   ├── page.tsx     # 首页
│   │   └── tools/[slug]/ # 工具详情页
│   ├── components/      # UI 组件
│   │   ├── layout/      # 布局组件 (Header/Sidebar/Footer)
│   │   ├── tool/        # 工具组件 (ToolCard/ToolGrid/ToolLayout/ToolSearch)
│   │   └── ui/          # shadcn/ui 基础组件
│   ├── tools/           # 工具实现
│   │   ├── registry.ts  # 工具注册表
│   │   ├── dev/         # 开发工具
│   │   ├── text/        # 文本工具
│   │   ├── image/       # 图片工具
│   │   ├── doc/         # 文档工具
│   │   ├── crypto/      # 编码加密工具
│   │   └── life/        # 生活效率工具
│   ├── hooks/           # 自定义 Hooks
│   ├── stores/          # Zustand 状态
│   ├── lib/             # 工具库
│   └── types/           # 类型定义
├── next.config.ts       # Next.js 配置
├── tailwind.config.ts   # Tailwind 配置
└── package.json
```

## 特性

- **纯前端**: 所有工具均在浏览器本地运行，数据不上传
- **PWA 支持**: 可安装为桌面/移动应用，支持离线访问
- **暗色模式**: 跟随系统或手动切换
- **全局搜索**: FlexSearch 模糊搜索，Alt+K 快捷键
- **键盘快捷键**: Alt+H 首页、Alt+F 收藏、Alt+K 搜索
- **静态导出**: 构建后为纯静态文件，可部署到任意 CDN
- **SEO 优化**: 动态 meta 标签、Open Graph、JSON-LD 结构化数据
