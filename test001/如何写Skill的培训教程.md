# 如何为 OpenClaw 编写 Skill 教程

> 本教程将带你从零开始，创建一个完整的 OpenClaw Skill。

---

## 1. 什么是 Skill？

**Skill = 工具 + 说明书**

一个 Skill 让 OpenClaw 学会使用某个工具或服务。比如：
- `tmux` Skill → 让 OpenClaw 会用 tmux 终端复用器
- `coding-agent` Skill → 让 OpenClaw 会用 Codex、Claude Code 等编程代理
- `discord` Skill → 让 OpenClaw 能在 Discord 发送消息

**简单来说：** Skill 告诉 OpenClaw "这个工具怎么用"、"什么时候用它"、"有哪些注意事项"。

---

## 2. Skill 的目录结构

所有 Skill 都存放在 `/code/timdong/openclaw/skills/<skill-name>/` 目录下：

```
skills/
├── your-skill-name/          # Skill 文件夹（英文名，全小写，用连字符）
│   ├── SKILL.md              # 核心文件：Skill 的说明书（必须有）
│   ├── icon.svg              # 可选：图标文件
│   ├── manifest.json         # 可选：元数据配置
│   ├── scripts/              # 可选：存放辅助脚本
│   │   └── helper.sh         # 脚本文件名全小写
│   └── README.md             # 可选：额外的说明
```

**必须的文件：** `SKILL.md` 是唯一必需的，名字必须全大写。

---

## 3. SKILL.md 写作规范

每个 Skill 都以 **YAML front matter** 开头，定义基本元数据：

```yaml
---
name: your-skill-name         # 英文名，必须和文件夹名一致
description: 一句话描述这个 Skill 是干什么的
metadata:                     # OpenClaw 特定的配置
  openclaw:
    emoji: 🔧                 # 显示图标
    os: [darwin, linux]       # 支持的系统
    requires:                 # 依赖条件（可选）
      bins: [tmux]            # 必须安装在 PATH 的命令
      anyBins: [codex, claude, opencode, pi]  # 任一存在即可
---
```

### 3.1 YAML Front Matter 说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | string | Skill 名称，必须是文件夹名 |
| `description` | string | 一句话简述，控制在 60-120 字符 |
| `metadata.openclaw.emoji` | string | 状态图标，选一个贴切的 emoji |
| `metadata.openclaw.os` | array | 支持的系统：`["darwin", "linux"]` |
| `metadata.openclaw.requires.bins` | array | **必须**全部安装在 PATH 的依赖 |
| `metadata.openclaw.requires.anyBins` | array | **任一**存在即可的依赖 |

### 3.2 Markdown 正文结构

```markdown
# Skill 名称（首行 H1）

## 简介（一段话）

## 快速开始

```bash
# 核心用法示例
```

## 详细用法

### 场景 1
...

### 场景 2
...

## 注意事项

- 重要提醒 1
- 重要提醒 2
```

---

## 4. 写作技巧与最佳实践

### 4.1 让文档"可执行"

**好的示例：**

```bash
# ✅ 能直接复制粘贴运行的命令
bash pty:true workdir:~/project command:"codex exec 'Build a REST API'"
```

**避免的写法：**

```markdown
<!-- ❌ 这种写法没人知道怎么用 -->
运行 codex 命令，执行你的任务
```

### 4.2 使用表格清晰展示参数

```markdown
## 参数说明

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `command` | string | 是 | 要执行的命令 |
| `pty` | boolean | 否 | 是否使用伪终端 |
| `timeout` | number | 否 | 超时时间（秒） |
```

### 4.3 标注重要提醒

用 **⚠️** 标注关键注意事项：

```markdown
## ⚠️ 重要提醒

1. **必须使用 `pty:true`** — 不然进程会卡住
2. **只能在 git 仓库里运行** — Codex 不信任裸目录
```

### 4.4 分类展示多种场景

```markdown
## 用法场景

### 场景 1：一次性任务

### 场景 2：后台运行
```

### 4.5 提供完整的流程示例

从开始到结束，完整的步骤：

```markdown
## 完整流程示例

**目标：** 用 Codex 修复一个 bug

**步骤：**

1. 创建临时目录并初始化 git
```bash
SCRATCH=$(mktemp -d) && cd $SCRATCH && git init
```

2. 克隆项目
```bash
git clone https://github.com/user/repo.git $SCRATCH
```

3. 运行 Codex（记得用 pty）
```bash
bash pty:true workdir:$SCRATCH command:"codex exec 'Fix the login bug'"
```

4. 检查结果
...
```

---

## 5. 实战示例：创建一个简单的计时器 Skill

让我们创建一个 `timer` Skill 作为练习。

### 5.1 创建目录结构

```bash
mkdir -p /code/timdong/openclaw/skills/timer
```

### 5.2 编写 SKILL.md

```yaml
---
name: timer
description: 简单的倒计时定时器，支持秒表和提醒
metadata:
  openclaw:
    emoji: ⏱️
    os: [darwin, linux]
    requires:
      bins: [sleep]
---
```

### 5.3 编写完整文档

```markdown
# ⏱️ Timer Skill

在后台运行倒计时任务，时间到了会收到通知。

## 快速开始

```bash
# 创建一个 30 秒的倒计时
sleep 30 && echo "时间到！"
```

## 高级用法

### 后台运行（不影响对话）

```bash
# 在后台运行，不阻塞
sleep 300 && notify-send "5分钟到！" &
# 或 macOS
sleep 300 && osascript -e 'display notification "5分钟到！"'
```

### 自定义提醒声音

```bash
sleep 60 && afplay /System/Library/Sounds/Blow.aiff
```

### 番茄钟（25分钟工作 + 5分钟休息）

```bash
# 工作提醒
echo "开始25分钟工作" && sleep 1500 && osascript -e 'display notification "25分钟到，休息一下！"'

# 休息提醒
echo "开始5分钟休息" && sleep 300 && osascript -e 'display notification "5分钟到，继续工作！"'
```

## 技巧

- 用 `&` 把任务放后台，不阻塞当前对话
- 结合 `cron` 可以设置每天固定时间提醒
- macOS 用 `afplay` 播放系统音效，Linux 用 `paplay` 或 `notify-send`

## ⚠️ 注意

1. 后台任务不会自动显示输出，需要手动检查
2. 睡眠期间电脑不能休眠（可以用 `caffeinate` 防止）
3. 用 `ps aux | grep sleep` 查找运行中的定时器
```

---

## 6. 审核清单

写完 Skill 后，检查以下项目：

### 内容检查
- [ ] YAML front matter 完整（name、description、metadata）
- [ ] `name` 和文件夹名一致
- [ ] 有 emoji
- [ ] 示例命令可以直接运行
- [ ] 关键参数都有说明
- [ ] 注意事项用 ⚠️ 标注
- [ ] 重要的限制条件写清楚了

### 格式检查
- [ ] 使用中文标点符号（，。：；？）
- [ ] 标题层级合理（H1 → H2 → H3）
- [ ] 代码块有语言标识（bash、json、markdown）
- [ ] 表格格式整齐

### 实操检查
- [ ] 至少验证一个示例能正常运行
- [ ] 检查命令语法是否正确
- [ ] 确认依赖工具确实需要

---

## 7. 常见问题

### Q: Skill 名称有什么限制？

- 全小写
- 用连字符 `-` 分隔单词（如 `coding-agent`）
- 不要用下划线
- 参考现有 Skill 的命名风格

### Q: 什么时候用 `bins`，什么时候用 `anyBins`？

| 场景 | 用哪个 | 示例 |
|------|--------|------|
| 所有依赖**必须**安装 | `bins` | `tmux`（必须用 tmux） |
| 多个工具**任一**可用 | `anyBins` | `codex`、`claude`（任选一个） |

### Q: 需要提供图标文件吗？

可选。如果不提供，默认使用 front matter 里的 emoji。

### Q: 需要写 `manifest.json` 吗？

可选。多数 Skill 只需要 `SKILL.md` 即可正常工作。

---

## 8. 进阶：使用 process 工具

对于需要**长时间运行**或在**后台交互**的任务，可以使用 `process` 工具：

```markdown
## 后台运行与交互

### 启动后台任务
```bash
bash pty:true background:true command:"codex exec 'Build a todo app'"
# 返回 sessionId，如 "proc-123"
```

### 监控任务
```bash
process action:log sessionId:proc-123
```

### 发送输入
```bash
# 发送回车
process action:submit sessionId:proc-123 data:"y"

# 发送文本（不加回车）
process action:write sessionId:proc-123 data:"继续"
```

### 终止任务
```bash
process action:kill sessionId:proc-123
```

## Process 工具完整功能

| Action | 说明 |
|--------|------|
| `list` | 列出所有运行中的会话 |
| `poll` | 检查会话是否仍在运行 |
| `log` | 获取会话输出（支持 offset、limit） |
| `write` | 发送原始数据到 stdin |
| `submit` | 发送数据 + 回车 |
| `send-keys` | 发送按键或 hex 字节 |
| `paste` | 粘贴文本 |
| `kill` | 终止会话 |
```

---

## 9. 资源链接

- Skill 示例仓库：`/code/timdong/openclaw/skills/`
- OpenClaw 官方文档：`/code/timdong/openclaw/docs/`
- GitHub 仓库：https://github.com/openclaw/openclaw

---

## 10. 练习任务

尝试创建一个新 Skill：

1. **选一个工具**：你可以选 anything（curl、jq、ffmpeg 等）
2. **创建目录**：`/code/timdong/openclaw/skills/<你的技能名>/`
3. **编写 SKILL.md**：按照上面的模板
4. **测试示例**：确保至少一个命令能正常运行
5. **提交 PR** 或分享到 ClawHub

完成✅后在群里晒一下，你的 Skill 可能被收录到官方库！

---

*Happy Coding!* 🚀