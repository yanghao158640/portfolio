import { FaLocationArrow } from "react-icons/fa6";

import { projects } from "@/data";

/**
 * 作品房。整张卡都是链接，点哪儿都能打开在线地址（不再有悬浮才出现的按钮）。
 */
const RecentProjects = () => {
  return (
    <section id="projects" className="stage">
      <div className="board" data-board="projects">
        <div className="board-inner">
          <h2 className="board-title">
            挑几个我做出来的<span className="text-purple"> 东西</span>
          </h2>
          <p className="board-sub">
            都能在线打开、直接玩或用，不用下载安装。
          </p>

          <div className="mt-6 grid min-h-0 flex-1 auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((item) => (
              <a
                key={item.id}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="brick proj-card group flex min-h-0 flex-col overflow-hidden
                  transition duration-300 hover:-translate-y-1"
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

                  {/* 这块不是真按钮 —— 整张卡才是链接。做成描边轨道的模样，
                      鼠标落在卡片任何位置它都会亮起来（见 globals.css 的 .proj-card） */}
                  <p className="mt-3">
                    <span className="toy-keys text-[12px]">
                      <i className="toy-key toy-key-top" />
                      <i className="toy-key toy-key-bottom" />
                      <span className="toy-keys-text">
                        {item.linkLabel}
                        <FaLocationArrow className="ms-2" />
                      </span>
                    </span>
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default RecentProjects;