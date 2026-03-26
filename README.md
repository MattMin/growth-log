# Growth Log - 宝宝成长记录

一款用于记录和追踪宝宝成长数据的 Web 应用，支持身高、体重、头围的记录与可视化，并可在 WHO / CDC 生长曲线上查看宝宝的发育百分位。

## 功能特性

- **宝宝管理** — 添加多个宝宝，记录姓名、出生日期、性别，支持早产儿矫正月龄，支持自定义头像
- **成长数据记录** — 记录体重 (kg)、身高 (cm)、头围 (cm)，支持编辑和删除
- **生长曲线图** — 基于 Chart.js，叠加 WHO / CDC 百分位参考线 (P1–P99)，图表右侧直接标注 P3/P50/P97 数值，X 轴自动适配数据范围
- **生长标准** — WHO 标准 (0-18 岁体重/身高, 0-5 岁头围) 和 CDC 标准 (0-18 岁体重/身高, 0-3 岁头围)
- **CSV 导入** — 批量导入历史数据，格式：`Date, Weight (kg), Height (cm), Head Circumference (cm)`
- **深色 / 浅色模式** — 跟随系统偏好或手动切换
- **iCloud 同步** — 通过 CloudKit JS 集成 Apple 账号登录与数据同步，无 CloudKit 时自动使用 localStorage
- **Vercel 部署** — 开箱即用，支持一键部署到 Vercel

## 技术栈

- **框架**: Next.js 16 (App Router, TypeScript)
- **样式**: Tailwind CSS v4
- **图表**: Chart.js + react-chartjs-2
- **数据解析**: PapaParse
- **云同步**: CloudKit JS (Apple iCloud)
- **部署**: Vercel

## 快速开始

### 安装依赖

```bash
npm install
```

### 本地开发

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

### 构建

```bash
npm run build
```

## CloudKit 配置（可选）

如需启用 iCloud 同步，复制环境变量模板并填入你的 CloudKit 配置：

```bash
cp .env.local.example .env.local
```

需要在 [Apple Developer Portal](https://developer.apple.com/icloud/dashboard/) 中创建 CloudKit Container 并获取以下配置：

- `NEXT_PUBLIC_CLOUDKIT_CONTAINER_ID`
- `NEXT_PUBLIC_CLOUDKIT_API_TOKEN`
- `NEXT_PUBLIC_CLOUDKIT_ENVIRONMENT`

未配置 CloudKit 时，应用会自动使用浏览器 localStorage 存储数据。

## 项目结构

```
src/
├── app/                    # Next.js App Router 页面
│   ├── dashboard/
│   │   ├── baby/[id]/      # 宝宝详情（曲线图/数据列表）
│   │   └── page.tsx        # 宝宝管理列表
│   ├── layout.tsx          # 根布局
│   └── page.tsx            # 登录/首页
├── components/             # UI 组件
│   ├── BabyCard.tsx        # 宝宝信息卡片
│   ├── BabyForm.tsx        # 添加/编辑宝宝表单
│   ├── CsvImport.tsx       # CSV 数据导入
│   ├── GrowthChart.tsx     # 生长曲线图
│   ├── GrowthRecordForm.tsx # 记录成长数据表单
│   ├── GrowthRecordList.tsx # 成长数据列表
│   ├── Header.tsx          # 页头导航
│   └── ThemeToggle.tsx     # 主题切换按钮
├── contexts/               # React Context
│   ├── DataContext.tsx     # 数据层（CloudKit / localStorage）
│   └── ThemeContext.tsx    # 主题管理
└── lib/                    # 工具库
    ├── cloudkit.ts         # CloudKit JS 封装
    ├── growth-standards.ts # WHO & CDC 生长标准数据
    ├── local-storage.ts    # localStorage 存储
    └── types.ts            # TypeScript 类型定义
```

## 部署到 Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/MattMin/growth-log)

或通过 CLI：

```bash
npx vercel
```

## License

MIT
