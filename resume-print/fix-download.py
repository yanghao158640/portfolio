# -*- coding: utf-8 -*-
"""
修复简历站「下载简历 PDF」按钮 404
======================================================================
【根因】
  按钮代码： <a href="/resume/yangyuhao-resume.pdf" download="杨豫豪-简历.pdf">

  该绝对路径解析为：
      https://yanghao158640.github.io/resume/yangyuhao-resume.pdf

  但 /resume/ 这一整段路径，已经被【另一个独立仓库】
      yanghao158640/resume   （GitHub Pages project site）
  接管。它的发布根目录 = /resume/。

  也就是说 /resume/xxx 只会去 yanghao158640/resume 仓库里找文件，
  而该仓库里只有 index.html + 8 张 jpg，没有 PDF → 404。

  ⚠ 所以把 PDF 放进 yanghao158640.github.io 仓库的 resume/ 目录是【无效】的，
    那边根本不是这条 URL 的发布源。

【修复】
  把 PDF 上传到  yanghao158640/resume  仓库的【根目录】，
  文件名保持 yangyuhao-resume.pdf。
  → https://yanghao158640.github.io/resume/yangyuhao-resume.pdf  立即 200
  不需要改动网站任何一行代码。

【用法】
    python fix-download.py --token <你的 GitHub Token>

  Token 权限：Classic 勾 repo ；Fine-grained 勾 Contents: Read and write
  （只需要能写 yanghao158640/resume 这一个仓库）

【说明】
  本机 github.com:443 不通，但 api.github.com 可用，故走 Contents API。
"""

import argparse
import base64
import json
import os
import sys
import time
import urllib.error
import urllib.request

API = "https://api.github.com"
OWNER = "yanghao158640"
REPO = "resume"                      # ← 关键：目标是被 Pages 接管 /resume/ 的那个仓库
PATH = "yangyuhao-resume.pdf"        # ← 放根目录，对应 /resume/yangyuhao-resume.pdf
LOCAL = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out", "yangyuhao-resume.pdf")
LIVE_URL = "https://yanghao158640.github.io/resume/yangyuhao-resume.pdf"


def req(method, path, token, payload=None, timeout=90):
    headers = {
        "Authorization": "Bearer " + token,
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "resume-download-fix",
    }
    data = None
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"
    request = urllib.request.Request(API + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=timeout) as resp:
            body = resp.read()
            return resp.status, (json.loads(body.decode("utf-8")) if body else {})
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", "replace")
        try:
            detail = json.loads(detail)
        except Exception:
            pass
        return e.code, detail
    except Exception as e:
        return 0, "%s: %s" % (type(e).__name__, e)


def check_live():
    """直接访问线上 URL，返回 (状态码, 字节数)。"""
    url = LIVE_URL + "?cb=%d" % int(time.time())
    r = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0", "Cache-Control": "no-cache"})
    try:
        with urllib.request.urlopen(r, timeout=40) as resp:
            return resp.status, len(resp.read())
    except urllib.error.HTTPError as e:
        return e.code, 0
    except Exception as e:
        return 0, 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--token", help="GitHub Personal Access Token（直接写在命令行）")
    ap.add_argument("--token-file", help="从文本文件读取 Token（更安全，避免留在聊天记录里）")
    ap.add_argument("--no-verify", action="store_true", help="上传后不轮询验证")
    args = ap.parse_args()

    token = args.token
    if not token and args.token_file:
        if not os.path.exists(args.token_file):
            sys.exit("[x] 找不到 Token 文件：%s" % args.token_file)
        with open(args.token_file, "r", encoding="utf-8-sig") as fh:
            token = fh.read().strip()
    if not token:
        sys.exit("[x] 请用 --token 或 --token-file 提供 GitHub Token")

    print("=" * 64)
    print("  修复「下载简历 PDF」按钮（404 → 200）")
    print("=" * 64)

    # 0. 本地文件
    if not os.path.exists(LOCAL):
        sys.exit("[x] 找不到本地 PDF：%s\n    先运行 build.py 生成。" % LOCAL)
    raw = open(LOCAL, "rb").read()
    if not raw.startswith(b"%PDF"):
        sys.exit("[x] 本地文件不是有效 PDF：%s" % LOCAL)
    print("\n[1/5] 本地 PDF 就绪：%.0f KB" % (len(raw) / 1024))

    # 1. token 校验
    st, me = req("GET", "/user", token)
    if st != 200:
        print("\n[x] Token 校验失败 (HTTP %s)：%s" % (st, me))
        print("    常见原因：拼错 / 已过期 / 缺 repo 写权限")
        return 1
    print("[2/5] 身份校验通过：%s" % me.get("login"))

    # 2. 读取远端现有文件（覆盖必须带 sha）
    st, body = req("GET", "/repos/%s/%s/contents/%s" % (OWNER, REPO, PATH), token)
    if st not in (200, 404):
        print("\n[x] 读取目标仓库失败 (HTTP %s)：%s" % (st, body))
        return 1
    sha = body.get("sha") if (st == 200 and isinstance(body, dict)) else None
    old_size = body.get("size") if (st == 200 and isinstance(body, dict)) else None
    print("[3/5] 目标：%s/%s → %s" % (OWNER, REPO, PATH))
    print("      远端现状：%s" % ("已存在 %.0f KB，将覆盖" % (old_size / 1024) if sha else "不存在，将新建"))

    # 3. 上传
    payload = {
        "message": "resume: 上传一页纸简历 PDF（修复下载按钮 404）",
        "content": base64.b64encode(raw).decode("ascii"),
    }
    if sha:
        payload["sha"] = sha
    st, body = req("PUT", "/repos/%s/%s/contents/%s" % (OWNER, REPO, PATH), token, payload)
    if st not in (200, 201):
        print("\n[x] 上传失败 (HTTP %s)：%s" % (st, body))
        return 1
    commit = body.get("commit", {})
    print("[4/5] 上传成功  commit %s" % commit.get("sha", "")[:8])

    # 4. 轮询线上
    if args.no_verify:
        print("[5/5] 已跳过验证。稍后访问：%s" % LIVE_URL)
        return 0
    print("[5/5] 等待 GitHub Pages 重新发布（通常 30~90 秒）…")
    for i in range(18):
        time.sleep(10)
        code, size = check_live()
        print("      第 %2d 次：HTTP %s%s" % (i + 1, code, "  %.0f KB" % (size / 1024) if size else ""))
        if code == 200 and size > 10000:
            print()
            print("=" * 64)
            print("  ✅ 修好了：%s" % LIVE_URL)
            print("  现在刷新网站，点「下载简历 PDF」即可。")
            print("=" * 64)
            return 0
    print()
    print("=" * 64)
    print("  ⚠ 文件已上传，但线上还没返回 200。")
    print("  可能是 Pages 还在构建 / CDN 缓存。等 2 分钟再点一次；")
    print("  若仍不行，去仓库 Actions 或 Settings→Pages 看构建状态。")
    print("=" * 64)
    return 2


if __name__ == "__main__":
    sys.exit(main())
