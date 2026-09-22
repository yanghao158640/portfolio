import { profile, toolStack } from "@/data";
import GridGlobe from "./ui/GridGlobe";

/**
 * 关于房。左边是自我介绍与近况，右边是一颗地球和常用工具。
 */
const Grid = () => {
  return (
    <section id="about" className="stage">
      <div className="board" data-board="about">
        <div className="board-inner">
          <h2 className="board-title">
            关于 <span className="text-purple">我</span>
          </h2>
          <p className="board-sub">环境工程与 AI 之间，我两边都在走。</p>

          <div className="mt-5 flex min-h-0 flex-1 flex-col gap-5 lg:flex-row">
            {/* 左：自我介绍 + 基本信息 + 近况 */}
            <div className="flex min-h-0 flex-[1.35] flex-col">
              <div className="flex min-h-0 flex-1 flex-col justify-center">
                <p className="text-[14px] leading-relaxed text-white-200">
                  {profile.intro}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    profile.location,
                    profile.school,
                    `${profile.major} · 2026 级`,
                  ].map((chip) => (
                    <span
                      key={chip}
                      className="brick-chip px-3 py-1 text-[12px] text-white-100"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </div>

              <div
                className="brick p-5"
              >
                <p className="text-[11px] tracking-widest text-purple">
                  最近在做
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-white-200">
                  {profile.nowDoing}
                </p>
              </div>
            </div>

            {/* 右：地球 + 工具栈 */}
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="relative h-[260px] min-h-0 flex-1 overflow-hidden rounded-[10px] border-2 border-black/50 bg-[#060b23] lg:h-auto">
                <GridGlobe />
              </div>

              <div className="mt-4">
                <p className="text-[11px] tracking-widest text-purple">
                  工具与技术栈
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[...toolStack.left, ...toolStack.right].map((tool) => (
                    <span
                      key={tool}
                      className="brick-chip px-3 py-1 text-[12px] text-white-100"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Grid;