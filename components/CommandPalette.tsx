"use client";

import { useCallback, useEffect, useState } from "react";
import { Command } from "cmdk";
import {
  FaArrowDown,
  FaCopy,
  FaDownload,
  FaEnvelope,
  FaFileLines,
  FaGithub,
  FaHouse,
  FaMagnifyingGlass,
} from "react-icons/fa6";

import { navItems, profile } from "@/data";
import { enterRoom } from "@/lib/spatial";

/**
 * 传送门（Ctrl / ⌘ + K）
 * ---------------------------------------------------------------------------
 * 用 cmdk（MIT，Vercel 与 Linear 都在用的命令面板）搭的。
 * 对这个站来说它不是「加个小玩意」—— 展厅有 8 间房，靠滚动要一间间走过去；
 * 访客只想拿简历或看联系方式时，得穿过整条长廊。现在按 Ctrl+K 直接跳。
 *
 * 只做两件事：跳到某间房、执行一个动作。输入框支持模糊匹配，
 * 并且每项都塞了同义词（value 里那几个词），所以敲「简」能出简历、
 * 敲「证」能到证书房 —— 中文用户不一定会按条目原名去搜。
 *
 * 右下角那个小方块是给手机用的：触屏没有 Ctrl+K，得有个能点的入口。
 * ---------------------------------------------------------------------------
 */

type Action = {
  id: string;
  label: string;
  hint?: string;
  icon: React.ReactNode;
  group: string;
  /** 塞进搜索文本的同义词，中文输入很需要这个 */
  keywords: string;
  run: () => void;
};

const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  /* Ctrl+K / ⌘K 开关面板；在输入框里打字时不劫持，免得打断了正常输入 */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((prev) => !prev);
        return;
      }
      // 不在输入态时，单按 / 也能唤起，和 GitHub 的习惯一致
      if (event.key === "/" && !typing) {
        event.preventDefault();
        setOpen(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  /** 去某间房。3D 层在跑就走「推门进入」，否则退回滚动（见 lib/spatial.ts） */
  const goTo = useCallback((hash: string) => {
    enterRoom(hash.replace("#", ""));
  }, []);

  const copyEmail = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // 无痕模式或没授权时 clipboard 会拒绝，退回到让用户自己复制
      window.location.href = `mailto:${profile.email}`;
    }
  }, []);

  const rooms: Action[] = [
    {
      id: "hero",
      label: "回入口大厅",
      icon: <FaHouse />,
      group: "跳转",
      keywords: "home 首页 大门 开头 顶部 start",
      run: () => goTo("#hero"),
    },
    ...navItems.map((item) => ({
      id: item.link.replace("#", ""),
      label: item.name,
      icon: <FaArrowDown />,
      group: "跳转",
      // 给每间房补几组说法，覆盖不同的搜索习惯
      keywords: {
        "#projects": "作品 项目 游戏 演示 work project",
        "#approach": "实践 方法 怎么做 approach",
        "#certs": "认证 证书 资质 证 cert certificate",
        "#about": "关于 介绍 我是谁 about",
        "#experience": "经历 履历 路线 experience",
        "#skills": "技能 能力 工具 skill",
        "#contact": "联系 邮箱 电话 找 contact",
      }[item.link] ?? "",
      run: () => goTo(item.link),
    })),
  ];

  const actions: Action[] = [
    {
      id: "resume-pdf",
      label: "下载简历 PDF",
      hint: "一页纸 A4",
      icon: <FaDownload />,
      group: "动作",
      keywords: "简历 下载 resume cv pdf 附件",
      run: () => {
        const a = document.createElement("a");
        a.href = "/resume/yangyuhao-resume.pdf";
        a.download = "杨豫豪-简历.pdf";
        a.click();
      },
    },
    {
      id: "resume-page",
      label: "在线查看简历",
      hint: "可自己存成 PDF",
      icon: <FaFileLines />,
      group: "动作",
      keywords: "简历 网页 打印 resume 预览",
      run: () => window.open("/resume", "_blank", "noopener"),
    },
    {
      id: "mail",
      label: "给我发封邮件",
      icon: <FaEnvelope />,
      group: "动作",
      keywords: "邮件 邮箱 联系 mail email",
      run: () => {
        window.location.href = `mailto:${profile.email}`;
      },
    },
    {
      id: "copy-mail",
      label: copied ? "邮箱已复制" : "复制邮箱地址",
      hint: profile.email,
      icon: <FaCopy />,
      group: "动作",
      keywords: "复制 邮箱 地址 copy email",
      run: copyEmail,
    },
    {
      id: "github",
      label: "打开我的 GitHub",
      icon: <FaGithub />,
      group: "动作",
      keywords: "github 代码 仓库 源码 开源",
      run: () =>
        window.open(
          "https://github.com/yanghao158640",
          "_blank",
          "noopener"
        ),
    },
  ];

  const groups = ["跳转", "动作"];

  return (
    <>
      {/* 手机上的入口：触屏没有 Ctrl+K，得给个能点的东西 */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="打开传送门（也可按 Ctrl 加 K）"
        className="cmdk-trigger fixed bottom-5 right-5 z-[4000] hidden h-11 items-center gap-2
          rounded-[10px] border-2 border-black/70 bg-[#10143a] px-4 text-[12px] font-bold
          text-white shadow-[4px_4px_0_rgba(0,0,0,0.5)] transition
          hover:-translate-y-0.5 hover:text-[#ffcf00] sm:flex"
      >
        <FaMagnifyingGlass />
        <span>传送门</span>
        <kbd className="rounded border border-white/25 px-1.5 py-0.5 text-[10px] font-normal text-white/70">
          Ctrl K
        </kbd>
      </button>

      <Command.Dialog
        open={open}
        onOpenChange={setOpen}
        label="传送门"
        className="cmdk-lego"
        overlayClassName="cmdk-lego-overlay"
        contentClassName="cmdk-lego-content"
      >
        <Command.Input placeholder="跳到哪间房，或搜一个动作…" />
        <Command.List>
          <Command.Empty>没找到。试试「简历」「证书」「联系」。</Command.Empty>

          {groups.map((group) => {
            const items = [...rooms, ...actions].filter(
              (item) => item.group === group
            );
            return (
              <Command.Group key={group} heading={group}>
                {items.map((item) => (
                  <Command.Item
                    key={item.id}
                    // value 决定模糊匹配的文本，所以把同义词一起塞进来
                    value={`${item.label} ${item.keywords}`}
                    onSelect={() => {
                      /* 必须「先关门、后办事」。
                         cmdk 底层是 Radix Dialog，打开期间会给 body 挂上滚动锁
                         （overflow: hidden）；这时候调 scrollIntoView 是无效的，
                         实测滚动位置一动不动 —— 被锁整个吃掉了。
                         所以先 setOpen(false) 让它关掉、锁解开，再执行动作。 */
                      setOpen(false);
                      window.setTimeout(() => item.run(), 200);
                    }}
                  >
                    <span className="cmdk-lego-icon">{item.icon}</span>
                    <span>{item.label}</span>
                    {item.hint && (
                      <span className="cmdk-lego-hint">{item.hint}</span>
                    )}
                  </Command.Item>
                ))}
              </Command.Group>
            );
          })}
        </Command.List>
      </Command.Dialog>
    </>
  );
};

export default CommandPalette;