import React from "react";
import {
  FaDownload,
  FaEnvelope,
  FaGithub,
  FaLocationArrow,
  FaPhone,
} from "react-icons/fa6";

import { profile, socials } from "@/data";
import MagicButton from "./MagicButton";

const socialIcons: Record<string, React.ReactNode> = {
  github: <FaGithub size={20} />,
  mail: <FaEnvelope size={20} />,
  phone: <FaPhone size={20} />,
};

/**
 * 联系房 —— 长廊最后一间，尽头是实心墙，走到这里就到底了。
 */
const Footer = () => {
  return (
    <section id="contact" className="stage">
      <div className="board" data-board="contact">
        <div className="board-inner">
          <h2 className="board-title">{profile.contactTitle}</h2>
          <p className="board-sub max-w-[42rem]">{profile.contactDesc}</p>

          {/* 中部：三种联系方式 + 一键写邮件 */}
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6">
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[14px]">
              <a
                href={`mailto:${profile.email}`}
                className="text-white-100 transition hover:text-purple"
              >
                {profile.email}
              </a>
              <a
                href={`tel:${profile.phone}`}
                className="text-white-100 transition hover:text-purple"
              >
                {profile.phone}
              </a>
              <span className="text-white-200">{profile.location}</span>
            </div>

            {/* 一条主线（写邮件）＋ 一条捷径（直接下载简历 PDF） */}
            <div className="flex w-full max-w-[520px] flex-col gap-3 sm:flex-row">
              <a
                href={`mailto:${profile.email}`}
                className="block w-full max-w-[240px]"
              >
                <MagicButton
                  title="给我发封邮件"
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

          {/* 底部：版权 + 社交图标 */}
          <div className="mt-auto flex flex-col items-center justify-between gap-4 border-t-2 border-black/50 pt-5 md:flex-row">
            <p className="text-[13px] font-light">
              © {new Date().getFullYear()} {profile.name} · {profile.role}
            </p>

            <div className="flex items-center gap-3">
              {socials.map((info) => (
                <a
                  key={info.id}
                  href={info.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={info.name}
                  title={info.name}
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-[10px]
                    border-2 border-black/60 bg-[#10143a] text-white-100 transition
                    shadow-[4px_4px_0_rgba(0,0,0,0.45)]
                    hover:-translate-y-0.5 hover:text-purple"
                >
                  {socialIcons[info.icon]}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Footer;