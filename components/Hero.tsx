import { FaDownload, FaLocationArrow } from "react-icons/fa6";

import { profile, stats } from "@/data";
import MagicButton from "./MagicButton";

/**
 * 入口大厅。
 * 这块板挂在长廊最前面那间房的中间：抬头 → 大标题 → 定位 → 按钮 → 数字，
 * 数字用 mt-auto 落到底部，板子怎么缩放排版都不会散。
 */
const Hero = () => {
  return (
    <section id="hero" className="stage">
      <div className="board" data-board="hero">
        <div className="board-inner">
          {/* 上半段（抬头 → 标题 → 定位 → 按钮）在余下的空间里居中，
              下面的数字贴到板底，上下留白才均匀 */}
          <div className="flex min-h-0 flex-1 flex-col justify-center">
            <p className="text-[11px] uppercase tracking-widest text-blue-100">
              {profile.eyebrow}
            </p>

            <h1 className="mt-4 text-[26px] font-bold leading-tight sm:text-[30px] lg:text-[34px]">
              你好，我是杨豫豪。一个用 AI{" "}
              <span className="text-purple">把想法落地</span>的人。
            </h1>

            <p className="mt-4 text-[13px] text-white-100">{profile.subline}</p>

            <p className="mt-3 max-w-[46rem] text-[14px] leading-relaxed text-white-200">
              {profile.intro}
            </p>

            {/* 主按钮进作品，次按钮给面试官直接拿走一份 PDF */}
            <div className="mt-6 flex w-full max-w-[520px] flex-col gap-3 sm:flex-row">
              <a href="#projects" className="block w-full max-w-[240px]">
                <MagicButton
                  title={profile.cta}
                  icon={<FaLocationArrow />}
                  position="right"
                />
              </a>

              <MagicButton
                title="下载简历 PDF"
                icon={<FaDownload />}
                position="right"
                href="/resume/yangyuhao-resume.pdf"
                download="杨豫豪-简历.pdf"
                otherClasses="toy-btn-ghost"
              />
            </div>
          </div>

          {/* 关键数字，一眼看清目前的进度 */}
          <div className="mt-auto grid grid-cols-2 gap-x-8 gap-y-5 pt-8 sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.id} className="flex flex-col">
                <span className="text-[26px] font-bold leading-none text-purple">
                  {stat.value}
                  <span className="ms-1 text-[13px] font-normal text-white-100">
                    {stat.unit}
                  </span>
                </span>
                <span className="mt-2 text-[12px] text-white-200">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;