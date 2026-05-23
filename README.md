# GitHub Trending 宠物状态仪表盘

爬取 GitHub Trending 当日数据，用 LLM 分析技术圈氛围，用一只线条猫的动态状态呈现结果。**看一眼猫就知道今天技术圈在发生什么。**

## 效果预览

一只 SVG 线条猫会根据当日 GitHub Trending 的分析结果切换 8 种状态：

| 状态 | 触发条件 | 动画 |
|---|---|---|
| 兴奋弹跳 | AI 项目 > 40% | 上下弹跳 |
| 耳朵竖起 | Security 项目 > 20% | 耳朵竖起，尾巴抖动 |
| 专注工作 | DevTools 爆发 > 30% | 低头，爪子快速移动 |
| 打哈欠 | 无明显主题，stars 低 | 打哈欠，眼睛半闭 |
| 好奇歪头 | 多领域均衡 | 头歪 45° |
| 头晕目眩 | 总 stars 异常高 | 眼睛冒星星转圈 |
| 惬意舔毛 | 平静无爆款 | 舔爪子 |
| 震惊炸毛 | 单项目 stars > 10k | 全身炸毛 |

## 技术栈

- **后端**：Python 3.11+ · FastAPI · SQLite · APScheduler
- **爬虫**：httpx + BeautifulSoup4
- **LLM**：DeepSeek API（deepseek-v4-flash）
- **前端**：React 18 · SVG 动画 · CSS Variables

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/dqyydq/mypet.git
cd mypet
```

### 2. 后端

```bash
cd backend
uv sync
cp .env.example .env   # 编辑 .env 填入 DEEPSEEK_API_KEY
uv run uvicorn main:app --reload --port 8000
```

### 3. 前端

```bash
cd frontend
npm install
npm run dev             # 启动开发服务器 :5173
```

### 4. 打开浏览器

访问 `http://localhost:5173`，猫会根据当日 GitHub Trending 数据自动切换状态。

## 环境变量

| 变量 | 说明 | 默认值 |
|---|---|---|
| `DEEPSEEK_API_KEY` | DeepSeek API 密钥 | 必填 |
| `DB_PATH` | SQLite 文件路径 | `./data/trending.db` |
| `MOCK_LLM` | 跳过 LLM 调用，返回 mock 数据 | `false` |

## 项目结构

```
├── backend/
│   ├── main.py          # FastAPI 入口
│   ├── scraper.py       # GitHub Trending 爬虫
│   ├── analyzer.py      # LLM 分析逻辑
│   ├── scheduler.py     # 定时任务
│   ├── database.py      # SQLite 操作
│   └── models.py        # 数据模型
├── frontend/
│   └── src/
│       ├── App.jsx
│       └── components/
│           ├── Cat.jsx         # SVG 猫动画
│           ├── StatusPanel.jsx # 状态面板
│           ├── TrendPanel.jsx  # 趋势面板
│           └── ShareCard.jsx   # 分享卡片
└── docs/
    ├── architecture.md
    ├── prompt-design.md
    └── cat-states.md
```

## API 接口

```
GET  /api/today           # 当日分析结果
GET  /api/history?days=7  # 近 N 天记录
GET  /api/stats?days=30   # 聚合统计
POST /api/refresh         # 手动触发重新爬取
GET  /health              # 健康检查
```

## License

MIT
