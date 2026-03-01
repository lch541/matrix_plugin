# OpenClaw External Matrix - 功能需求规格

## 概述

本文档定义 OpenClaw External Matrix 的扩展功能需求，包括：
1. Gardian 通知发送接口
2. 远程触发 OpenClaw Revive 命令

---

## 一、Gardian 通知接口

### 1.1 功能说明

允许 Gardian 通过 HTTP API 向 Matrix 房间发送状态通知（备份、回滚等）。

### 1.2 接口规格

**端点**: `POST /api/notify`

**请求头**:
```
Content-Type: application/json
```

**请求体**:
```json
{
  "message": "备份完成 (共 15 个快照)",
  "roomId": "!room:server"   // 可选，默认使用配置的房间
}
```

**响应**:
```json
{
  "success": true,
  "eventId": "$xxx"
}
```

**错误响应**:
```json
{
  "success": false,
  "error": "Invalid request"
}
```

### 1.3 实现位置

- 文件: `src/server.ts` 或新建 `src/routes/notify.ts`
- 依赖: 需要访问已初始化的 Matrix client 实例

---

## 二、远程 Revive 命令

### 2.1 功能说明

允许用户通过 Matrix 消息远程触发 OpenClaw Gardian 的回滚操作。

### 2.2 命令格式

```
openclaw revive <TOKEN>
```

### 2.3 消息流程

```
用户发送: "openclaw revive mysecret123"

    │
    ▼
server.ts 解析消息
    │
    ├─ 前缀匹配: "openclaw revive"
    ├─ 提取 token
    │
    ▼
验证 token
    │
    ├─ 成功 → 执行 revive.sh
    │         │
    │         ▼
    │    返回执行结果
    │
    └─ 失败 → 返回错误
```

### 2.4 Token 验证

- Token 存储: `config/revive_token` (纯文本文件)
- 设置命令: `openclaw token set <TOKEN>`
- 验证: 读取文件内容比对

### 2.5 响应消息

**成功**:
```
✅ 验证通过，正在触发回滚...
🔄 正在执行回滚...
✅ 回滚成功，已恢复到 snapshot_15
```

**失败**:
```
❌ Token 验证失败
```

**未设置 Token**:
```
⚠️ Revoke 功能未启用，请先设置 Token: openclaw token set <你的密码>
```

---

## 三、Token 管理命令

### 3.1 功能说明

管理 revive 命令的访问 token。

### 3.2 命令格式

| 命令 | 说明 |
|------|------|
| `openclaw token set <TOKEN>` | 设置 Token |
| `openclaw token show` | 显示 Token (掩码) |
| `openclaw token remove` | 删除 Token |

### 3.3 实现

- 存储位置: `config/revive_token`
- 读取/写入文件系统

---

## 四、代码结构规划

```
openclaw-external-matrix/
├── src/
│   ├── server.ts              # 主入口 (Express)
│   ├── config.ts              # 配置管理
│   ├── matrix/
│   │   ├── client.ts          # Matrix 客户端封装
│   │   └── types.ts           # 类型定义
│   ├── routes/
│   │   ├── matrix.ts          # Matrix API 代理 (原有)
│   │   ├── notify.ts          # 新增: Gardian 通知接口
│   │   └── commands.ts        # 新增: 命令处理
│   ├── commands/
│   │   ├── revive.ts          # 新增: Revive 命令
│   │   └── token.ts           # 新增: Token 管理
│   └── utils/
│       └── logger.ts          # 日志工具
├── config/
│   └── .gitkeep               # 配置目录 (不提交)
├── package.json
└── tsconfig.json
```

### 4.1 核心模块说明

| 模块 | 职责 |
|------|------|
| `server.ts` | 启动 Express，注册路由 |
| `config.ts` | 读取/保存配置文件 |
| `routes/notify.ts` | `/api/notify` 接口实现 |
| `routes/commands.ts` | 消息命令解析与路由 |
| `commands/revive.ts` | Revive 命令执行逻辑 |
| `commands/token.ts` | Token 管理逻辑 |

### 4.2 数据流

```
Matrix 消息
    │
    ▼
routes/commands.ts
    │ 解析: "openclaw revive xxx"
    │
    ├─► commands/revoke.ts
    │     ├─► 读取 config/revive_token
    │     ├─► 验证 token
    │     └─► 执行 revive.sh
    │
    └─► 发送响应消息
```

---

## 五、安全考虑

1. **Token 存储**: 使用文件存储，避免硬编码
2. **Token 验证**: 每次调用都验证文件内容
3. **执行权限**: 只执行 `revive` 命令，不执行任意 shell
4. **日志记录**: 所有操作记录到日志文件

---

## 六、测试用例

### 6.1 Notify 接口

- [ ] POST /api/notify 发送消息成功
- [ ] POST /api/notify 无 body 返回错误
- [ ] Matrix 客户端未初始化时返回错误

### 6.2 Revive 命令

- [ ] Token 正确时触发回滚
- [ ] Token 错误时返回错误
- [ ] 未设置 Token 时提示设置

### 6.3 Token 管理

- [ ] `openclaw token set` 保存成功
- [ ] `openclaw token show` 显示掩码
- [ ] `openclaw token remove` 删除成功

---

## 七、优先级

| 功能 | 优先级 | 说明 |
|------|--------|------|
| Notify 接口 | P0 | Gardian 通知必需 |
| Revive 命令 | P1 | 远程回滚功能 |
| Token 管理 | P1 | Revive 安全必需 |

---

*文档版本: 1.0*
*最后更新: 2026-03-01*