"use client";

import { useCallback, useEffect, useState } from "react";
import { FaArrowUpRightFromSquare, FaLocationArrow, FaXmark } from "react-icons/fa6";

import { projects, type Project } from "@/data";

/**
 * 作品房
 * ---------------------------------------------------------------------------
 * 每张卡有两个入口，各管一件事：
 *   卡片主体 → 打开「详情层」，讲清这个项目里你具体做了什么
 *   底部按钮 → 直接去在线试玩
 *
 * 之前整张卡就是一个外链，点哪儿都是跳走 —— 面试官看到的是一个能玩的游戏，
 * 却不知道你在里面负责什么，也容易一走不返。现在先把「做了什么」说清楚，
 * 想玩再点出去。
 * ---------------------------------------------------------------------------
 */

/** 详情层：一张卡片的完整说明，浮在当前展厅上方 */
const ProjectDetail = ({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) => {
  /* Esc 关闭 + 打开期间锁住背景滚动。
     锁滚动还有一个作用：3D 相机是跟着滚动位置走的，
     不锁的话在详情层里滚轮会把展厅也一起推走。 */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  const detail = project.detail;

  return (
    <div
      className="pdv-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`${project.title} 项目详情`}
      onClick={onClose}
    >
      <div className="pdv-panel" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          className="pdv-close"
          onClick={onClose}
          aria-label="关闭详情"
        >
          <FaXmark />
        </button>

        {/* 封面 */}
        <div className="pdv-cover">
          <img src={project.img} alt={`${project.title} 截图`} />
        </div>

        <div className="pdv-body">
          <div className="pdv-head">
            <h3>{project.title}</h3>
            <div className="pdv-tags">
              {project.tags.map((tag) => (
                <span key={tag} className="brick-chip px-2.5 py-0.5 text-[11px] text-white-100">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {detail ? (
            <>
              <p className="pdv-summary">{detail.summary}</p>

              <h4 className="pdv-h4">技术要点</h4>
              <ul className="pdv-points">
                {detail.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>

              <div className="pdv-try">
                <span className="pdv-try-label">进去先看这里</span>
                <p>{detail.tryThis}</p>
              </div>
            </>
          ) : (
            // 没写 detail 的作品也不会开天窗，退回原来的简介
            <p className="pdv-summary">{project.des}</p>
          )}

          <div className="pdv-actions">
            <a
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="pdv-open"
            >
              {project.linkLabel}
              <FaArrowUpRightFromSquare className="ms-2 text-[11px]" />
            </a>
            <button type="button" className="pdv-dismiss" onClick={onClose}>
              先看别的
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const RecentProjects = () => {
  const [active, setActive] = useState<Project | null>(null);
  const close = useCallback(() => setActive(null), []);

  return (
    <section id="projects" className="stage">
      <div className="board" data-board="projects">
        <div className="board-inner">
          <h2 className="board-title">
            挑几个我做出来的<span className="text-purple"> 东西</span>
          </h2>
          <p className="board-sub">
            都能在线打开、直接玩或用。点卡片先看「我做了什么」，想玩再点出去。
          </p>

          <div className="mt-6 grid min-h-0 flex-1 auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((item) => (
              <div
                key={item.id}
                className="brick proj-card group flex min-h-0 flex-col overflow-hidden
                  transition duration-300 hover:-translate-y-1"
              >
                {/* 卡片主体：打开详情层 */}
                <button
                  type="button"
                  onClick={() => setActive(item)}
                  aria-label={`查看 ${item.title} 的项目详情`}
                  className="flex min-h-0 flex-1 cursor-pointer flex-col text-left"
                >
                  <div
                    className="relative aspect-[16/10] min-h-0 flex-auto overflow-hidden"
                    style={{ backgroundColor: "#13162D" }}
                  >
                    <img
                      src={item.img}
                      alt={item.title}
                      className="absolute inset-0 h-full w-full object-cover object-top transition duration-500 group-hover:scale-105"
                    />
                    <span
                      className="pointer-events-none absolute inset-0 flex items-center justify-center
                        bg-black/60 text-[11px] font-bold tracking-wider text-white
                        opacity-0 transition duration-300 group-hover:opacity-100"
                    >
                      看看我做了什么
                    </span>
                  </div>

                  <div className="border-t-2 border-black/50 p-4">
                    <h3 className="text-[15px] font-bold leading-snug">
                      {item.title}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-[12px] leading-relaxed text-white-200">
                      {item.des}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="brick-chip px-2.5 py-0.5 text-[11px] text-white-100"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>

                {/* 底部：真正跳出去玩的入口。整块是链接，
                    鼠标落在卡片任何位置它都会亮起来（见 globals.css 的 .proj-card） */}
                <div className="border-t-2 border-black/50 px-4 py-3">
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(event) => event.stopPropagation()}
                    className="toy-keys text-[12px]"
                    aria-label={`${item.linkLabel}：${item.title}`}
                  >
                    <i className="toy-key toy-key-top" />
                    <i className="toy-key toy-key-bottom" />
                    <span className="toy-keys-text">
                      {item.linkLabel}
                      <FaLocationArrow className="ms-2" />
                    </span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {active && <ProjectDetail project={active} onClose={close} />}
    </section>
  );
};

export default RecentProjects;