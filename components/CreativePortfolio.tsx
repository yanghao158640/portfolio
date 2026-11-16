"use client";
/* Static GitHub Pages export: images are pre-sized files, without an image server. */
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Lenis from "lenis";
import { ArrowUpRight, ArrowDown, Play, Pause, X, Download, Menu, ChevronLeft, ChevronRight, Github, ExternalLink } from "lucide-react";
import { certifications, experiences, practices, profile, projects, skills, type Project } from "@/data";
import { episodes, filmSeries } from "@/data/films";

type Panel = { kind: "film"; index: number } | { kind: "cert"; index: number } | { kind: "project"; project: Project } | null;
const links = [{ href: "#films", label: "影像" }, { href: "#projects", label: "作品" }, { href: "#about", label: "关于" }, { href: "#certs", label: "认证" }];

function Spark({ className = "" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 100 100" fill="currentColor" aria-hidden="true"><path d="M46 0h8l4 33L84 12l5 6-24 25 35 3v8l-35 4 24 24-5 6-26-21-4 33h-8l-4-33-26 21-5-6 24-24L0 54v-8l35-3L11 18l5-6 26 21z" /></svg>;
}
function SectionLabel({ number, children }: { number: string; children: ReactNode }) {
  return <div className="section-label"><span>{number} /</span>{children}</div>;
}

export default function CreativePortfolio() {
  const osReduced = useReducedMotion();
  const [motionOff, setMotionOff] = useState(false);
  const reduced = !!osReduced || motionOff;
  const [menuOpen, setMenuOpen] = useState(false);
  const [filter, setFilter] = useState("全部");
  const [panel, setPanel] = useState<Panel>(null);
  const [videoError, setVideoError] = useState(false);
  const [copied, setCopied] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const heroVideo = useRef<HTMLVideoElement>(null);
  const lenis = useRef<Lenis | null>(null);
  const heroArtwork = useRef<HTMLDivElement>(null);
  const visibleProjects = projects.filter(p => filter === "全部" || p.category === filter);
  const currentFilm = panel?.kind === "film" ? episodes[panel.index] : null;
  const isPanelOpen = panel !== null;

  useEffect(() => {
    try { setMotionOff(localStorage.getItem("yyh-motion") === "off"); } catch { /* Storage is optional. */ }
  }, []);
  useEffect(() => {
    document.documentElement.dataset.motion = reduced ? "off" : "on";
    if (reduced) return;
    const smooth = new Lenis({ duration: 1.05, smoothWheel: true, syncTouch: false, anchors: { offset: -84 } });
    lenis.current = smooth;
    let frame: number;
    const tick = (time: number) => { smooth.raf(time); frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); smooth.destroy(); lenis.current = null; };
  }, [reduced]);
  useEffect(() => {
    const video = heroVideo.current;
    if (!video || reduced || (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData) { video?.pause(); return; }
    let inView = true;
    const update = () => { if (inView && !document.hidden) video.play().catch(() => {}); else video.pause(); };
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; update(); });
    observer.observe(video);
    document.addEventListener("visibilitychange", update);
    update();
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", update); video.pause(); };
  }, [reduced]);
  useEffect(() => {
    if (!isPanelOpen) return;
    const element = dialog.current;
    if (!element) return;
    element.showModal();
    lenis.current?.stop();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { element.close(); document.body.style.overflow = previous; lenis.current?.start(); };
  }, [isPanelOpen]);
  useEffect(() => { setVideoError(false); }, [currentFilm?.src]);
  const toggleMotion = () => {
    const next = !motionOff; setMotionOff(next);
    try { localStorage.setItem("yyh-motion", next ? "off" : "on"); } catch { /* No persistence needed. */ }
  };
  const copyEmail = async () => {
    try { await navigator.clipboard.writeText(profile.email); setCopied(true); window.setTimeout(() => setCopied(false), 2400); }
    catch { window.location.href = `mailto:${profile.email}`; }
  };
  const reveal = reduced ? {} : { initial: { y: 28, opacity: 0 }, whileInView: { y: 0, opacity: 1 }, viewport: { once: true, amount: 0.08 }, transition: { duration: 0.65 } };

  return <div className="portfolio">
    <a className="skip-link" href="#main">跳到主要内容</a>
    <header className="site-header">
      <a className="brand" href="#home" aria-label="杨豫豪，回到首页"><Spark /><span>杨豫豪<small>YANG YUHAO</small></span></a>
      <nav aria-label="主导航" className={menuOpen ? "main-nav is-open" : "main-nav"}>{links.map(link => <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>{link.label}<span>↗</span></a>)}</nav>
      <a className="nav-contact" href="#contact">聊聊想法 <ArrowUpRight size={17} /></a>
      <button className="menu-toggle" aria-label={menuOpen ? "关闭导航" : "打开导航"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
    </header>
    <main id="main">
      <section className="hero section-shell" id="home" aria-labelledby="hero-title">
        <div className="hero-topline"><span><i /> 持续探索，持续创造</span><span>PERSONAL PORTFOLIO — 2026</span></div>
        <div className="hero-layout"><div className="hero-copy">
          <p className="eyebrow">环境工程 × AI × 影像创作</p>
          <h1 id="hero-title"><span>让想象</span><span className="hero-last">不止于<span className="outlined">想象</span><em>。</em></span></h1>
          <p className="hero-description">你好，我是<strong>杨豫豪</strong>。<br />把脑海里的「如果」，做成屏幕上的「真的」。<br />从一段 AI 影像，到一个能解决问题的工具。</p>
          <div className="hero-actions"><a className="button button-dark" href="#films"><Play size={16} fill="currentColor" /> 进入我的作品集 <ArrowUpRight size={19} /></a><a className="text-link" href="https://raw.githubusercontent.com/yanghao158640/yanghao158640.github.io/main/resume/yangyuhao-resume-2026-film.pdf" download>下载简历 <Download size={16} /></a></div>
        </div><div className="hero-art" ref={heroArtwork} onPointerMove={e => {
          if (reduced || e.pointerType !== "mouse") return;
          const rect = e.currentTarget.getBoundingClientRect();
          e.currentTarget.style.setProperty("--mx", `${((e.clientX - rect.left) / rect.width - .5) * 13}deg`);
          e.currentTarget.style.setProperty("--my", `${-((e.clientY - rect.top) / rect.height - .5) * 9}deg`);
        }} onPointerLeave={() => { heroArtwork.current?.style.setProperty("--mx", "0deg"); heroArtwork.current?.style.setProperty("--my", "0deg"); }}>
          <div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="art-cross cross-top">+</div><div className="art-cross cross-bottom">+</div><div className="art-annotation">IDEA → FRAME → REALITY</div>
          <button className="film-layer layer-back" onClick={() => setPanel({ kind: "film", index: 2 })} aria-label="播放短剧第 3 集"><img src="/films/poster-03.jpg" alt="短剧中的铠甲男子" /><span>FRAME / 003</span></button>
          <button className="film-layer layer-front" onClick={() => setPanel({ kind: "film", index: 0 })} aria-label="播放短剧第 1 集"><video ref={heroVideo} src={reduced ? undefined : "/films/hero-loop.mp4"} poster="/films/island.jpg" muted loop playsInline preload="none" aria-hidden="true" /><span className="viewfinder top-left" /><span className="viewfinder bottom-right" /><span className="live-label"><i /> AI SHORT FILM</span><span className="art-title">海妖囚岛<small>THE SIREN ISLAND</small></span><span className="round-play"><Play fill="currentColor" size={20} /></span></button>
          <div className="art-sticker"><Spark /><span>MAKE<br />IT REAL.</span></div><span className="art-footnote">故事，正在发生。</span>
        </div></div>
        <div className="hero-bottom"><span>河南城建学院 · 环境工程 · 2026 级</span><a href="#films">向下，发现更多 <ArrowDown size={15} /></a><button className="motion-toggle" onClick={toggleMotion} aria-pressed={motionOff} disabled={!!osReduced}>{reduced ? <Play size={13} /> : <Pause size={13} />}{osReduced ? "已跟随系统减少动效" : motionOff ? "开启动效" : "暂停动效"}</button></div>
      </section>
      <div className="ticker" aria-hidden="true"><div className="ticker-track">{[0, 1].map(i => <span key={i}>IMAGINE <Spark /> CREATE <Spark /> EXPERIMENT <Spark /> REPEAT <Spark /> </span>)}</div></div>
      <section className="cinema" id="films" aria-labelledby="films-title"><div className="cinema-ambient" /><div className="section-shell cinema-content">
        <SectionLabel number="01">SELECTED FILM / 影像作品</SectionLabel>
        <motion.div className="cinema-heading" {...reveal}><div><p className="lime-text">海妖囚岛 · AI 短剧系列</p><h2 id="films-title">每次救女儿，<br /><span>我都会失去记忆。</span></h2></div><div className="cinema-intro"><p>{filmSeries.description}</p><div className="film-meta"><span>5 集作品</span><span>05:11 总时长</span><span>竖屏叙事</span></div><button className="button button-lime" onClick={() => setPanel({ kind: "film", index: 0 })}><Play size={15} fill="currentColor" /> 从第一集开始 <ArrowUpRight size={18} /></button></div></motion.div>
        <div className="episode-rail">{episodes.map((episode, index) => <motion.button key={episode.id} className="episode" {...reveal} transition={{ duration: reduced ? 0 : .6, delay: reduced ? 0 : index * .06 }} onClick={() => setPanel({ kind: "film", index })} aria-label={`播放第 ${episode.number} 集，${episode.duration}`}><div className="episode-image"><img src={episode.poster} alt={`《每次救女儿，我都会失去记忆》第 ${episode.number} 集剧照`} loading="lazy" width={600} height={1080} /><span className="episode-number">{episode.id}</span><span className="episode-play"><Play size={20} fill="currentColor" /></span><span className="episode-runtime">{episode.duration}</span></div><div className="episode-caption"><span>EPISODE {episode.id}<b>第 {episode.number} 集</b></span><ArrowUpRight size={22} /></div></motion.button>)}</div>
        <div className="cinema-foot"><span><i /> 每一帧，都是一次想象的落地。</span><span>点击海报 · 进入放映厅</span></div>
      </div></section>
      <section className="projects-section section-shell" id="projects" aria-labelledby="projects-title"><SectionLabel number="02">SELECTED WORK / 不止影像</SectionLabel>
        <motion.div className="section-heading" {...reveal}><h2 id="projects-title">也把问题，<br />做成<span className="serif-word">作品。</span></h2><p>用环境工程的视角观察问题，<br />用 AI 与代码把答案做出来。<br /><span className="muted">{projects.length} 个可以打开、体验的项目。</span></p></motion.div>
        <div className="project-filters" role="group" aria-label="按作品类型筛选">{["全部", "环境工程", "AI应用", "互动游戏", "课程学习"].map(category => <button key={category} aria-pressed={filter === category} onClick={() => setFilter(category)}>{category}{category === "全部" && <sup>05</sup>}</button>)}</div><p className="sr-only" aria-live="polite">显示 {visibleProjects.length} 个{filter === "全部" ? "" : filter}作品</p>
        <div className="project-grid">{visibleProjects.map((project, index) => <motion.article key={project.id} className={`project-item ${filter === "全部" && index > 1 ? "project-small" : ""}`} {...reveal}><button className={`project-visual project-visual-${project.id}`} onClick={() => setPanel({ kind: "project", project })} aria-label={`了解${project.title}`}><span className="project-index">PROJECT / {String(project.id).padStart(2, "0")}</span><img src={project.img} alt={project.title + "实际界面"} width={1280} height={720} loading="lazy" /><span className="project-open"><ArrowUpRight size={24} /></span></button><div className="project-info"><span className="project-category">{project.category} / {project.tags.join(" · ")}</span><h3><button onClick={() => setPanel({ kind: "project", project })}>{project.title}</button></h3><p>{project.des}</p><a className="text-link" href={project.link} target="_blank" rel="noopener noreferrer">{project.linkLabel} <ArrowUpRight size={16} /></a></div></motion.article>)}</div>
        <div className="practice-block" id="approach"><div><span className="eyebrow">SMALL EXPERIMENTS</span><h3>小想法，也认真做。</h3></div><div>{practices.map(item => <details className="practice-row" key={item.id}><summary><span>0{item.id}</span><strong>{item.title}</strong><span className="practice-tags">{item.tags.join(" / ")}</span><span className="plus">+</span></summary><p>{item.des}</p></details>)}</div></div>
      </section>
      <section className="about-section" id="about" aria-labelledby="about-title"><div className="section-shell"><SectionLabel number="03">ABOUT ME / 探索进行时</SectionLabel>
        <div className="about-layout"><motion.div className="about-manifesto" {...reveal}><span className="eyebrow">ENGINEERING MIND. CREATIVE SOUL.</span><h2 id="about-title">专业是起点，<br />好奇心<span>没有边界。</span></h2><Spark className="about-spark" /><p>我在环境工程与 AI 之间探索，<br />也在代码与影像之间寻找新的表达。</p><a className="text-link" href="/resume.html">阅读完整简历 <ArrowUpRight size={17} /></a></motion.div><div className="about-details"><p className="about-intro">{profile.intro}</p><dl className="bio-list"><div><dt>姓名</dt><dd>{profile.name}</dd></div><div><dt>教育</dt><dd>{profile.school} · {profile.major}</dd></div><div><dt>所在</dt><dd>{profile.location} · 2026 级本科在读</dd></div><div><dt>最近</dt><dd>整理 AI 短剧作品，持续完善污水处理模拟器与「先学一点」学习规划工具。</dd></div></dl><div className="about-stats"><div><strong>05</strong><span>短剧作品</span></div><div><strong>05</strong><span>在线项目</span></div><div><strong>08</strong><span>AI 领域认证</span></div></div></div></div>
        <div className="journey" id="experience"><div className="journey-title"><h3>一直在路上。</h3><span>LEARNING, MAKING, GROWING.</span></div><div className="journey-grid">{experiences.map(item => <div className="journey-item" key={item.id}><span>{item.period}</span><h4>{item.title}</h4><small>{item.role}</small><p>{item.desc}</p></div>)}</div></div>
        <div className="skills-panel" id="skills"><div><h3>我的工具箱</h3><p>持续练习，不设终点。<br /><small>分值为当前能力自评。</small></p></div><div className="skill-list">{skills.map(skill => <div className="skill" key={skill.name}><div><span>{skill.name}</span><span>{skill.level}<small> / 100</small></span></div><div className="skill-track"><span style={{ width: `${skill.level}%` }} /></div></div>)}</div></div>
      </div></section>
      <section className="cert-section section-shell" id="certs" aria-labelledby="cert-title"><SectionLabel number="04">CREDENTIALS / 学习的印记</SectionLabel><div className="section-heading"><h2 id="cert-title">热爱，有迹可循。</h2><p>8 项 AI 领域专业认证。<br />点击查看证书原件。</p></div><div className="cert-grid">{certifications.map((cert, index) => <button className="cert-item" key={cert.id} onClick={() => setPanel({ kind: "cert", index })}><span className="cert-order">{String(index + 1).padStart(2, "0")}</span><img src={cert.img} alt={cert.title + "证书缩略图"} loading="lazy" /><span className="cert-text"><b>{cert.title}</b><small>{cert.issuer}</small><em>{cert.date}</em></span><ArrowUpRight className="cert-arrow" size={22} /></button>)}</div></section>
      <footer className="contact-section" id="contact"><div className="section-shell"><SectionLabel number="05">LET’S TALK / 下一次创造</SectionLabel><div className="contact-heading"><h2>你的想法，<br />值得<span>被实现。</span></h2><a className="contact-orb" href={`mailto:${profile.email}`} aria-label="给杨豫豪发送邮件"><ArrowUpRight /></a></div><div className="contact-details"><p>交流一个想法，分享一次探索，<br />或者，一起做点有意思的东西。</p><div><a className="email-link" href={`mailto:${profile.email}`}>{profile.email} <ArrowUpRight size={24} /></a><button className="copy-email" onClick={copyEmail} aria-live="polite">{copied ? "邮箱已复制 ✓" : "复制邮箱"}</button><a className="phone-link" href={`tel:${profile.phone}`}>{profile.phone}</a></div></div><div className="footer-bottom"><span>© 2026 杨豫豪 · 保持好奇，持续创造。</span><div><a href="https://github.com/yanghao158640" target="_blank" rel="noopener noreferrer"><Github size={15} /> GitHub ↗</a><a href="https://raw.githubusercontent.com/yanghao158640/yanghao158640.github.io/main/resume/yangyuhao-resume-2026-film.pdf" download><Download size={15} /> 简历 PDF</a><a href="#home">回到顶部 ↑</a></div></div></div></footer>
    </main>
    {panel && <dialog ref={dialog} className={`viewer-dialog ${panel.kind}-dialog`} aria-labelledby="viewer-title" data-lenis-prevent onCancel={() => setPanel(null)} onClick={e => { if (e.target === e.currentTarget) setPanel(null); }} onKeyDown={e => {
      if (panel.kind !== "cert") return;
      if (e.key === "ArrowRight") { e.preventDefault(); setPanel({ kind: "cert", index: (panel.index + 1) % certifications.length }); }
      if (e.key === "ArrowLeft") { e.preventDefault(); setPanel({ kind: "cert", index: (panel.index - 1 + certifications.length) % certifications.length }); }
    }}><div className="viewer-inner"><button className="viewer-close" aria-label="关闭弹窗" onClick={() => setPanel(null)} autoFocus><X size={22} /></button>
      {panel.kind === "film" && currentFilm && <div className="film-viewer"><div className="player-stage"><video key={currentFilm.src} src={currentFilm.src} poster={currentFilm.poster} controls autoPlay playsInline preload="metadata" onError={() => setVideoError(true)} aria-label={`第 ${currentFilm.number} 集视频`} />{videoError && <p className="video-error" role="alert">视频暂时无法加载。<a href={currentFilm.src}>直接打开视频</a>，或稍后重试。</p>}</div><aside className="player-sidebar"><span className="eyebrow lime-text">NOW SHOWING / 正在放映</span><h2 id="viewer-title">{filmSeries.title}</h2><p>{filmSeries.world} · {filmSeries.format}</p><div className="now-episode">第 {currentFilm.number} 集 <span>{currentFilm.duration}</span></div><div className="player-episodes" aria-label="选择集数">{episodes.map((ep, i) => <button key={ep.id} aria-pressed={i === panel.index} onClick={() => setPanel({ kind: "film", index: i })}><img src={ep.poster} alt="" /><span>EP {ep.id}<b>第 {ep.number} 集</b></span><small>{ep.duration}</small>{i === panel.index && <Play size={13} fill="currentColor" />}</button>)}</div><div className="player-navigation"><button disabled={panel.index === 0} onClick={() => setPanel({ kind: "film", index: panel.index - 1 })}><ChevronLeft size={17} /> 上一集</button><button disabled={panel.index === episodes.length - 1} onClick={() => setPanel({ kind: "film", index: panel.index + 1 })}>下一集 <ChevronRight size={17} /></button></div><a className="player-direct" href={currentFilm.src} target="_blank" rel="noopener noreferrer">独立窗口播放 <ExternalLink size={13} /></a></aside></div>}
      {panel.kind === "cert" && <div className="cert-viewer"><div className="cert-viewer-image"><img src={certifications[panel.index].img} alt={certifications[panel.index].title + "证书原件"} /></div><div className="cert-viewer-info"><div><h2 id="viewer-title">{certifications[panel.index].title}</h2><p>{certifications[panel.index].issuer}</p><p>{certifications[panel.index].note}</p></div><div className="cert-navigation"><button aria-label="上一张证书" onClick={() => setPanel({ kind: "cert", index: (panel.index - 1 + certifications.length) % certifications.length })}><ChevronLeft /></button><span>{panel.index + 1} / {certifications.length}</span><button aria-label="下一张证书" onClick={() => setPanel({ kind: "cert", index: (panel.index + 1) % certifications.length })}><ChevronRight /></button></div></div></div>}
      {panel.kind === "project" && <div className="project-viewer"><img src={panel.project.img} alt={panel.project.title + "实际界面"} /><div className="project-viewer-copy"><span className="eyebrow">{panel.project.category}</span><h2 id="viewer-title">{panel.project.title}</h2><p>{panel.project.detail?.summary || panel.project.des}</p><ul>{panel.project.detail?.points.map(point => <li key={point}>{point}</li>)}</ul>{panel.project.detail?.tryThis && <div className="try-this"><b>可以这样体验</b><p>{panel.project.detail.tryThis}</p></div>}<div className="project-viewer-actions"><a className="button button-lime" href={panel.project.link} target="_blank" rel="noopener noreferrer">{panel.project.linkLabel} <ArrowUpRight size={18} /></a>{panel.project.repo && <a className="text-link" href={panel.project.repo} target="_blank" rel="noopener noreferrer">GitHub 源码 <Github size={17} /></a>}</div></div></div>}
    </div></dialog>}
  </div>;
}
