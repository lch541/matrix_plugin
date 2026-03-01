# OpenClaw External Matrix - 功能需求规格

## 概述

本文档定义 OpenClaw External Matrix 的扩展功能需求，包括：
1. Gardian 通知发送接口
2. 远程触发 OpenClaw Revive 命令
3. Token 管理命令

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
  "roomId": "!room:server"
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
    ├─ 成功 → 执行 ~/.openclaw/gardian/openclaw-revive.sh
    │
    └─ 失败 → 返回错误
```

### 2.4 响应消息

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
⚠️ Revive 功能未启用，请先设置 Token: openclaw revive token set <你的密码>
```

---

## 三、Token 管理命令

### 3.1 功能说明

管理 revive 命令的访问 token。

### 3.2 命令格式 (已修正)

| 命令 | 说明 |
|------|------|
| `openclaw revive token set <TOKEN>` | 设置 Token |
| `openclaw revive token show` | 显示 Token (掩码) |
| `openclaw revive token remove` | 删除 Token |

### 3.3 命令解析规则

```
"openclaw revive token set <password>"
    │       │    │     │
    │       │    │     └─► parts[4] = token 值
    │       │    └─► parts[3] = action (set/show/remove)
    │       └─► parts[2] = "token"
    └─► parts[1] = "revive"
```

### 3.4 响应消息

**设置成功**:
```
✅ Token 设置成功！
```

**查看 Token**:
```
🔑 当前 Token: my****23
```

**删除 Token**:
```
✅ Token 已删除。
```

**未设置 Token 时查看**:
```
⚠️ 未设置 Token。
```

---

## 四、代码结构

```
src/
├── server.ts              # 主入口
├── config.ts              # 配置 + Token 存储
├── matrix/
│   └── client.ts          # Matrix 客户端
├── routes/
│   ├── matrix.ts          # Matrix API 代理
│   ├── notify.ts          # /api/notify 接口
│   └── commands.ts        # 命令解析路由
├── commands/
│   ├── revive.ts          # openclaw revive 命令
│   └── token.ts           # openclaw revive token 命令
└── utils/
    └── logger.ts
```

---

## 五、安全考虑

1. **Token 存储**: 使用文件存储 (`config/revive_token`)，避免硬编码
2. **Token 验证**: 每次调用都验证文件内容
3. **执行权限**: 只执行 `openclaw-revive.sh`，不执行任意 shell
4. **日志记录**: 所有操作记录到日志

---

## 六、测试用例

### 6.1 Notify 接口
- [ ] POST /api/notify 发送消息成功
- [ ] POST /api/notify 无 message 返回错误
- [ ] Matrix 客户端未初始化时返回错误

### 6.2 Revive 命令
- [ ] `openclaw revive <正确token>` 触发回滚
- [ ] `openclaw revive <错误token>` 返回错误
- [ ] `openclaw revive` 不带 token 提示错误

### 6.3 Token 管理
- [ ] `openclaw revive token set <token>` 保存成功
- [ ] `openclaw revive token show` 显示掩码 (如 `my****23`)
- [ ] `openclaw revive token remove` 删除成功

---

## 七、优先级

| 功能 | 优先级 |
|------|--------|
| Notify 接口 | P0 |
| Revive 命令 | P1 |
| Token 管理 | P1 |

---

*文档版本: 1.1*
*更新: 2026-03-01 - 修正命令格式为 openclaw revive token set/show/remove*