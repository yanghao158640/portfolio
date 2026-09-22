import React from "react";

/**
 * 按钮 —— 一块实心亮色积木：粗黑边 + 硬投影，按下去会「咔」地沉一下。
 * 颜色取自所在展位的 --board-accent，所以 8 块板上的按钮各有各的颜色。
 *
 * 传了 href 就渲染成 <a>（下载简历 PDF 这类外链用），否则是普通按钮。
 */
const MagicButton = ({
  title,
  icon,
  position,
  handleClick,
  href,
  download,
  otherClasses,
}: {
  title: string;
  icon: React.ReactNode;
  position: string;
  handleClick?: () => void;
  href?: string;
  /** 传给 <a> 的 download：值就是访客保存时看到的文件名 */
  download?: string;
  otherClasses?: string;
}) => {
  const classes = `toy-btn inline-flex h-12 w-full cursor-pointer items-center justify-center
        gap-2 px-7 text-sm focus:outline-none md:w-60 ${otherClasses ?? ""}`;

  const content = (
    <>
      {position === "left" && icon}
      {title}
      {position === "right" && icon}
    </>
  );

  if (href) {
    return (
      <a className={classes} href={href} download={download}>
        {content}
      </a>
    );
  }

  return (
    <button className={classes} onClick={handleClick}>
      {content}
    </button>
  );
};

export default MagicButton;