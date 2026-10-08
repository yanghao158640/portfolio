# -*- coding: utf-8 -*-
"""
一页纸简历 PDF 生成脚本
---------------------------------------------------------------------------
把 yangyuhao-resume.html 用本机 Edge 按 CSS 里的 @page（A4）打印成 PDF，
写入作者/标题等元数据，再同步到站点的两处目录，让「下载简历 PDF」按钮拿到新文件。

用法（在 resume-print 目录下）：
    "<venv-python>" build.py

产物：
    resume-print/out/yangyuhao-resume.pdf   ← 本地留档 / 预览
    ../public/resume/yangyuhao-resume.pdf    ← 站点源文件（重新部署时会带上）
    ../out/resume/yangyuhao-resume.pdf       ← 已构建的静态产物

改内容只改 yangyuhao-resume.html，然后重跑本脚本即可。
---------------------------------------------------------------------------
"""

import os
import shutil
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
PROJECT = os.path.dirname(HERE)
SRC_HTML = os.path.join(HERE, "yangyuhao-resume.html")
OUT_DIR = os.path.join(HERE, "out")
OUT_PDF = os.path.join(OUT_DIR, "yangyuhao-resume.pdf")

TARGETS = [
    os.path.join(PROJECT, "public", "resume", "yangyuhao-resume.pdf"),
    os.path.join(PROJECT, "out", "resume", "yangyuhao-resume.pdf"),
]

BROWSERS = [
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
]


def find_browser():
    for path in BROWSERS:
        if os.path.exists(path):
            return path
    sys.exit("找不到 Edge / Chrome，请把浏览器路径加进 BROWSERS。")


def print_pdf(browser):
    os.makedirs(OUT_DIR, exist_ok=True)
    if os.path.exists(OUT_PDF):
        os.remove(OUT_PDF)

    url = "file:///" + SRC_HTML.replace("\\", "/")
    profile = os.path.join(os.environ.get("TEMP", OUT_DIR), "resume-print-profile")

    subprocess.run(
        [
            browser,
            "--headless=new",
            "--no-sandbox",
            "--disable-gpu",
            "--no-first-run",
            "--no-default-browser-check",
            f"--user-data-dir={profile}",
            f"--print-to-pdf={OUT_PDF}",
            "--no-pdf-header-footer",
            url,
        ],
        check=False,
    )

    # Edge 打印是异步落盘，等文件稳定
    for _ in range(40):
        if os.path.exists(OUT_PDF) and os.path.getsize(OUT_PDF) > 0:
            time.sleep(0.6)
            return
        time.sleep(0.25)
    sys.exit("打印失败：没有生成 PDF（检查 HTML 路径与浏览器是否可执行）。")


def write_metadata():
    """补上作者/主题等属性；缺 pypdf 就跳过，不影响 PDF 本身。"""
    try:
        from pypdf import PdfReader, PdfWriter
    except ImportError:
        print("（未安装 pypdf，跳过元数据写入：pip install pypdf）")
        return

    reader = PdfReader(OUT_PDF)
    writer = PdfWriter()
    for page in reader.pages:
        writer.add_page(page)
    writer.add_metadata(
        {
            "/Title": "杨豫豪 · 简历",
            "/Author": "杨豫豪",
            "/Subject": "环境工程 × AI 技术探索者｜一页纸简历",
            "/Keywords": "杨豫豪, 简历, 环境工程, AI, Python, 河南城建学院",
            "/Creator": "杨豫豪",
            "/Producer": "Edge print-to-pdf",
        }
    )
    with open(OUT_PDF, "wb") as fh:
        writer.write(fh)


def sync():
    for dst in TARGETS:
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copy2(OUT_PDF, dst)
        print("已同步 ->", dst)


if __name__ == "__main__":
    print("浏览器：", find_browser())
    print_pdf(find_browser())
    write_metadata()
    size = os.path.getsize(OUT_PDF)
    print("已生成：%s (%.1f KB)" % (OUT_PDF, size / 1024))
    sync()
