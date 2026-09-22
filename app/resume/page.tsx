import type { Metadata } from "next";

import {
  certifications,
  experiences,
  profile,
  projects,
  skills,
  toolStack,
} from "@/data";

import "./resume.css";

/**
 * 简历打印页
 * ---------------------------------------------------------------------------
 * 一页纸 A4 简历，内容全部来自 data/index.ts，不额外维护第二份文案。
 *
 * 它同时是两个东西：
 *   1. 访客点「下载简历」时拿到的 PDF 的来源 —— 用 scripts/export-resume-pdf.mjs
 *      以无头 Edge 打开本页、按 CSS 里的 @page 打印成 public/resume/*.pdf；
 *   2. 一个可以直接在线看的白底页面（访客也可以自己 Ctrl/⌘ + P 存成 PDF）。
 *
 * 所以这里的排版规则只有一条：打印出来什么样，屏幕上就什么样（.rs-page 在屏幕
 * 上是带阴影的一张 A4 纸，打印时纸边距交给 @page）。
 * ---------------------------------------------------------------------------
 */

export const metadata: Metadata = {
  title: `${profile.name} · 简历`,
  description: `${profile.role}｜一页纸简历（可下载 PDF）`,
};

/** 简历里只留岗位相关的实践：认证单独成节、在校信息归到教育背景 */
const RESUME_EXPERIENCE_IDS = [1, 2, 3, 4];

/** 8 项认证都是这一批取得的，日期统一写在标题里，正文里就不必每条重复 */
const CERT_BATCH = "2026.07";

const resumeExperiences = experiences.filter((item) =>
  RESUME_EXPERIENCE_IDS.includes(item.id)
);

const skillLine = [...skills]
  .sort((a, b) => b.level - a.level)
  .map((skill) => skill.name)
  .join(" · ");

const tools = [...toolStack.left, ...toolStack.right];

const summary =
  `${profile.school}${profile.major}专业在读本科生，习惯把想法做成能用的东西 —— ` +
  `网站、小游戏与自动化脚本。系统使用 ${tools.join("、")} 等 AI 工具，` +
  `覆盖提示词工程、智能体搭建、大模型微调与数据分析，` +
  `已获 ${certifications.length} 项 AI 领域专业认证。`;

const ResumePage = () => {
  return (
    <>
      {/* 屏幕上的提示条，打印时自动隐藏 */}
      <div className="rs-hint">
        <span>
          这是简历的打印版，按 <b>Ctrl / ⌘ + P</b> 也可以直接存成 PDF。
        </span>
        <a
          className="rs-hint-btn"
          href="/resume/yangyuhao-resume.pdf"
          download="杨豫豪-简历.pdf"
        >
          下载 PDF
        </a>
      </div>

      <div className="rs-page">
        <header className="rs-head">
          <div>
            <h1 className="rs-name">{profile.name}</h1>
            <p className="rs-role">{profile.role}</p>
          </div>
          <ul className="rs-contact">
            <li>{profile.phone}</li>
            <li>
              <a href={`mailto:${profile.email}`}>{profile.email}</a>
            </li>
            <li>{profile.location}</li>
            <li>
              <a href="https://github.com/yanghao158640">
                github.com/yanghao158640
              </a>
            </li>
          </ul>
        </header>

        <p className="rs-summary">{summary}</p>

        <div className="rs-body">
          {/* 主栏：作品与经历 */}
          <div className="rs-main">
            <section className="rs-sec">
              <h2 className="rs-h2">
                代表作品<small>3 个可在线访问的项目</small>
              </h2>
              <ul className="rs-list">
                {projects.map((project) => (
                  <li key={project.id}>
                    <div className="rs-item-head">
                      <b>{project.title}</b>
                      <a href={project.link}>{project.linkLabel}</a>
                    </div>
                    <p className="rs-desc">{project.des}</p>
                    <p className="rs-tags">{project.tags.join(" · ")}</p>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rs-sec">
              <h2 className="rs-h2">实践与经历</h2>
              <ul className="rs-list">
                {resumeExperiences.map((item) => (
                  <li key={item.id}>
                    <div className="rs-item-head">
                      <b>{item.title}</b>
                      <i>{item.period}</i>
                    </div>
                    <p className="rs-desc">{item.desc}</p>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* 右栏：教育与资质，都是短条目，窄栏更好读 */}
          <div className="rs-side">
            <section className="rs-sec">
              <h2 className="rs-h2">教育背景</h2>
              <b className="rs-edu-name">
                {profile.school} · {profile.major}
              </b>
              <p className="rs-desc">
                2026 级本科在读。交叉探索方向：AI 工具应用与 Python 编程。
              </p>
            </section>

            <section className="rs-sec">
              <h2 className="rs-h2">
                AI 领域认证<small>{certifications.length} 项 · {CERT_BATCH}</small>
              </h2>
              <ul className="rs-certs">
                {certifications.map((cert) => (
                  <li key={cert.id}>
                    <b className="rs-cert-name">{cert.title}</b>
                    <p className="rs-cert-i">
                      {/* 同一批次取得的日期统一写在标题里，个别有期限的才单独标出来 */}
                      {cert.date === CERT_BATCH
                        ? cert.issuer
                        : `${cert.issuer} · ${cert.date}`}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        <section className="rs-sec">
          <h2 className="rs-h2">技能与工具</h2>
          <ul className="rs-rows">
            <li className="rs-row">
              <p>
                <span className="rs-row-key">技能：</span>
                {skillLine}
              </p>
            </li>
            <li className="rs-row">
              <p>
                <span className="rs-row-key">常用工具：</span>
                {tools.join(" · ")}
              </p>
            </li>
          </ul>
        </section>

        <footer className="rs-foot">
          <span>证书原件与作品演示均可在线查看</span>
          <span>github.com/yanghao158640</span>
        </footer>
      </div>
    </>
  );
};

export default ResumePage;