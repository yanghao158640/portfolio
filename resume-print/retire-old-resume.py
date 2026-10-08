# -*- coding: utf-8 -*-
"""
下掉 competition-bootcamp 的「旧简历首页」，保留其他页面
======================================================================
【做什么】
  删除   yanghao158640/competition-bootcamp  →  index.html

【为什么只删这一个文件】
  /competition-bootcamp/ 这个入口靠 index.html 提供，删掉它就等于「旧简历首页下架」；
  同目录下的其它页面**不受影响**，仍可正常访问：
      /competition-bootcamp/tank-game.html     坦克大战（竞赛附加题作品）
      /competition-bootcamp/ml-report/         吴恩达《机器学习》学习汇报
  → 你主页首页和简历 PDF 里指向这两个的链接**不会失效**。

【可恢复性】
  · 本地备份：D:\\competition-bootcamp\\index.html 与 D:\\competition-bootcamp-source\\index.html
    （线上 100258 B，与本地逐字节一致）
  · 线上 git 历史仍在，随时可从仓库 History 里找回。

【用法】
    python retire-old-resume.py --token <GitHub Token>
    python retire-old-resume.py --token-file <token.txt>

  Token 权限：必须对该仓库有 **Contents: Read and write**
  （经典 Token 勾 repo；细粒度 Token 在 Permissions→Contents 选 Read and write，
    且 Repository access 要包含 yanghao158640/competition-bootcamp）
"""

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request

API = "https://api.github.com"
OWNER = "yanghao158640"
REPO = "competition-bootcamp"
TARGET = "index.html"

BASE = "https://yanghao158640.github.io/competition-bootcamp/"
MUST_BE_GONE = BASE
MUST_SURVIVE = [
    BASE + "tank-game.html",
    BASE + "ml-report/",
]


def req(method, path, token, payload=None, timeout=90):
    headers = {
        "Authorization": "Bearer " + token,
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "retire-old-resume",
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


def http_code(url):
    r = urllib.request.Request(
        url + ("?cb=%d" % int(time.time()) if "?" not in url else ""),
        headers={"User-Agent": "Mozilla/5.0", "Cache-Control": "no-cache"},
    )
    try:
        with urllib.request.urlopen(r, timeout=40) as resp:
            return resp.status
    except urllib.error.HTTPError as e:
        return e.code
    except Exception:
        return 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--token")
    ap.add_argument("--token-file")
    args = ap.parse_args()

    token = args.token
    if not token and args.token_file:
        if not os.path.exists(args.token_file):
            sys.exit("[x] 找不到 Token 文件：%s" % args.token_file)
        with open(args.token_file, "r", encoding="utf-8-sig") as fh:
            token = fh.read().strip()
    if not token:
        sys.exit("[x] 请用 --token 或 --token-file 提供 GitHub Token")

    print("=" * 66)
    print("  下掉 competition-bootcamp 旧简历首页（保留坦克大战 / ML 报告）")
    print("=" * 66)

    # 1. 身份
    st, me = req("GET", "/user", token)
    if st != 200:
        print("\n[x] Token 校验失败 (HTTP %s)：%s" % (st, me))
        return 1
    print("\n[1/5] 身份校验通过：%s" % me.get("login"))

    # 2. 取目标文件的 sha（DELETE 必须带）
    st, body = req("GET", "/repos/%s/%s/contents/%s" % (OWNER, REPO, TARGET), token)
    if st == 404:
        print("[2/5] 远端已无 %s，无需操作。" % TARGET)
        return 0
    if st != 200:
        print("\n[x] 读取目标文件失败 (HTTP %s)：%s" % (st, body))
        return 1
    sha = body.get("sha")
    size = body.get("size")
    print("[2/5] 目标已定位：%s/%s/%s（%.0f KB）" % (OWNER, REPO, TARGET, size / 1024))

    # 3. 先留一份服务端备份到本地（以防万一）
    backup_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backup")
    os.makedirs(backup_dir, exist_ok=True)
    backup_path = os.path.join(backup_dir, "competition-bootcamp-index.html")
    content_b64 = body.get("content") if isinstance(body, dict) else None
    if content_b64:
        import base64
        raw = base64.b64decode(content_b64)
        with open(backup_path, "wb") as fh:
            fh.write(raw)
        print("[3/5] 已备份到本地：%s（%d 字节）" % (backup_path, len(raw)))
    else:
        print("[3/5] [!] 未能取到文件内容做备份，但本地已有 D:\\competition-bootcamp\\index.html")

    # 4. 删除
    st, body = req("DELETE", "/repos/%s/%s/contents/%s" % (OWNER, REPO, TARGET), token, {
        "message": "chore: 下掉旧简历首页（保留 tank-game / ml-report）",
        "sha": sha,
    })
    if st != 200:
        print("\n[x] 删除失败 (HTTP %s)：%s" % (st, body))
        print("    若为 403，说明 Token 缺 Contents: Read and write 权限。")
        return 1
    commit = body.get("commit", {})
    print("[4/5] 已删除  commit %s" % commit.get("sha", "")[:8])

    # 5. 轮询验证
    print("[5/5] 等待 Pages 重新发布（旧简历首页应消失，其它页面应存活）…")
    gone_ok = survive_ok = False
    for i in range(18):
        time.sleep(10)
        c_gone = http_code(MUST_BE_GONE)
        c_surv = [http_code(u) for u in MUST_SURVIVE]
        gone_ok = c_gone == 404
        survive_ok = all(c == 200 for c in c_surv)
        print("      第 %2d 次：/competition-bootcamp/ → %s | tank-game → %s | ml-report → %s"
              % (i + 1, c_gone, c_surv[0], c_surv[1]))
        if gone_ok and survive_ok:
            print()
            print("=" * 66)
            print("  ✅ 完成")
            print("  旧简历首页   %s  → 404（已下架）" % MUST_BE_GONE)
            print("  坦克大战     %s  → 200（保留）" % MUST_SURVIVE[0])
            print("  ML 汇报      %s  → 200（保留）" % MUST_SURVIVE[1])
            print("=" * 66)
            return 0

    print()
    print("=" * 66)
    print("  ⚠ 文件已删除，但线上状态未完全符合预期：")
    print("     旧首页 404：%s ／ 其它页面存活：%s" % (gone_ok, survive_ok))
    print("  多为 Pages 仍在构建或 CDN 未回源，等 1~2 分钟再看。")
    print("=" * 66)
    return 2


if __name__ == "__main__":
    sys.exit(main())
