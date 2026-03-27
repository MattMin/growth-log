# Growth Log - 宝宝成长记录

一款用于记录和追踪宝宝成长数据的 Web 应用，支持身高、体重、头围的记录与可视化，并可在 WHO / CDC 生长曲线上查看宝宝的发育百分位。

## 功能特性

- **宝宝管理** — 添加多个宝宝，记录姓名、出生日期、性别，支持早产儿矫正月龄，支持自定义头像
- **成长数据记录** — 记录体重 (kg)、身高 (cm)、头围 (cm)，支持编辑和删除
- **生长曲线图** — 基于 Chart.js，叠加 WHO / CDC 百分位参考线 (P1–P99)，图表右侧直接标注 P3/P50/P97 数值，X 轴自动适配数据范围
- **生长标准** — WHO 标准 (0-18 岁体重/身高, 0-5 岁头围) 和 CDC 标准 (0-18 岁体重/身高, 0-3 岁头围)
- **CSV 导入/导出** — 批量导入历史数据或导出备份，格式：`Date, Weight (kg), Height (cm), Head Circumference (cm)`
- **通过 ID 导入** — 分享宝宝 UUID 即可在其他设备导入数据，支持同步模式（共享数据）和独立副本模式
- **深色 / 浅色模式** — 跟随系统偏好或手动切换
- **Supabase 云同步** — 通过 Supabase 存储数据，支持跨平台数据同步；未配置时自动使用 localStorage
- **Vercel 部署** — 开箱即用，支持一键部署到 Vercel

## 技术栈

- **框架**: Next.js 16 (App Router, TypeScript)
- **样式**: Tailwind CSS v4
- **图表**: Chart.js + react-chartjs-2
- **数据解析**: PapaParse
- **云存储**: Supabase
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

## Supabase 配置（可选）

如需启用云存储与跨设备同步，在 [Supabase](https://supabase.com/) 创建项目后，配置环境变量：

```bash
cp .env.local.example .env.local
```

填入以下变量：

- `NEXT_PUBLIC_SUPABASE_URL` — 项目 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — 匿名密钥 (anon key)

### 数据库表结构

在 Supabase SQL Editor 中执行以下 SQL 创建所需表：

```sql
-- 宝宝信息表
create table babies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  birth_date date not null,
  gender text not null check (gender in ('male', 'female')),
  premature_birth_date date,
  avatar text,
  created_at timestamptz default now()
);

-- 成长记录表
create table growth_records (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references babies(id) on delete cascade,
  date date not null,
  weight numeric,
  height numeric,
  head_circumference numeric,
  created_at timestamptz default now()
);

-- 为按宝宝查询记录创建索引
create index idx_growth_records_baby_id on growth_records(baby_id);

-- 开启 Row Level Security (RLS) —— 使用 anon key 时需要允许访问
alter table babies enable row level security;
alter table growth_records enable row level security;

-- 允许匿名读写（如需更严格的权限控制请自行调整）
create policy "Allow all access to babies" on babies for all using (true) with check (true);
create policy "Allow all access to growth_records" on growth_records for all using (true) with check (true);
```

未配置 Supabase 时，应用会自动使用浏览器 localStorage 存储数据。

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
│   ├── BabyCard.tsx        # 宝宝信息卡片（左滑编辑/删除）
│   ├── BabyForm.tsx        # 添加/编辑宝宝表单
│   ├── CsvImport.tsx       # CSV 数据导入
│   ├── GrowthChart.tsx     # 生长曲线图
│   ├── GrowthRecordForm.tsx # 记录成长数据表单
│   ├── GrowthRecordList.tsx # 成长数据列表
│   ├── Header.tsx          # 页头导航
│   ├── ImportById.tsx      # 通过ID导入宝宝
│   └── ThemeToggle.tsx     # 主题切换按钮
├── contexts/               # React Context
│   ├── DataContext.tsx     # 数据层（Supabase / localStorage）
│   └── ThemeContext.tsx    # 主题管理
└── lib/                    # 工具库
    ├── cloudkit.ts         # CloudKit JS 封装（已废弃）
    ├── growth-standards.ts # WHO & CDC 生长标准数据
    ├── local-storage.ts    # localStorage 存储
    ├── supabase.ts         # Supabase 客户端
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
