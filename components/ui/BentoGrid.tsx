"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { IoCopyOutline } from "react-icons/io5";

import { cn } from "@/lib/utils";

import { BackgroundGradientAnimation } from "./GradientBg";
import GridGlobe from "./GridGlobe";
import MagicButton from "../MagicButton";
import { profile, toolStack } from "@/data";

/** 「复制邮箱」成功时炸开的小粒子，纯 CSS + framer-motion，不依赖第三方动画库 */
const CONFETTI_COLORS = ["#CBACF9", "#393BB2", "#E4ECFF", "#06B6D4"];

const Confetti = () => (
  <div className="pointer-events-none absolute -bottom-5 right-0 h-[200px] w-[400px] overflow-hidden">
    {Array.from({ length: 26 }).map((_, i) => {
      const angle = (i / 26) * Math.PI * 2;
      const distance = 50 + (i % 6) * 24;
      return (
        <motion.span
          key={i}
          className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length] }}
          initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
          animate={{
            opacity: 0,
            x: Math.cos(angle) * distance,
            y: Math.sin(angle) * distance,
            scale: 0.3,
          }}
          transition={{ duration: 1.3, ease: "easeOut" }}
        />
      );
    })}
  </div>
);

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        // change gap-4 to gap-8, change grid-cols-3 to grid-cols-5, remove md:auto-rows-[18rem], add responsive code
        "grid grid-cols-1 md:grid-cols-6 lg:grid-cols-5 md:grid-row-7 gap-4 lg:gap-8 mx-auto",
        className
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  id,
  title,
  description,
  //   remove unecessary things here
  img,
  imgClassName,
  titleClassName,
  spareImg,
}: {
  className?: string;
  id: number;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  img?: string;
  imgClassName?: string;
  titleClassName?: string;
  spareImg?: string;
}) => {
  const leftLists = toolStack.left;
  const rightLists = toolStack.right;

  const [copied, setCopied] = useState(false);
  // 每点一次就自增，用作 Confetti 的 key，让粒子动画可以重播
  const [copyRound, setCopyRound] = useState(0);

  const handleCopy = () => {
    navigator.clipboard.writeText(profile.email);
    setCopied(true);
    setCopyRound((round) => round + 1);
  };

  return (
    <div
      className={cn(
        // remove p-4 rounded-3xl dark:bg-black dark:border-white/[0.2] bg-white  border border-transparent, add border border-white/[0.1] overflow-hidden relative
        "row-span-1 relative overflow-hidden rounded-3xl border border-white/[0.1] group/bento hover:shadow-xl transition duration-200 shadow-input dark:shadow-none justify-between flex flex-col space-y-4",
        className
      )}
      style={{
        //   add these two
        //   you can generate the color from here https://cssgradient.io/
        background: "rgb(4,7,29)",
        backgroundColor:
          "linear-gradient(90deg, rgba(4,7,29,1) 0%, rgba(12,14,35,1) 100%)",
      }}
    >
      {/* add img divs */}
      <div className={`${id === 6 && "flex justify-center"} h-full`}>
        <div className="w-full h-full absolute">
          {img && (
            <img
              src={img}
              alt={img}
              className={cn(imgClassName, "object-cover object-center ")}
            />
          )}
        </div>
        <div
          className={`absolute right-0 -bottom-5 ${id === 5 && "w-full opacity-80"
            } `}
        >
          {spareImg && (
            <img
              src={spareImg}
              alt={spareImg}
              //   width={220}
              className="object-cover object-center w-full h-full"
            />
          )}
        </div>
        {id === 6 && (
          // add background animation , remove the p tag
          <BackgroundGradientAnimation>
            <div className="absolute z-50 inset-0 flex items-center justify-center text-white font-bold px-4 pointer-events-none text-3xl text-center md:text-4xl lg:text-7xl"></div>
          </BackgroundGradientAnimation>
        )}

        <div
          className={cn(
            titleClassName,
            "group-hover/bento:translate-x-2 transition duration-200 relative md:h-full min-h-40 flex flex-col px-5 p-5 lg:p-10"
          )}
        >
          {/* change the order of the title and des, font-extralight, remove text-xs text-neutral-600 dark:text-neutral-300 , change the text-color */}
          <div className="font-sans font-extralight md:max-w-48 md:text-xs lg:text-base text-sm text-[#C1C2D3] z-10">
            {description}
          </div>
          <div
            className={`font-sans text-lg lg:text-2xl leading-snug max-w-96 font-bold z-10`}
          >
            {title}
          </div>

          {/* for the github 3d globe */}
          {id === 2 && <GridGlobe />}

          {/* Tech stack list div */}
          {id === 3 && (
            <div className="flex gap-1 lg:gap-4 w-fit absolute -right-3 lg:-right-2">
              <div className="flex flex-col gap-2 lg:gap-3">
                {leftLists.map((item, i) => (
                  <span
                    key={i}
                    className="lg:py-2.5 lg:px-3 py-2 px-3 text-xs lg:text-sm rounded-lg text-center bg-[#10132E]"
                  >
                    {item}
                  </span>
                ))}
                <span className="lg:py-2.5 lg:px-3 py-2 px-3 rounded-lg text-center bg-[#10132E]"></span>
              </div>
              <div className="flex flex-col gap-2 lg:gap-3">
                <span className="lg:py-2.5 lg:px-3 py-2 px-3 rounded-lg text-center bg-[#10132E]"></span>
                {rightLists.map((item, i) => (
                  <span
                    key={i}
                    className="lg:py-2.5 lg:px-3 py-2 px-3 text-xs lg:text-sm rounded-lg text-center bg-[#10132E]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
          {id === 6 && (
            <div className="mt-5 relative">
              {copyRound > 0 && <Confetti key={copyRound} />}

              <MagicButton
                title={copied ? "邮箱已复制" : "复制我的邮箱"}
                icon={<IoCopyOutline />}
                position="left"
                handleClick={handleCopy}
                otherClasses="!bg-[#161A31]"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
