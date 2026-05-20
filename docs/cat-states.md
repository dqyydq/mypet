# 猫的 8 种状态定义

| # | 状态 key | 触发条件 | 动画描述 | 情绪词 |
|---|---|---|---|---|
| 1 | `excited_bouncing` | AI项目 > 40% | 上下弹跳，眼睛放光 | 兴奋 |
| 2 | `alert_ears_up` | Security项目 > 20% | 耳朵竖起，尾巴抖动 | 警觉 |
| 3 | `focused_working` | DevTools爆发 > 30% | 低头，爪子快速移动 | 专注 |
| 4 | `sleepy_yawning` | 无明显主题，stars普遍低 | 打哈欠，眼睛半闭 | 无聊 |
| 5 | `curious_tilting` | 多领域均衡分布 | 头歪45度，眨眼 | 好奇 |
| 6 | `overwhelmed_dizzy` | 总stars异常高，信息密度大 | 眼睛冒星星转圈 | 晕 |
| 7 | `content_grooming` | 平静日，无爆款 | 舔爪子，放松 | 满足 |
| 8 | `shocked_puffed` | 单项目stars异常暴涨(>10k当日) | 全身炸毛，跳起 | 震惊 |

## 状态判断优先级

1. 先检查 `shocked_puffed`（单项目 >10k stars）
2. 再检查 `overwhelmed_dizzy`（总 stars 异常高）
3. 按比例判断：AI > 40% → Security > 20% → DevTools > 30% → 均衡 → 无主题
4. 兜底：`content_grooming`

## 视觉映射

- 每个状态对应不同的 CSS animation keyframes
- 状态切换时有过渡动画（preparation → target）
- 背景色随状态切换（CSS transition 1.2s）
