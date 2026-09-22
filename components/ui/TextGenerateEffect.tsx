"use client";
import { useEffect } from "react";
import { motion, stagger, useAnimate } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * 逐字 / 逐词浮现的文字效果。
 *
 * 中文没有空格，会自动按「字」拆分；英文等含空格的语言按「词」拆分。
 * highlight 传入的片段会用紫色高亮（需与 words 中的内容完全一致）。
 */
export const TextGenerateEffect = ({
  words,
  className,
  highlight,
}: {
  words: string;
  className?: string;
  highlight?: string;
}) => {
  const [scope, animate] = useAnimate();

  const splitByWord = words.includes(" ");
  const units = splitByWord ? words.split(" ") : Array.from(words);

  // 每个 unit 在原字符串中的起始位置，用来判断它是否落在 highlight 区间内
  const offsets: number[] = [];
  let acc = 0;
  units.forEach((unit) => {
    offsets.push(acc);
    acc += unit.length + (splitByWord ? 1 : 0);
  });

  const highlightStart = highlight ? words.indexOf(highlight) : -1;
  const highlightEnd =
    highlightStart >= 0 && highlight ? highlightStart + highlight.length : -1;

  const isHighlighted = (index: number) => {
    if (highlightStart < 0) return false;
    const start = offsets[index];
    const end = start + units[index].length;
    return start >= highlightStart && end <= highlightEnd;
  };

  useEffect(() => {
    animate(
      "span",
      {
        opacity: 1,
      },
      {
        duration: 1.2,
        delay: stagger(0.06),
      }
    );
  }, [scope.current]);

  const renderWords = () => {
    return (
      <motion.div ref={scope}>
        {units.map((unit, idx) => {
          return (
            <motion.span
              key={unit + idx}
              className={`${
                isHighlighted(idx)
                  ? "text-purple"
                  : "dark:text-white text-black"
              } opacity-0`}
            >
              {unit}
              {splitByWord && " "}
            </motion.span>
          );
        })}
      </motion.div>
    );
  };

  return (
    <div className={cn("font-bold", className)}>
      <div className="my-4">
        <div className="dark:text-white text-black leading-snug tracking-wide">
          {renderWords()}
        </div>
      </div>
    </div>
  );
};