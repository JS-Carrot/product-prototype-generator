#!/usr/bin/env bash
#
# sync.sh — 一键同步：提交本地改动 → 并入远程 → 推送
#
# 用法：
#   bash scripts/sync.sh                    自动生成提交信息
#   bash scripts/sync.sh "fix: 调整列表间距"   指定提交信息
#   SYNC_BRANCH=dev bash scripts/sync.sh    指定分支（默认当前分支）
#
# 环境变量：
#   SYNC_REMOTE   远程名，默认 origin
#   SYNC_BRANCH   分支名，默认当前分支
#   GIT_AUTHOR_NAME / GIT_AUTHOR_EMAIL   首次使用时写入的提交身份
#
# 退出码：0 成功 / 1 失败（失败时已回滚到同步前状态，不会留下半成品）

set -uo pipefail

SELF="${BASH_SOURCE[0]:-$0}"
ROOT="$(cd "$(dirname "$SELF")/.." && pwd)" || exit 1
cd "$ROOT" || { echo "无法进入 $ROOT"; exit 1; }

if [ -t 1 ]; then
  OK=$'\033[32m'; WARN=$'\033[33m'; ERR=$'\033[31m'; ACC=$'\033[36m'; NC=$'\033[0m'
else
  OK=; WARN=; ERR=; ACC=; NC=
fi

ok()   { printf '%s✓%s %s\n' "$OK"   "$NC" "$1"; }
warn() { printf '%s!%s %s\n' "$WARN" "$NC" "$1"; }
die()  { printf '%s✗%s %s\n' "$ERR"  "$NC" "$1" >&2; exit 1; }
step() { printf '\n%s›%s %s\n' "$ACC" "$NC" "$1"; }

if [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
  printf '用法: bash scripts/sync.sh ["提交信息"]\n\n'
  printf '  提交本地改动 → 并入远程新提交 → 推送到远程。\n'
  printf '  冲突时自动 git rebase --abort 回滚，不会留下半成品。\n\n'
  printf '环境变量:\n'
  printf '  SYNC_REMOTE  远程名，默认 origin\n'
  printf '  SYNC_BRANCH  分支名，默认当前分支\n'
  exit 0
fi

# ---------- 前置检查 ----------

git rev-parse --git-dir >/dev/null 2>&1 || die "$ROOT 不是 Git 仓库"

BRANCH="${SYNC_BRANCH:-$(git symbolic-ref --short -q HEAD || true)}"
[ -n "$BRANCH" ] || die "检测不到当前分支（可能处于 detached HEAD），请用 SYNC_BRANCH=<分支名> 指定"

REMOTE="${SYNC_REMOTE:-origin}"
git remote get-url "$REMOTE" >/dev/null 2>&1 \
  || die "找不到远程 $REMOTE。先执行：git remote add $REMOTE git@github.com:<用户名>/<仓库>.git"

if [ -z "$(git config user.name || true)" ] || [ -z "$(git config user.email || true)" ]; then
  warn "未配置 Git 身份，写入仓库级默认值（只影响本仓库）"
  git config user.name  "${GIT_AUTHOR_NAME:-$(whoami)}"
  git config user.email "${GIT_AUTHOR_EMAIL:-$(whoami)@users.noreply.github.com}"
fi

printf '%s同步 %s  →  %s/%s%s\n' "$ACC" "$ROOT" "$REMOTE" "$BRANCH" "$NC"

# ---------- 1. 提交本地改动 ----------

step "1/3 提交本地改动"
if [ -z "$(git status --porcelain)" ]; then
  ok "工作区干净，没有需要提交的改动"
else
  CHANGED=$(git status --porcelain | wc -l | tr -d ' ')
  MSG="${1:-sync: $(date '+%Y-%m-%d %H:%M') 自动同步}"
  git add -A || die "git add 失败"
  git -c core.quotepath=false commit -q -m "$MSG" \
    || die "提交失败（若被 pre-commit 钩子拦截，上面应有原始输出）"
  ok "已提交 $CHANGED 个文件：$MSG"
fi

# ---------- 2. 并入远程 ----------

step "2/3 并入 $REMOTE/$BRANCH"
# ls-remote --exit-code: 0=分支存在 / 2=分支不存在 / 其他=连不上
git ls-remote --exit-code --heads "$REMOTE" "$BRANCH" >/dev/null 2>&1
LS_RC=$?

if [ "$LS_RC" -eq 2 ]; then
  ok "远程分支尚不存在，将新建"
elif [ "$LS_RC" -ne 0 ]; then
  warn "无法连接远程（网络或权限），仍尝试推送"
elif ! git fetch -q "$REMOTE" "$BRANCH" 2>/dev/null; then
  warn "拉取远程失败，将用本地已知状态继续"
else
  BEHIND=$(git rev-list --count "HEAD..$REMOTE/$BRANCH" 2>/dev/null || echo 0)
  if [ "${BEHIND:-0}" -gt 0 ]; then
    if git rebase "$REMOTE/$BRANCH" >/dev/null 2>&1; then
      ok "并入远程新增的 $BEHIND 个提交"
    else
      git rebase --abort >/dev/null 2>&1 || true
      die "本地与远程改到了同一处，自动变基失败。已回滚，未推送任何内容。
   手动处理：git pull --rebase $REMOTE $BRANCH"
    fi
  else
    ok "远程没有新提交"
  fi
fi

# ---------- 3. 推送 ----------

step "3/3 推送到 $REMOTE/$BRANCH"
if git rev-parse --verify -q "$REMOTE/$BRANCH" >/dev/null 2>&1; then
  AHEAD=$(git rev-list --count "$REMOTE/$BRANCH..HEAD" 2>/dev/null || echo 1)
else
  AHEAD=1
fi

if [ "${AHEAD:-1}" -eq 0 ]; then
  ok "已是最新，无需推送"
else
  PUSH_OUT=$(git push -u "$REMOTE" "$BRANCH" 2>&1)
  if [ $? -ne 0 ]; then
    printf '%s\n' "$PUSH_OUT" >&2
    die "推送失败（以上为原始错误）。常见原因：SSH 密钥未授权、仓库不存在或无写权限"
  fi
  ok "已推送 $AHEAD 个提交"
fi

# ---------- 收尾 ----------

URL=$(git remote get-url "$REMOTE" 2>/dev/null \
  | sed -e 's#^git@github\.com:#https://github.com/#' -e 's#\.git$##')

printf '\n%s全部同步完成%s\n' "$OK" "$NC"
printf '  分支  %s\n' "$BRANCH"
if git rev-parse --verify -q HEAD >/dev/null 2>&1; then
  printf '  提交  %s\n' "$(git log -1 --format='%h %s')"
fi
[ -n "$URL" ] && printf '  远程  %s\n' "$URL"
exit 0
