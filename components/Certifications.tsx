"use client";

import { certifications } from "@/data";

/**
 * 证书房。8 张证书排成 4×2 挂在板子上，点开看证书原图。
 * 新增认证只需往 data/index.ts 的 certifications 里追加一条，
 * 并把证书图片放进 public/certs/。
 */
const Certifications = () => {
  return (
    <section id="certs" className="stage">
      <div className="board" data-board="certs">
        <div className="board-inner">
          <h2 className="board-title">
            AI 领域<span className="text-purple"> 专业认证</span>
          </h2>
          <p className="board-sub">
            共 {certifications.length} 项，点开可以看证书原图。
          </p>

          <div className="mt-5 grid min-h-0 flex-1 auto-rows-fr grid-cols-2 gap-3 lg:grid-cols-4">
            {certifications.map((item) => (
              <a
                key={item.id}
                href={item.img}
                target="_blank"
                rel="noopener noreferrer"
                className="brick group flex min-h-0 flex-col overflow-hidden
                  transition duration-300 hover:-translate-y-1"
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
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Certifications;