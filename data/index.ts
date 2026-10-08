/**
 * 作品集内容数据层
 * ---------------------------------------------------------------------------
 * 这里是全站唯一的内容来源。新增一段经历 / 一个作品 / 一项技能，
 * 只需要在对应数组里追加一个对象，无需改动任何组件代码。
 *
 * 顺序 = 页面上的显示顺序。
 * ---------------------------------------------------------------------------
 */

/* ============================== 类型定义 ============================== */

export type NavItem = {
  name: string;
  link: string;
};

export type GridItem = {
  /** 1–6 与 BentoGrid 内的排版特效一一对应，请勿改动 */
  id: number;
  title: string;
  description: string;
  /** 卡片在网格中占几行几列 */
  className: string;
  img?: string;
  imgClassName?: string;
  titleClassName?: string;
  spareImg?: string;
};

export type Project = {
  id: number;
  title: string;
  des: string;
  /** 封面图，换成自己的截图时把文件放进 public/ 再改这里 */
  img: string;
  tags: string[];
  /** 在线访问地址 */
  link: string;
  /** 卡片右上角悬浮时显示的文字 */
  linkLabel: string;
  /**
   * 详情层的内容。面试官看到的往往只是一个能玩的游戏，
   * 却不知道你在里面具体做了什么 —— 这几段就是补上这一层。
   * 不填的话，卡片仍然只有「打开作品」这一个动作，不会报错。
   */
  detail?: {
    /** 一句话概括这个项目在解决什么 */
    summary: string;
    /** 技术要点，每条一句话 */
    points: string[];
    /** 进去之后先看哪里 —— 帮访客快速看到最有意思的部分 */
    tryThis: string;
  };
};

export type ExperienceItem = {
  id: number;
  title: string;
  /** 一句话说明你在这里的角色 */
  role: string;
  period: string;
  desc: string;
  tags: string[];
};

export type Skill = {
  name: string;
  /** 自评分数 0–100 */
  level: number;
};

export type Certification = {
  id: number;
  title: string;
  issuer: string;
  date: string;
  note: string;
  /** 证书扫描件，文件放在 public/certs/ 下 */
  img: string;
};

export type Practice = {
  id: number;
  title: string;
  des: string;
  tags: string[];
};

export type Social = {
  id: number;
  name: string;
  href: string;
  icon: "github" | "mail" | "phone";
};

export type Stat = {
  id: number;
  value: string;
  unit: string;
  label: string;
};

/* ============================== 个人信息 ============================== */

export const profile = {
  name: "杨豫豪",
  shortName: "yyh",
  role: "环境工程 × AI 技术探索者",
  eyebrow: "Environmental Engineering × AI",
  /** 首屏大标题，逐字浮现 */
  headline: "你好，我是杨豫豪。一个用 AI 把想法落地的人。",
  subline: "河南城建学院环境工程专业 2026 级本科生 · 河南 郑州",
  cta: "看看我的作品",
  email: "2813573523@qq.com",
  phone: "17719891195",
  location: "河南 · 郑州",
  school: "河南城建学院",
  major: "环境工程",
  /** 首屏下方的自我定位 */
  intro:
    "我不满足于「会用工具」，而是习惯把想法真正变成能用的东西 —— 网站、小游戏、自动化脚本，以及被别人拿去用的海报和文稿。",
  /** 近况，显示在技能区下方 */
  nowDoing: "搭建个人作品站，把坦克大战、飞机大战与机器学习汇报整理成可在线体验的作品集。",
  nowReading: "吴恩达《机器学习》配套资料，以及关于 AI 工作流与产品设计的书。",
  /** 联系区文案 */
  contactTitle: "愿意聊聊，或者一起做点什么？",
  contactDesc:
    "这只是一个起点 —— 我的能力与作品仍在快速生长。欢迎前辈与伙伴来交流，把想法碰撞成更多可能。",
};

export const stats: Stat[] = [
  { id: 1, value: "8", unit: "项", label: "AI 领域认证" },
  { id: 2, value: "3", unit: "个", label: "在线可访问作品" },
  { id: 3, value: "2", unit: "款", label: "可试玩小游戏" },
  { id: 4, value: "2026", unit: "级", label: "本科在读" },
];

/** 顺序与 app/page.tsx 里的区块顺序、3D 长廊里的房间顺序一致 */
export const navItems: NavItem[] = [
  { name: "作品", link: "#projects" },
  { name: "实践", link: "#approach" },
  { name: "认证", link: "#certs" },
  { name: "关于", link: "#about" },
  { name: "经历", link: "#experience" },
  { name: "技能", link: "#skills" },
  { name: "联系", link: "#contact" },
];

/* ========================= 关于我（Bento 网格） ========================= */

export const gridItems: GridItem[] = [
  {
    id: 1,
    title:
      "把想法真正变成能用的东西 —— 网站、小游戏、自动化脚本，还有被别人拿去用的海报和文稿。",
    description: "关于我",
    className: "lg:col-span-3 md:col-span-6 md:row-span-4 lg:min-h-[60vh]",
    imgClassName: "w-full h-full",
    titleClassName: "justify-end",
    img: "/b1.svg",
    spareImg: "",
  },
  {
    id: 2,
    title: "河南 · 郑州",
    description: "常驻",
    className: "lg:col-span-2 md:col-span-3 md:row-span-2",
    imgClassName: "",
    titleClassName: "justify-start",
    img: "",
    spareImg: "",
  },
  {
    id: 3,
    title: "工具与技术栈",
    description: "我在用它们把想法落地",
    className: "lg:col-span-2 md:col-span-3 md:row-span-2",
    imgClassName: "",
    titleClassName: "justify-center",
    img: "",
    spareImg: "",
  },
  {
    id: 4,
    title: "在环境工程与 AI 之间做交叉探索",
    description: "",
    className: "lg:col-span-2 md:col-span-3 md:row-span-1",
    imgClassName: "",
    titleClassName: "justify-start",
    img: "/grid.svg",
    spareImg: "/b4.svg",
  },
  {
    id: 5,
    title: "最近在做：把这个作品站搭好",
    description: "近况",
    className: "md:col-span-3 md:row-span-2",
    imgClassName: "absolute right-0 bottom-0 md:w-96 w-60",
    titleClassName: "justify-center md:justify-start lg:justify-center",
    img: "/b5.svg",
    spareImg: "/grid.svg",
  },
  {
    id: 6,
    title: "要不要一起做点什么？",
    description: "",
    className: "lg:col-span-2 md:col-span-3 md:row-span-1",
    imgClassName: "",
    titleClassName: "justify-center md:max-w-full max-w-60 text-center",
    img: "",
    spareImg: "",
  },
];

/** 关于我卡片里滚动的工具标签 */
export const toolStack: { left: string[]; right: string[] } = {
  left: ["DeepSeek", "Kimi", "通义千问"],
  right: ["豆包", "Trae", "Python"],
};

/* ============================== 代表作品 ============================== */

export const projects: Project[] = [
  {
    id: 1,
    title: "坦克大战",
    des: "Canvas 单文件实现的经典坦克对战：键盘操控、敌军 AI 生成、碰撞检测与关卡节奏，纯原生 JavaScript 无依赖。",
    img: "/works/shots/tank-game.png",
    tags: ["JavaScript", "Canvas", "游戏"],
    link: "https://yanghao158640.github.io/competition-bootcamp/tank-game.html",
    linkLabel: "在线试玩",
    detail: {
      summary:
        "想验证一件事：不装任何游戏引擎、不拆成多个文件，只用原生 JavaScript 能不能做出一个完整能玩的游戏。",
      points: [
        "全程原生 JavaScript，零第三方库、零构建步骤，单个文件就能跑",
        "用 Canvas 逐帧绘制，自己处理画面刷新与上一帧的清理",
        "键盘输入直接驱动坦克的移动与开火",
        "自己写碰撞检测，判定子弹与坦克的命中",
        "关卡节奏随进度收紧，越往后压力越大",
      ],
      tryThis:
        "直接用键盘操控开打。重点感受两处：打击判定准不准，以及难度是怎么一关关爬上去的。",
    },
  },
  {
    id: 2,
    title: "飞机大战",
    des: "战机操控、敌机与 BOSS 刷新、碰撞判定与计分系统，逐帧循环驱动的完整小游戏。",
    img: "/works/shots/plane-battle.png",
    tags: ["JavaScript", "Canvas", "游戏"],
    link: "https://yanghao158640.github.io/plane-game/",
    linkLabel: "在线试玩",
    detail: {
      summary:
        "在第一款游戏之后，把「敌机批量刷新 + BOSS + 计分」这套更完整的战斗循环走通一遍。",
      points: [
        "一个逐帧循环驱动整局，把生成、更新、渲染三个阶段分开写",
        "敌机与 BOSS 按节奏分批刷新，难度随时间往上走",
        "碰撞判定要同时管住玩家、子弹、敌机三方",
        "计分系统把整局战果记录下来",
      ],
      tryThis:
        "打到 BOSS 出现的那一关。那里是刷新节奏和碰撞判定最吃紧的地方，也是这一版相比上一款进步最大的部分。",
    },
  },
  {
    id: 3,
    title: "吴恩达《机器学习》学习汇报",
    des: "13 页 HTML 交互式演示文稿，把课程核心概念与实践理解整理成可在线翻阅的汇报材料。",
    img: "/works/shots/ml-report.png",
    tags: ["HTML", "演示文稿", "机器学习"],
    link: "https://yanghao158640.github.io/competition-bootcamp/ml-report/",
    linkLabel: "在线查看",
    detail: {
      summary:
        "把吴恩达《机器学习》课程的核心概念，整理成一份不用下载、打开就能翻的汇报材料。",
      points: [
        "13 页 HTML 演示文稿，做成能直接在线翻阅的形式",
        "概念是按自己的理解重新组织的，不是把讲义照搬一遍",
        "纯 HTML 实现，不依赖 PowerPoint 或任何演示工具",
      ],
      tryThis:
        "从第一页往下翻。看的是「一个概念被怎么拆开重讲」——同一份讲义，讲法能看出理解到哪一层。",
    },
  },
];

/** 更多实践，显示在「更多实践」区块的悬浮卡片里 */
export const practices: Practice[] = [
  {
    id: 1,
    title: "自动整理文件夹脚本",
    des: "按文件类型自动归类，减少日常文件管理的重复操作，把重复劳动交给程序。",
    tags: ["Python", "Trae"],
  },
  {
    id: 2,
    title: "成绩统计分析工具",
    des: "支持多科目成绩录入、均分计算与排名生成，让数据整理从手工表格变成一条命令。",
    tags: ["Python", "Pandas"],
  },
  {
    id: 3,
    title: "AI 辅助写作工作流",
    des: "设计一套 AI 辅助写作流程，部分成果被校内文学社刊采用。",
    tags: ["DeepSeek", "Kimi"],
  },
];

/* ============================== 经历 ============================== */

export const experiences: ExperienceItem[] = [
  {
    id: 1,
    title: "Python 自动化脚本",
    role: "独立开发",
    period: "2025 — 至今",
    desc: "借助 AI 工具完成文件自动归类脚本，把日常重复劳动交给程序，AI 能力转化为实际生产力。",
    tags: ["Python", "Trae"],
  },
  {
    id: 2,
    title: "AI 工具应用实践",
    role: "深度使用",
    period: "2025 — 至今",
    desc: "系统使用 DeepSeek、Kimi、通义千问、豆包、Trae 等，覆盖数据分析、写作辅助与工作流设计。",
    tags: ["DeepSeek", "Kimi", "通义千问", "豆包", "Trae"],
  },
  {
    id: 3,
    title: "海报设计 & 演示文稿制作",
    role: "AI 辅助创作",
    period: "2025",
    desc: "用 AI 辅助完成多套校园活动海报，独立制作演示文稿用于班级展示，获积极反馈。",
    tags: ["AI 绘图", "演示文稿"],
  },
  {
    id: 4,
    title: "吴恩达《机器学习》课程",
    role: "课程学习 · 已获证书",
    period: "2025",
    desc: "完成课程学习并获证书；掌握监督学习、无监督学习、神经网络等核心概念。",
    tags: ["机器学习"],
  },
  {
    id: 5,
    title: "8 项 AI 领域专业认证",
    role: "认证获取",
    period: "2026",
    desc: "讯飞星火 Prompt Engineer、Agent Engineer、Fine-tuning Engineer、达摩院人工智能训练师（高级）、华为人工智能初识微认证、AI4S Cup Python 基础能力认证等。",
    tags: ["Prompt", "Agent", "微调", "AI 应用"],
  },
  {
    id: 6,
    title: "河南城建学院 · 环境工程",
    role: "本科在读",
    period: "2026 — 至今",
    desc: "2026 级本科生。专注环境工程与 AI 工具应用，用技术把想法落地。",
    tags: ["环境工程"],
  },
];

/* ============================== 技能自评 ============================== */

export const skills: Skill[] = [
  { name: "AI 工具应用", level: 90 },
  { name: "海报设计", level: 80 },
  { name: "写作能力", level: 80 },
  { name: "演示文稿 / PPT", level: 80 },
  { name: "Python 编程", level: 60 },
  { name: "数据分析", level: 55 },
  { name: "小游戏制作", level: 50 },
];

/* ============================== 认证 ============================== */

export const certifications: Certification[] = [
  {
    id: 1,
    title: "Prompt Engineer",
    issuer: "讯飞星火 × Datawhale",
    date: "2026.07",
    note: "通过提示词工程最终考核，认定为 Prompt Engineer。",
    img: "/certs/prompt-engineer.jpg",
  },
  {
    id: 2,
    title: "Agent Engineer",
    issuer: "Datawhale × 蚂蚁集团百宝箱",
    date: "2026.07",
    note: "通过智能体工程最终考核，认定为 Agent Engineer。",
    img: "/certs/agent-engineer.jpg",
  },
  {
    id: 3,
    title: "Fine-tuning Engineer",
    issuer: "Datawhale × 科大讯飞星辰",
    date: "2026.07",
    note: "通过大模型微调最终考核，认定为 Fine-tuning Engineer。",
    img: "/certs/llm-fine-tuning.jpg",
  },
  {
    id: 4,
    title: "人工智能训练师（高级）",
    issuer: "阿里云 达摩院 · 机器智能技术事业部",
    date: "2026.07",
    note: "完成达摩院智能客服「人工智能训练师」高级培训课程并认证合格。",
    img: "/certs/damo-ai-trainer.jpg",
  },
  {
    id: 5,
    title: "AI+ 编程能力认证",
    issuer: "Datawhale × 豆包 MarsCode",
    date: "2026.07",
    note: "通过 OPEN AI 通识课「AI+编程」理论考试与实践任务，具备用 AI 工具辅助编程的能力。",
    img: "/certs/ai-coding.jpg",
  },
  {
    id: 6,
    title: "人工智能初识微认证",
    issuer: "华为",
    date: "有效期至 2028.08",
    note: "完成华为人工智能基础知识认证要求。",
    img: "/certs/huawei-ai-basic.jpg",
  },
  {
    id: 7,
    title: "AI4S Cup · Python 基础能力认证",
    issuer: "北京科学智能研究院 · 深势科技",
    date: "2026.07",
    note: "认可在 Python 编程核心技能上的能力，以及用 Python 解决科学领域问题的素养。",
    img: "/certs/ai4s-python.jpg",
  },
  {
    id: 8,
    title: "Masterclass on Artificial Intelligence",
    issuer: "ITC · 国际劳工组织国际培训中心",
    date: "2026.07",
    note: "完成人工智能大师课（自主学习在线课程）。",
    img: "/certs/itc-masterclass-ai.jpg",
  },
];

/* ============================== 联系方式 ============================== */

export const socials: Social[] = [
  {
    id: 1,
    name: "GitHub",
    href: "https://github.com/yanghao158640",
    icon: "github",
  },
  {
    id: 2,
    name: "邮箱",
    href: `mailto:${profile.email}`,
    icon: "mail",
  },
  {
    id: 3,
    name: "电话",
    href: `tel:${profile.phone}`,
    icon: "phone",
  },
];