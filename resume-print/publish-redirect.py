#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
把「旧地址跳转页」发布到 competition-bootcamp 仓库根目录。

背景：
  删掉该仓库的 index.html 后，由于仓库根没有 .nojekyll，GitHub Pages 会启用
  Jekyll 并把 README.md 渲染成首页 —— 于是 /competition-bootcamp/ 会显示
  README（含手机号、邮箱）。本脚本上传一个新的 index.html 作为跳转页，
  让这个旧地址自动前往新的个人主页，同时不再暴露 README 内容。

用法：
  python publish-redirect.py --token <GitHub Token>
  python publish-redirect.py --token-file D:\\token.txt

Token 需要 fine-grained，且：
  - Repository access 包含 competition-bootcamp
  - Permissions -> Repository permissions -> Contents: Read and write
"""

import argparse
import base64
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request

OWNER = "yanghao158640"
REPO = "competition-bootcamp"
BRANCH = "master"
TARGET = "index.html"

BASE = os.path.dirname(os.path.abspath(__file__))
LOCAL = os.path.join(BASE, "competition-bootcamp-redirect", "index.html")
BACKUP_DIR = os.path.join(BASE, "backup")

MARKER = "页面已迁移"
PAGES_URL = "https://yanghao158640.github.io/competition-bootcamp/"
KEEP = [
    "https://yanghao158640.github.io/competition-bootcamp/tank-game.html",
    "https://yanghao158640.github.io/competition-bootcamp/ml-report/",
]

API = "https://api.github.com"


def req(method, path, token, payload=None):
    url = path if path.startswith("http") else API + path
    data = None
    headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": "Bearer %s" % token,
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "wb-resume-print",
    }
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"
    r = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r, timeout=45) as resp:
            body = resp.read().decode("utf-8", "replace")
            return resp.status, (json.loads(body) if body.strip() else {})
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", "replace")
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, {"raw": body}


def http_code(url):
    """用 curl 探测线上状态（本机 python 的 TLS 对 github.io 不一定稳）。"""
    try:
        out = subprocess.run(
            ["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}", "-m", "25",
             "%s?cb=%d" % (url, int(time.time() * 1000) % 100000)],
            capture_output=True, text=True, timeout=40,
        )
        return out.stdout.strip()
    except Exception as exc:  # noqa: BLE001
        return "ERR(%s)" % exc


def fetch(url):
    try:
        out = subprocess.run(
            ["curl", "-s", "-m", "25", "%s?cb=%d" % (url, int(time.time() * 1000) % 100000)],
            capture_output=True, text=True, timeout=40,
        )
        return out.stdout
    except Exception:  # noqa: BLE001
        return ""


def get_token(args):
    if args.token:
        return args.token.strip()
    path = args.token_file or r"D:\token.txt"
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8-sig") as fh:
            return fh.read().strip()
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--token", default=None, help="GitHub Personal Access Token")
    ap.add_argument("--token-file", default=None, help="存有 Token 的文件路径")
    ap.add_argument("--no-verify", action="store_true", help="上传后不轮询验证")
    args = ap.parse_args()

    print("=" * 66)
    print("  把旧地址 /competition-bootcamp/ 变成跳转页")
    print("=" * 66)

    token = get_token(args)
    if not token:
        print("\n[!] 没拿到 Token。")
        print("    用法：python publish-redirect.py --token <Token>")
        print("    或把 Token 存到 D:\\token.txt 后直接运行本脚本。")
        print("    Token 需具备 competition-bootcamp 的 Contents: Read and write。")
        sys.exit(2)

    if not os.path.exists(LOCAL):
        print("[!] 找不到跳转页源文件：%s" % LOCAL)
        sys.exit(2)
    with open(LOCAL, "rb") as fh:
        content = fh.read()
    print("\n[1/5] 本地跳转页：%s（%d 字节）" % (LOCAL, len(content)))

    st, me = req("GET", "/user", token)
    if st != 200:
        print("    [!] Token 无效或网络异常：HTTP %s %s" % (st, me.get("message")))
        sys.exit(1)
    print("[2/5] Token 身份：%s" % me.get("login"))

    st, body = req("GET", "/repos/%s/%s/contents/%s" % (OWNER, REPO, TARGET), token)
    sha = body.get("sha") if isinstance(body, dict) else None
    if st == 200:
        print("[3/5] 仓库里已有 index.html（sha %s），将覆盖它" % (sha or "")[:10])
        # 顺手备份远端现状
        os.makedirs(BACKUP_DIR, exist_ok=True)
        c = body.get("content")
        if c:
            raw = base64.b64decode(c)
            bp = os.path.join(BACKUP_DIR, "competition-bootcamp-index-remote-backup.html")
            with open(bp, "wb") as fh:
                fh.write(raw)
            print("      已备份远端旧文件 → %s（%d 字节）" % (bp, len(raw)))
    elif st == 404:
        print("[3/5] 仓库里没有 index.html，将新建")
    else:
        print("[3/5] 读取失败：HTTP %s %s" % (st, body.get("message") if isinstance(body, dict) else body))

    payload = {
        "message": "chore: 旧简历首页改为跳转到新个人主页",
        "content": base64.b64encode(content).decode("ascii"),
        "branch": BRANCH,
    }
    if sha:
        payload["sha"] = sha

    st, body = req("PUT", "/repos/%s/%s/contents/%s" % (OWNER, REPO, TARGET), token, payload)
    if st not in (200, 201):
        msg = body.get("message") if isinstance(body, dict) else body
        print("\n[!] 上传失败：HTTP %s" % st)
        print("    %s" % msg)
        if st in (403, 404):
            print("\n    多半是 Token 权限不足：请把该 Token 的")
            print("    Permissions -> Repository permissions -> Contents 设为 Read and write，")
            print("    并确认 Repository access 里勾了 competition-bootcamp。")
        sys.exit(1)
    commit = (body.get("commit") or {}).get("sha", "")[:10]
    print("[4/5] 上传成功，commit %s" % commit)

    if args.no_verify:
        print("[5/5] 已跳过验证（--no-verify）")
        return

    print("[5/5] 等待 Pages 重新发布（最多 ~4 分钟）…")
    ok = False
    for i in range(1, 17):
        html = fetch(PAGES_URL)
        code = http_code(PAGES_URL)
        hit = MARKER in html
        print("      第 %2d 次: HTTP %s | 跳转页标记: %s | %d 字节"
              % (i, code, "已生效" if hit else "未生效", len(html)))
        if hit:
            ok = True
            break
        time.sleep(14)

    print("\n--- 保留页复查（必须仍然 200）---")
    for u in KEEP:
        print("      %-70s %s" % (u, http_code(u)))

    if ok:
        print("\n==> 完成：/competition-bootcamp/ 已变成跳转页，README 不再被当首页渲染。")
    else:
        print("\n[!] 已上传但线上还没生效 —— Pages 构建可能仍在排队，过 1~2 分钟再跑一次本脚本复查。")


if __name__ == "__main__":
    main()
