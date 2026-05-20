# 项目：GitHub Trending 宠物状态仪表盘

## 项目简介

爬取 GitHub Trending 当日数据，用 LLM 分析技术圈氛围，用一只线条猫的动态状态呈现结果。
用户不需要读25个项目名，看一眼猫就知道今天技术圈在发生什么。

---

## 技术栈

- **后端**：Python 3.11+ · FastAPI · SQLite（aiosqlite）· APScheduler（定时任务）
- **爬虫**：httpx + BeautifulSoup4（爬 GitHub Trending）
- **LLM**：DeepSeek API（openai SDK 兼容调用，model: `deepseek-v4-flash`）
- **前端**：React 18 · 手写 SVG 动画 · 原生 CSS Variables（参考 UI Skill 设计规范）
- **开发工具**：uv（Python 包管理）· Vite（前端构建）

---

## 目录结构

```
project-root/
├── CLAUDE.md
├── backend/
│   ├── main.py              # FastAPI 入口
│   ├── scraper.py           # GitHub Trending 爬虫
│   ├── analyzer.py          # LLM 分析逻辑
│   ├── scheduler.py         # 定时任务
│   ├── database.py          # SQLite 操作
│   ├── models.py            # Pydantic 数据模型
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── Cat.jsx      # SVG 猫动画组件
│   │   │   └── StatusPanel.jsx
│   │   └── hooks/
│   │       └── useTrendingData.js
│   ├── index.html
│   └── package.json
└── docs/
    ├── architecture.md      # 架构详细说明（按需用 @docs/architecture.md 引用）
    ├── prompt-design.md     # Prompt 设计记录
    └── cat-states.md        # 8种猫状态定义
```

---

## 常用命令

```bash
# 后端
cd backend
uv sync                      # 安装依赖
uv run uvicorn main:app --reload --port 8000

# 手动触发一次爬取+分析（测试用）
uv run python -c "from scraper import scrape; from analyzer import analyze; import asyncio; asyncio.run(analyze(asyncio.run(scrape())))"

# 前端
cd frontend
npm install
npm run dev                  # 启动开发服务器 :5173
npm run build
```

---

## 核心数据流

```
GitHub Trending 页面
  → scraper.py（httpx + BS4）
  → 原始项目列表（名称/stars/描述/语言）
  → analyzer.py（调 DeepSeek API）
  → 分类结果 + 情绪数值 + 猫状态 + 猫口吻叙述
  → SQLite 存储（每日一条记录）
  → FastAPI 接口（/api/today）
  → 前端 React 拉取 → Cat.jsx 渲染动画
```

---

## LLM 分析器设计

### DeepSeek API 调用方式

使用 `openai` SDK 兼容调用，**不要用 anthropic SDK**：

```python
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ.get("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com"
)

response = client.chat.completions.create(
    model="deepseek-v4-flash",
    messages=[
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_prompt},
    ],
    stream=False,
)

result = response.choices[0].message.content
```

- 环境变量：`DEEPSEEK_API_KEY`（放 `.env` 文件，不提交 git）
- flash 模型响应速度快，适合实时展示，不需要 thinking 模式

### 一次调用完成三件事，返回结构化 JSON

```json
{
  "categories": {
    "AI/ML": 12,
    "Security": 3,
    "DevTools": 5,
    "Systems": 3,
    "Other": 2
  },
  "dominant_vibe": "ai_explosion",
  "cat_state": "excited_bouncing",
  "narrative": "今天 AI 项目刷屏了，本猫已经原地起飞..."
}
```

**Prompt 原则**：
- System prompt 定义猫的性格（慵懒但毒舌的观察者）
- 明确要求只返回纯 JSON，不加任何 markdown 代码块或前缀文字
- 分类、状态判断、叙述在同一次调用里完成，不拆分
- 解析时做 `strip()` + 去除可能的 ` ```json ` 围栏再 `json.loads()`

---

## 猫的8种状态

| 状态 key | 触发条件 | 动画描述 |
|---|---|---|
| `excited_bouncing` | AI项目 > 40% | 上下弹跳 |
| `alert_ears_up` | Security项目 > 20% | 耳朵竖起，尾巴抖动 |
| `focused_working` | DevTools爆发 > 30% | 低头，爪子快速移动 |
| `sleepy_yawning` | 无明显主题，stars普遍低 | 打哈欠，眼睛半闭 |
| `curious_tilting` | 多领域均衡分布 | 头歪45度 |
| `overwhelmed_dizzy` | 总stars异常高，信息密度大 | 眼睛冒星星转圈 |
| `content_grooming` | 平静日，无爆款 | 舔爪子 |
| `shocked_puffed` | 单项目stars异常暴涨（>10k当日） | 全身炸毛 |

SVG 动画用 CSS `@keyframes` 驱动，状态通过给 `<Cat>` 传 `state` prop 切换。

---

## 前端设计规范（UI Skill）

前端遵循以下设计原则，做出有记忆点的可爱界面：

**美学方向**：「奶油糖果便利贴」风格——明亮、可爱、有手账感，让人想每天打开看：
- 米白/奶油色背景（`#FFFDF5`），不用纯白，有温度
- 强调色用饱和度高但不刺眼的马卡龙色系，**按猫咪状态动态切换**：
  - AI爆发 → 珊瑚橙 `#FF6B6B`
  - 安全警戒 → 薰衣草紫 `#A78BFA`
  - 工具爆发 → 薄荷绿 `#34D399`
  - 平静日 → 奶茶黄 `#FBBF24`
  - 默认 → 天空蓝 `#60A5FA`
- 卡片有圆角（`border-radius: 20px`）+ 柔和投影（`box-shadow: 0 4px 20px rgba(0,0,0,0.06)`）
- 偶尔用歪歪的手绘风边框（SVG stroke，不完全对齐，有手账感）

**字体**：
- 标题：`Nunito`（圆润，有童趣感）
- 正文：`Noto Sans SC`（中文友好）
- 数字/状态标签：`Fredoka One`（胖乎乎的圆体）
- 通过 Google Fonts CDN 引入

**CSS 变量系统**（`:root` 统一定义）：
```css
:root {
  --bg: #FFFDF5;
  --bg-card: #FFFFFF;
  --accent: #60A5FA;          /* JS 按状态动态切换这个值 */
  --accent-soft: #EFF6FF;     /* 强调色的浅版，用于卡片背景 */
  --text: #2D2D2D;
  --text-muted: #9CA3AF;
  --radius: 20px;
  --shadow: 0 4px 20px rgba(0,0,0,0.06);
  --font-title: 'Nunito', sans-serif;
  --font-body: 'Noto Sans SC', sans-serif;
  --font-num: 'Fredoka One', cursive;
}
```

**SVG 猫风格**：
- 圆润线条，笔触粗（`stroke-width: 3`），有填充（奶白色 body + 状态色耳朵/尾巴）
- 表情夸张可爱，眼睛是大圆眼，状态变化时眼睛形状也跟着变
- 猫身上可以有小装饰：蝴蝶结、星星、音符（随状态切换）

**动画原则**：
- 页面加载：卡片从下往上 staggered fade-in，间隔 80ms
- 猫状态切换：先做一个「跳起来」的预备动作，再切换到目标状态
- 叙述文字：打字机逐字出现，光标用猫爪 🐾 代替 `|`
- 背景色随状态柔和渐变（`transition: background-color 1.2s ease`）
- 鼠标悬停猫时猫会轻微摇摆（`rotate: ±3deg`，弹性曲线）

**布局**：
- 居中构图，但猫比数据面板大得多（猫占主视觉 60%）
- 数据以小卡片形式散落在猫周围，不是严肃的表格
- 移动端优先，单列垂直排列

---

## API 接口

```
GET /api/today          → 当日分析结果（有缓存则直接返回）
GET /api/history?days=7 → 近N天记录
POST /api/refresh       → 手动触发重新爬取（开发用）
GET /health             → 健康检查
```

---

## 代码风格

- Python：类型注解全覆盖，async/await 贯穿，Pydantic v2 做数据验证
- JavaScript：函数式组件 + hooks，不用 class 组件
- 命名：Python 用 `snake_case`，JS/JSX 用 `camelCase`，组件用 `PascalCase`
- 错误处理：爬虫失败不崩溃，返回上一次缓存数据；LLM 超时有 fallback 状态

---

## 开发阶段规划

- [x] Phase 0：项目结构初始化
- [ ] Phase 1：爬虫（scraper.py）跑通，能拿到原始数据
- [ ] Phase 2：LLM 分析器跑通，输出标准 JSON
- [ ] Phase 3：FastAPI 接口 + SQLite 存储
- [ ] Phase 4：前端基础页面 + Cat SVG 静态版
- [ ] Phase 5：Cat 动画8种状态接入数据联动
- [ ] Phase 6：定时任务 + 完整联调

**当前阶段：Phase 0**
每完成一个 Phase，更新上方的 checklist，并在 `docs/architecture.md` 补充该阶段的关键决策。

---

## Git 工作流

**规则：每完成一个 Phase，必须做一次 Git 提交，不能跨 Phase 攒。**

### 提交时机

每个 Phase 的功能跑通、手动验证无明显报错后，立即执行：

```bash
git add .
git commit -m "<type>(phase-N): <简短描述>"
```

### Commit Message 格式

使用 Conventional Commits 规范，type 从以下选：

| type | 用途 |
|---|---|
| `feat` | 新功能完成 |
| `fix` | 修了 bug |
| `refactor` | 重构，不改功能 |
| `chore` | 配置/依赖/构建相关 |
| `docs` | 只改了文档 |

**各 Phase 对应的标准提交信息**：

```
feat(phase-1): GitHub Trending 爬虫跑通，返回原始项目列表
feat(phase-2): DeepSeek 分析器跑通，输出标准分类 JSON
feat(phase-3): FastAPI 接口 + SQLite 存储联通
feat(phase-4): 前端基础页面 + Cat SVG 静态渲染
feat(phase-5): 猫的8种状态动画与数据联动
feat(phase-6): 定时任务接入，全链路联调完成
```

### .gitignore 必须包含

```
.env
*.db
data/
__pycache__/
.venv/
node_modules/
dist/
.DS_Store
```

### 分支策略（简单版）

- 直接在 `main` 分支开发，每个 Phase 提交一次
- Phase 完成后打 tag：`git tag phase-N-done`
- 不需要 PR，个人项目保持简单

### Claude Code 执行规范

完成每个 Phase 的最后一步，**必须主动执行 git 提交**，不等用户提醒。提交前检查：
1. `git status` 确认改动范围合理（没有意外文件）
2. `.env` 没有被 stage（`git diff --cached --name-only` 确认）
3. 提交后输出 commit hash 告知用户

---

## 注意事项

- GitHub Trending 无需登录，直接 GET `https://github.com/trending?since=daily`，注意 User-Agent 设置
- DeepSeek API Key 存 `.env` 文件（`DEEPSEEK_API_KEY=sk-xxx`），用 `python-dotenv` 加载，`.env` 加入 `.gitignore`
- LLM 调用有成本，开发阶段在 analyzer.py 里做 mock 模式（`MOCK_LLM=true` 环境变量跳过真实调用，返回固定 JSON）
- flash 模型响应快（通常 <1s），但 JSON 解析仍需做 strip + 去围栏处理，偶尔会有前缀文字
- SQLite 文件路径统一用环境变量 `DB_PATH`，默认 `./data/trending.db`
- 前端 dev 模式下 API 地址用 Vite proxy 转发，不要硬编码端口
- `openai` 包版本需 >= 1.0（用新版 SDK 接口），`uv add openai python-dotenv`
