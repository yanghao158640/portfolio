import { practices } from "@/data";

import ContributionGraph from "./ContributionGraph";

/**
 * 实践房。三张静态卡并排，序号是主要的视觉锚点 ——
 * 板子本身会被相机带进带出，这里不再做悬浮才显示内容的交互。
 * 卡片下方挂一条「持续产出」热力图，说明这些不是一次性做出来的。
 */
const Approach = () => {
  return (
    <section id="approach" className="stage">
      <div className="board" data-board="approach">
        <div className="board-inner">
          <h2 className="board-title">
            更多 <span className="text-purple">实践</span>
          </h2>
          <p className="board-sub">除了完整作品，平时也在做这些小工具。</p>

          <div className="mt-5 grid min-h-0 flex-1 auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {practices.map((item, index) => (
              <div
                key={item.id}
                className="brick flex min-h-0 flex-col justify-center p-5"
              >
                <span className="text-[26px] font-bold leading-none text-purple">
                  0{index + 1}
                </span>

                <h3 className="mt-4 text-[16px] font-bold leading-snug">
                  {item.title}
                </h3>

                <p className="mt-2 text-[13px] leading-relaxed text-white-200">
                  {item.des}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="brick-chip px-2.5 py-1 text-[11px] text-white"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 热力图挂在卡片下方，高度固定 —— 板子总高不变，相机停靠点就不会偏 */}
          <ContributionGraph />
        </div>
      </div>
    </section>
  );
};

export default Approach;