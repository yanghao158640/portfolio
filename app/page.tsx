"use client";

import dynamic from "next/dynamic";

import { navItems } from "@/data";

import Hero from "@/components/Hero";
import Grid from "@/components/Grid";
import Footer from "@/components/Footer";
import Skills from "@/components/Skills";
import Approach from "@/components/Approach";
import Experience from "@/components/Experience";
import Certifications from "@/components/Certifications";
import RecentProjects from "@/components/RecentProjects";
import { FloatingNav } from "@/components/ui/FloatingNavbar";

/** 3D 背景层只在浏览器里跑，关掉 SSR 预渲染 */
const Scene3D = dynamic(() => import("@/components/ui/Scene3D"), {
  ssr: false,
});

const Home = () => {
  return (
    <>
      {/* 固定在底层的 3D 空间，窄屏 / 关闭动效时退回静态渐变 */}
      <Scene3D />

      <main className="relative z-10 flex justify-center items-center flex-col overflow-hidden mx-auto sm:px-10 px-5">
        <div className="max-w-7xl w-full">
          <FloatingNav navItems={navItems} />
          {/* 8 个区块 = 长廊里的 8 个停靠点（入口大厅 + 7 间房），
              顺序必须和 components/ui/Scene3D.tsx 里的 STATIONS 一一对应：
              大厅 → 作品 → 实践 → 证书 → 关于 → 经历 → 技能 → 联系 → 走廊尽头。
              每个区块的正文就是那间房里立着的解说板，不要改动顺序。 */}
          <Hero />
          <RecentProjects />
          <Approach />
          <Certifications />
          <Grid />
          <Experience />
          <Skills />
          <Footer />
        </div>
      </main>
    </>
  );
};

export default Home;