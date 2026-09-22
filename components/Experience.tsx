import { experiences } from "@/data";

/**
 * 经历房。六张卡排成 3×2。
 * 想新增一段经历，只需往 data/index.ts 的 experiences 数组里追加一个对象。
 */
const Experience = () => {
  return (
    <section id="experience" className="stage">
      <div className="board" data-board="experience">
        <div className="board-inner">
          <h2 className="board-title">
            我走过的 <span className="text-purple">路</span>
          </h2>
          <p className="board-sub">
            从课程、认证到真正写出来的东西，都是自己一步步试出来的。
          </p>

          <div className="mt-5 grid min-h-0 flex-1 auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {experiences.map((item) => (
              <div
                key={item.id}
                className="brick flex min-h-0 flex-col p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
                  <h3 className="text-[15px] font-bold leading-snug">
                    {item.title}
                  </h3>
                  <span className="brick-chip whitespace-nowrap px-2.5 py-0.5 text-[11px] text-white">
                    {item.period}
                  </span>
                </div>

                <p className="mt-2 text-[12px] text-white-100">{item.role}</p>

                <p className="mt-2 line-clamp-3 flex-1 text-[12.5px] leading-relaxed text-white-200">
                  {item.desc}
                </p>

                {item.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-[5px] border border-white/15 bg-black/40 px-2 py-0.5 text-[11px] text-white-100"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Experience;