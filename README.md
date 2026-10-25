# 杨豫豪 · 环境工程 × AI 作品集

在线网站：[yanghao158640.github.io](https://yanghao158640.github.io/)。本仓库维护网站源码、内容和公开素材；部署仓库只保存静态构建结果。

## 代表作品

| 分类 | 作品 | 在线体验 |
| --- | --- | --- |
| 环境工程 | 城市污水处理厂 A²/O 工艺模拟器 | [打开模拟器](https://hsbx9017-dot.github.io/wwtp-simulator/) |
| AI应用 | 先学一点 · 学习规划工具 | [打开工具](https://hsbx9017-dot.github.io/xianxue-yidian/) |
| 课程学习 | 机器学习学习汇报 | [查看汇报](https://yanghao158640.github.io/competition-bootcamp/ml-report/) |
| 互动游戏 | 坦克大战 | [在线试玩](https://yanghao158640.github.io/competition-bootcamp/tank-game.html) |
| 互动游戏 | 飞机大战 | [在线试玩](https://yanghao158640.github.io/plane-game/) |

作品详情如实说明 AI 辅助实现、功能和使用边界。工艺模拟器为教学模型，未用实厂数据率定，不能替代工程设计。

## 仓库分工

| 仓库 | 用途 |
| --- | --- |
| `yanghao158640/portfolio` | 当前源码。修改内容、样式、组件和简历生成脚本。 |
| `yanghao158640/yanghao158640.github.io` | GitHub Pages 静态产物，不直接维护源码。 |
| `yanghao158640/competition-bootcamp` | 训练营作品与既有坦克游戏、学习汇报链接。 |
| `yanghao158640/plane-game` | 飞机大战源码与站点。 |
| `yanghao158640/resume` | 历史简历入口，保留兼容访问。 |
| `hsbx9017-dot/wwtp-simulator` | 环境工程工艺模拟器。 |
| `hsbx9017-dot/xianxue-yidian` | 学习规划工具，独立部署和反馈服务。 |

源码与部署仓库都在用，并非重复项目。旧作品和跳转入口仍可能被外部链接引用，不整仓删除。

## 内容维护

`data/index.ts` 是公开内容的统一来源，作品顺序也在此维护。网页、命令搜索和 PDF 都使用同一份数据。新增作品后，首页作品数量自动更新；作品按分类与每页三项展示，避免挤出3D解说板。

主要目录：`app/` 页面与打印样式，`components/` 交互组件，`public/` 公开图片与PDF，`scripts/` 内容检查、PDF生成和发布同步。

缓存、日志、依赖、构建目录和临时导出文件不提交。历史版本可通过Git记录或 `maintenance-backup-2026-10-24` 标签恢复。

## 本地预览与发布

1. 使用 Node.js，运行 `npm ci`、`npm run dev`。
2. 改动内容后运行 `npm run resume:pdf`。需要 Python、reportlab 和 pypdf；可用 `PORTFOLIO_PYTHON` 指定解释器、`PORTFOLIO_CJK_FONT` 指定中文字体。
3. 设置环境变量 `BUILD_TARGET=pages`，运行 `npm run build`，产物在 `out/`。
4. 运行 `node scripts/check-portfolio.mjs` 检查项目、统计和静态文件。
5. 在相邻目录克隆部署仓库为 `github-portfolio-deploy`，运行 `npm run deploy` 同步静态文件。同步会验证目标仓库身份，并清掉目标中被新版构建替代的已追踪产物。
6. 检查并提交源码仓库与部署仓库，再将部署仓库推送到 `main`。GitHub Pages 从部署仓库发布。

PDF可编辑来源是 `data/index.ts` 和 `scripts/build-resume-pdf.py`，不再手工维护第二份HTML简历。生成结果同时保存到 `public/resume/` 和被忽略的 `output/pdf/`。

## 来源

界面基础参考 [JavaScript Mastery / adrianhajdin 的 portfolio 模板](https://github.com/adrianhajdin/portfolio)，在此基础上维护个人内容、3D展示、作品详情、分类与简历导出。
