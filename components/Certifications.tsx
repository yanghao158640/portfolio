"use client";

import { useState } from "react";
import Lightbox from "yet-another-react-lightbox-lite";
import "yet-another-react-lightbox-lite/styles.css";

import { certifications } from "@/data";

/**
 * 证书房。8 张证书排成 4×2 挂在板子上，点开在原地看原图。
 *
 * 用 yet-another-react-lightbox-lite（MIT，约 5KB，零运行时依赖）做灯箱：
 * 以前点证书是 target="_blank" 跳去一张裸 JPG —— 面试官想核验 8 张证书
 * 就得开 8 个标签页，还得一格格退回来找。现在滚轮能放大看清印章小字，
 * ← → 直接翻下一张，Esc 关闭，全程不离开展厅。
 *
 * 新增认证只需往 data/index.ts 的 certifications 里追加一条，
 * 并把证书图片放进 public/certs/。灯箱会自动把它加进翻阅序列。
 */
const Certifications = () => {
  // undefined = 关闭。库就是靠这个值判断开关的
  const [index, setIndex] = useState<number | undefined>(undefined);

  const slides = certifications.map((item) => ({
    src: item.img,
    alt: `${item.title} · ${item.issuer}`,
  }));

  return (
    <section id="certs" className="stage">
      <div className="board" data-board="certs">
        <div className="board-inner">
          <h2 className="board-title">
            AI 领域<span className="text-purple"> 专业认证</span>
          </h2>
          <p className="board-sub">
            共 {certifications.length} 项，点开可放大查看原件，← → 翻页。
          </p>

          <div className="mt-5 grid min-h-0 flex-1 auto-rows-fr grid-cols-2 gap-3 lg:grid-cols-4">
            {certifications.map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`放大查看 ${item.title} 证书`}
                className="brick group flex min-h-0 cursor-pointer flex-col overflow-hidden
                  text-left transition duration-300 hover:-translate-y-1"
              >
                <div
                  className="relative aspect-[10/7] min-h-0 flex-auto overflow-hidden"
                  style={{ backgroundColor: "#13162D" }}
                >
                  <img
                    src={item.img}
                    alt={`${item.title} 证书`}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover object-top transition duration-500 group-hover:scale-105"
                  />
                  {/* 悬停时浮出一句提示，让人知道这里能点开 */}
                  <span
                    className="pointer-events-none absolute inset-0 flex items-center justify-center
                      bg-black/55 text-[11px] font-bold tracking-wider text-white
                      opacity-0 transition duration-300 group-hover:opacity-100"
                  >
                    点击放大
                  </span>
                </div>

                <div className="border-t-2 border-black/50 px-3 py-2.5">
                  <h3 className="line-clamp-2 text-[12px] font-bold leading-snug text-white">
                    {item.title}
                  </h3>
                  <p className="mt-1 line-clamp-1 text-[10.5px] text-white-100">
                    {item.issuer}
                  </p>
                  <p className="mt-0.5 text-[10px] text-purple">{item.date}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <Lightbox
        slides={slides}
        index={index}
        setIndex={setIndex}
        // 控件提示换中文，不然是英文的 Previous / Next
        labels={{
          Previous: "上一张",
          Next: "下一张",
          Close: "关闭",
          Lightbox: "证书原件",
          "Photo gallery": "证书原件",
        }}
        // 图下方的说明条，取自同一份数据，不额外维护文案
        render={{
          slideFooter: ({ slideIndex: i }) => {
            const cert = certifications[i];
            if (!cert) return null;
            return (
              <div className="yarll-caption">
                <b>{cert.title}</b>
                <span>
                  {cert.issuer} · {cert.date}
                </span>
                <span className="yarll-caption-count">
                  {i + 1} / {certifications.length}
                </span>
              </div>
            );
          },
        }}
      />
    </section>
  );
};

export default Certifications;