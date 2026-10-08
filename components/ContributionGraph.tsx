"use client";

import { useEffect, useState } from "react";
import { GitHubCalendar, type Activity } from "react-github-calendar";

import { profile } from "@/data";

/**
 * 持续产出热力图
 * ---------------------------------------------------------------------------
 * 用 react-github-calendar（MIT）+ react-activity-calendar 渲染，
 * 数据来自 GitHub 的公开提交记录（不需要 token，纯只读）。
 *
 * 为什么放在实践房：这间房讲的是「除了成品，平时也在做什么」，
 * 而热力图正好回答那个更难的问题 —— 「这些是一次性的，还是在持续做」。
 * 作品只能证明结果，热力图能证明过程。
 *
 * 两个刻意的设计决定：
 *
 * 1. 只显示最近 16 周，不是一整年。大一刚起步，铺满 52 周的格子会是一片
 *    空洞；16 周让最近的动作看得清，也符合「最近在做什么」这个语境。
 *
 * 2. 空格子做成「可见的底板」而不是透明留白。用深蓝色而不是全透明，
 *    整片网格读起来像一块还没搭满的乐高底板 —— 是「正在积累」，
 *    不是「数据加载失败」或「一片空白」。
 * ---------------------------------------------------------------------------
 */

/** 只留最近 16 周（112 天），把一年份的数据裁短 */
const WEEKS = 16;
const DAYS = WEEKS * 7;

const ContributionGraph = () => {
  /**
   * 必须等挂载后再渲染日历。
   *
   * 这个库在服务端渲染出来的结构（一个空的骨架 <article>）和客户端首次渲染的
   * 不一致，直接渲染会让 React 判定 hydration 失败 —— 报
   * 「An error occurred during hydration. The server HTML was replaced with
   * client content」，然后整页推倒重渲。那一下会连带影响 3D 层。
   *
   * 所以服务端和客户端首次渲染都只出占位框，挂载完成后才换成真日历：
   * 两边一致，就没有 mismatch 了。占位框留了固定高度，不会跳版。
   */
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  /** 按日期裁出最近一段；日期是 yyyy-MM-dd，可以直接比字符串 */
  const trimToRecentWeeks = (data: Activity[]): Activity[] => {
    if (data.length <= DAYS) return data;
    return data.slice(data.length - DAYS);
  };

  return (
    <div className="brick mt-4 flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:gap-6">
      {/* 左：标签 + 一句说明 */}
      <div className="shrink-0 lg:w-[190px]">
        <p className="text-[11px] tracking-widest text-purple">持续产出</p>
        <p className="mt-1.5 text-[12px] leading-relaxed text-white-200">
          近 {WEEKS} 周的公开提交记录 —— 作品只是结果，这块能看出是不是在一直做。
        </p>
      </div>

      {/* 右：热力图本体 */}
      <div className="gh-heatmap min-w-0 flex-1 overflow-x-auto">
        {mounted ? (
          <GitHubCalendar
            username="yanghao158640"
            year="last"
            transformData={trimToRecentWeeks}
            colorScheme="dark"
            // 1px 圆角 ≈ 方砖；再圆就变成 GitHub 那种胶囊了，和乐高不像
            blockRadius={1}
            blockSize={12}
            blockMargin={4}
            fontSize={11}
            showWeekdayLabels={false}
            showTotalCount={false}
            // 失败时不要让整块板子崩掉，给一句能自己点的去处
            throwOnError={false}
            errorMessage="暂时取不到提交记录，可以直接去我的 GitHub 看。"
            labels={{
              months: [
                "1月", "2月", "3月", "4月", "5月", "6月",
                "7月", "8月", "9月", "10月", "11月", "12月",
              ],
              weekdays: ["日", "一", "二", "三", "四", "五", "六"],
              totalCount: "共 {{count}} 次提交",
              legend: { less: "少", more: "多" },
            }}
            theme={{
              dark: [
                // 0 级：可见的「空底板」，不是透明 —— 这是乐高隐喻的关键
                "#141a3d",
                "#2f5aa8",
                "#4478d0",
                "#7fb2ff",
                // 4 级：直接用展厅入口那块乐高黄，全站最高光的颜色
                "#ffcf00",
              ],
            }}
          />
        ) : (
          /* 占位框：高度和真日历接近，挂载后替换时不会跳版 */
          <div className="gh-heatmap-skeleton">正在读取提交记录…</div>
        )}
      </div>

      {/* 无障碍：图是纯视觉的，给读屏用户补一句文字事实 */}
      <p className="sr-only">
        {profile.name} 的 GitHub 公开提交热力图，展示最近 {WEEKS} 周的提交频率。
        数据可在 github.com/yanghao158640 查看。
      </p>
    </div>
  );
};

export default ContributionGraph;