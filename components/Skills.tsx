import { profile, skills } from "@/data";

/**
 * 技能房。左边 7 条技能自评，右边两张近况卡。
 * 分数只是对自己的判断，改数值或增删条目都在 data/index.ts 里完成。
 */
const Skills = () => {
  return (
    <section id="skills" className="stage">
      <div className="board" data-board="skills">
        <div className="board-inner">
          <h2 className="board-title">
            技能 <span className="text-purple">自评</span>
          </h2>
          <p className="board-sub">
            分数是我对自己当前状态的判断，会随着练习不断调整。
          </p>

          <div className="mt-5 flex min-h-0 flex-1 flex-col gap-5 lg:flex-row">
            {/* 左：技能条。板子高度固定，所以用 justify-between 把 7 条铺满 */}
            <div className="flex min-h-0 flex-[1.3] flex-col justify-between gap-3">
              {skills.map((skill) => (
                <div key={skill.name}>
                  <div className="mb-1.5 flex items-baseline justify-between">
                    <span className="text-[13px] text-white">{skill.name}</span>
                    <span className="text-[12px] font-semibold text-purple">
                      {skill.level}
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-[4px] border-2 border-black/50 bg-black/50">
                    <div
                      className="h-full rounded-[2px]"
                      style={{
                        width: `${skill.level}%`,
                        backgroundColor:
                          "rgb(var(--board-accent, 203 172 249))",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* 右：近况 */}
            <div className="flex min-h-0 flex-1 flex-col gap-4">
              {[
                { label: "最近在做", text: profile.nowDoing },
                { label: "最近在读", text: profile.nowReading },
              ].map((item) => (
                <div
                  key={item.label}
                  className="brick flex min-h-0 flex-1 flex-col justify-center p-5"
                >
                  <p className="text-[11px] tracking-widest text-purple">
                    {item.label}
                  </p>
                  <p className="mt-2 text-[13px] leading-relaxed text-white-200">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Skills;