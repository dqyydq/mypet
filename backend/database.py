"""SQLite 数据访问层，使用 aiosqlite 异步操作。"""

import os

import aiosqlite

DB_PATH = os.environ.get("DB_PATH", "./data/trending.db")

_connection: aiosqlite.Connection | None = None


async def get_db() -> aiosqlite.Connection:
    """获取共享的数据库连接（惰性创建）。"""
    global _connection
    if _connection is None:
        import os
        os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
        _connection = await aiosqlite.connect(DB_PATH)
        _connection.row_factory = aiosqlite.Row
    return _connection


async def close_db():
    """关闭数据库连接。"""
    global _connection
    if _connection:
        await _connection.close()
        _connection = None
