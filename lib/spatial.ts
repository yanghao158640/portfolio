/**
 * 空间导航桥
 * ---------------------------------------------------------------------------
 * 站内到处都有指着房间的链接（导航栏、Hero 的「看看我的作品」、命令面板），
 * 它们原本靠 `href="#projects"` 滚动过去。换成推门进房间之后，滚动不再是
 * 导航手段，这些入口需要改走「进门」这条路。
 *
 * 用一个模块级的注册点来打通，而不是把 state 提上去、再一层层往下传：
 *   · 3D 层挂载时把 enterRoom 注册进来；
 *   · 站内的 # 锚点由 3D 层统一拦截，所以导航栏、Hero 按钮都不用改；
 *   · 命令面板是程序化调用，直接 import 本文件即可。
 *
 * 3D 层没挂载时（窄屏 / 减少动效 / 没有 WebGL），自动退回滚动 —— 也就是
 * 原来的行为，什么都不用特判。
 * ---------------------------------------------------------------------------
 */

type EnterFn = (roomId: string) => void;

let registered: EnterFn | null = null;

/** 3D 层挂载时注册；返回一个注销函数，卸载时调用 */
export const registerRoomEnter = (fn: EnterFn) => {
  registered = fn;
  return () => {
    if (registered === fn) registered = null;
  };
};

/**
 * 去某个房间。id 是区块 id（projects / certs / …）。
 * 有 3D 层就走进门动画；没有就滚过去，保证任何情况下这个入口都有效。
 */
export const enterRoom = (roomId: string) => {
  if (registered) {
    registered(roomId);
    return;
  }
  document
    .querySelector(`#${roomId}`)
    ?.scrollIntoView({ behavior: "smooth", block: "center" });
};

/** 有没有 3D 层在接管导航（给需要区分行为的调用方用） */
export const hasSpatialLayer = () => registered !== null;
