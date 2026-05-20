# 架构设计文档

## Phase 0 — 项目结构初始化 (2026-05-20)

### 技术选型

| 层面 | 选择 | 理由 |
|---|---|---|
| 后端框架 | FastAPI | 异步原生，类型安全，自动 OpenAPI |
| 数据库 | SQLite + aiosqlite | 单机项目无网络开销，异步不阻塞 |
| 爬虫 | httpx + BeautifulSoup4 | httpx 异步，BS4 容错性好 |
| LLM | DeepSeek V4 Flash (OpenAI SDK) | 响应快，成本低，兼容 SDK |
| 定时任务 | APScheduler | 轻量，无需额外进程 |
| 前端 | React 18 + Vite | 快，生态好，手写 SVG 灵活 |
| 包管理 | uv (Python) / npm (JS) | uv 快，npm 通用 |

### 目录结构决策

- `backend/` 和 `frontend/` 完全分离，各自有独立的依赖管理
- `docs/` 存放设计文档，随代码版本演进
- `data/` 存放 SQLite 数据库文件，gitignore 不提交
- 所有 Python 源文件放 backend 根目录（项目规模小，不需要层层分包）

### 数据库设计

单表 `trending_records`：
- `date` UNIQUE：每天一条记录
- `raw_data`：爬虫原始 JSON（用于调试/重放）
- `analysis_json`：LLM 返回的完整 JSON
- `cat_state` + `narrative`：冗余字段，方便查询
