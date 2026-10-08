"use client";

/**
 * 全站 3D 空间 —— 推门进入的八房大厅
 * ---------------------------------------------------------------------------
 * 页面上每一个区块 = 大厅里的一间房，8 间均分一圈（每 45° 一间）：
 *
 *   大厅 → 作品房 → 实践房 → 证书房 → 关于房 → 经历房 → 技能房 → 联系房
 *
 * 中央是八角门厅，8 扇门各挂一块房名牌（DOM 投影上去，中文清晰、键盘可聚焦）。
 * 点门或点房名牌 → 镜头先转向那扇门 → 门往房间里推开 → 走过去穿过门洞 →
 * 停在那间房外墙上的解说板前，板子 1:1 铺在正前方。
 *
 * 每个区块的正文就是那间房墙上的「解说板」—— DOM 里那块 .board，不是浮在
 * 页面上方的卡片。每帧把这块板在空间里的平面投影到屏幕上，再把
 * translate/scale 写回元素。所以正文只有一份：不会出现「正文和 3D 各显示
 * 一遍」的重影，中文清晰、可选中、可点、可被搜索。
 *
 * 导航不再是滚动：
 *   · 门厅里滚轮左右转，看清 8 扇门；
 *   · 站内所有指着房间的 # 锚点由本组件统一拦截（导航栏、Hero 按钮都能用）；
 *   · 命令面板走 lib/spatial.ts 的 enterRoom；
 *   · 房间里底部有「上一间 / 回到门厅 / 下一间」。
 *
 * 窄屏 / 系统开启「减少动态效果」/ 不支持 WebGL 时整层退回静态渐变，
 * 摘掉 html.spatial-on，区块回到普通文档流，页面照常可读可点、也能滚动。
 * ---------------------------------------------------------------------------
 */

import {
  Component,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { FaArrowLeft, FaArrowRight, FaDoorOpen } from "react-icons/fa6";

import { registerRoomEnter } from "@/lib/spatial";

/* ============================== 空间尺寸表 ============================== */

const SPACE_COLOR = "#05071f";

/** 解说板：DOM 里那块是 1000×600，在空间里高 5.8 个世界单位 */
const BOARD_PX_W = 1000;
const BOARD_PX_H = 600;
const BOARD_H = 5.8;
const BOARD_W = (BOARD_H * BOARD_PX_W) / BOARD_PX_H;

/** 相机视高 */
const EYE = 2.4;
/** 层高 */
const CEIL_H = 6.6;

/** 门厅：正八边形的内切半径。边长 ≈ 12.0，正好等于房宽，接缝才不会有缺口 */
const R_HUB = 14.5;
/** 房间宽度，和门厅的边长对齐 */
const ROOM_W = 12.0;
/** 房间外沿：从门厅墙往外 16 个单位 */
const R_OUT = 30.5;

/** 板面离圆心的距离，以及板底离地高度 */
const BOARD_R = R_OUT - 0.55;
const BOARD_BOTTOM = 0.5;
const BOARD_MID_Y = BOARD_BOTTOM + BOARD_H / 2;

/** 相机停靠点离圆心的距离。这个距离下 1000×600 投影出来接近 1:1 */
const DOCK_DIST = 10.1;
const DOCK_R = BOARD_R - DOCK_DIST;

/** 门洞尺寸 */
const DOOR_W = 3.4;
const DOOR_H = 4.3;
/** 房名牌：抬到门楣上方多高，以及在空间里做多高（世界单位） */
const PLATE_LIFT = 1.0;
const PLATE_WORLD_H = 0.82;

/** 门厅墙的边长（正八边形）。八边形外接半径要按这个反推，地面才和墙严丝合缝 */
const HUB_SIDE = 2 * R_HUB * Math.tan(Math.PI / 8);
const HUB_CIRCUM = R_HUB / Math.cos(Math.PI / 8);

/** 走一段路要多久、转身要多久 */
const WALK_SECONDS = 2.6;
const TURN_SECONDS = 0.7;

const COL = {
  floor: "#161d4d",
  hubFloor: "#1a2258",
  wall: "#141a44",
  ceil: "#121746",
  door: "#1b2461",
  frame: "#2f7ff0",
  stud: "#ffcf00",
};

/**
 * 8 间房。id 同时是 DOM 里 [data-board="…"] 的值，顺序必须和
 * app/page.tsx 里 8 个区块的顺序一致，否则房名会和墙上的正文对不上。
 * accent 也要和 globals.css 里 .board[data-board="…"] 的 --board-accent 保持一致。
 */
type Room = {
  id: string;
  label: string;
  accent: string;
  angle: number;
};

const ROOMS: Room[] = [
  { id: "hero", label: "大厅", accent: "#ffcf00" },
  { id: "projects", label: "作品房", accent: "#2f7ff0" },
  { id: "approach", label: "实践房", accent: "#ff8a00" },
  { id: "certs", label: "证书房", accent: "#00a3da" },
  { id: "about", label: "关于房", accent: "#b0e01a" },
  { id: "experience", label: "经历房", accent: "#e5007d" },
  { id: "skills", label: "技能房", accent: "#25a745" },
  { id: "contact", label: "联系房", accent: "#e3000b" },
].map((room, i) => ({ ...room, angle: (i * Math.PI * 2) / 8 }));

const roomIndex = (id: string) => ROOMS.findIndex((r) => r.id === id);

/** 镜头这一帧站在哪：0 = 门厅，1 = 停在该房板子前 */
type View = {
  progress: number;
  hubYaw: number;
  /** 正在走向哪间房；-1 表示在门厅 */
  target: number;
};

/* ---------------------------- 几个基础件 ---------------------------- */

const Slab = ({
  position,
  size,
  color,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
}) => (
  <mesh position={position}>
    <boxGeometry args={size} />
    <meshStandardMaterial color={color} roughness={0.9} metalness={0.02} flatShading />
  </mesh>
);

/** 顶上一颗凸点 —— 乐高的「stud」 */
const Stud = ({
  position,
  color,
}: {
  position: [number, number, number];
  color: string;
}) => (
  <mesh position={position}>
    <cylinderGeometry args={[0.16, 0.16, 0.14, 10]} />
    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} roughness={0.6} />
  </mesh>
);

/** 发光的细条：门框、腰线、地面导引线都用它 */
const GlowBar = ({
  position,
  size,
  color,
  dim = false,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  dim?: boolean;
}) => (
  <mesh position={position}>
    <boxGeometry args={size} />
    <meshStandardMaterial
      color={color}
      emissive={color}
      emissiveIntensity={dim ? 0.5 : 1.6}
      toneMapped={false}
    />
  </mesh>
);

/* ---------------------------- 门厅 ---------------------------- */

/**
 * 门厅：正八边形的地和顶，加上厅心的灯槽。
 * 八面墙由 8 个房间各自的门墙拼成（见 RoomShell），这里不重复建。
 */
const Hub = () => (
  <group>
    {/* 八角地面。用八棱柱而不是方块 —— 方块的四角会伸进房间里，
        和房间地板共面打架（z-fighting 闪烁）。 */}
    <mesh position={[0, -0.1, 0]} rotation={[0, Math.PI / 8, 0]}>
      <cylinderGeometry args={[HUB_CIRCUM, HUB_CIRCUM, 0.2, 8]} />
      <meshStandardMaterial color={COL.hubFloor} roughness={0.9} flatShading />
    </mesh>
    {/* 厅心的两圈地纹，一眼看出这是个门厅 */}
    <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[4.2, 4.42, 64]} />
      <meshBasicMaterial color="#ffcf00" toneMapped={false} />
    </mesh>
    <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[9.0, 9.16, 64]} />
      <meshBasicMaterial color="#3a4790" toneMapped={false} />
    </mesh>
    {/* 八角顶 */}
    <mesh position={[0, CEIL_H, 0]} rotation={[0, Math.PI / 8, 0]}>
      <cylinderGeometry args={[HUB_CIRCUM, HUB_CIRCUM, 0.2, 8]} />
      <meshStandardMaterial color={COL.ceil} roughness={0.95} flatShading />
    </mesh>
    {/* 厅心的顶灯 */}
    <mesh position={[0, CEIL_H - 0.16, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[1.6, 2.6, 40]} />
      <meshBasicMaterial color="#c8d4ff" toneMapped={false} />
    </mesh>
  </group>
);

/* ---------------------------- 一间房 ---------------------------- */

/**
 * 一个房间：门厅那面带门洞的墙 + 房间外壳 + 尽头墙上的板框。
 * 整个 group 绕 y 轴转到自己的方位角上，局部 +z 就是「由厅心指向外」——
 * 注意朝门厅是 −z，门扇上的把手和灯条都得放在负侧，否则会被门扇自己挡住。
 */
const RoomShell = ({ room }: { room: Room }) => {
  const segW = (HUB_SIDE - DOOR_W) / 2;
  const segX = DOOR_W / 2 + segW / 2;
  const zc = (R_HUB + R_OUT) / 2;
  const zl = R_OUT - R_HUB;

  return (
    <group rotation={[0, room.angle, 0]}>
      {/* 门厅这面墙：左右两段 + 门楣，中间是门洞。
          墙面一律不给 accent 自发光 —— 高饱和的强调色一旦大面积铺在墙上，
          深蓝底会被染成土黄，像旧墙皮。颜色只留在灯条上做点缀。 */}
      {[-1, 1].map((s) => (
        <Slab
          key={s}
          position={[s * segX, CEIL_H / 2, R_HUB]}
          size={[segW, CEIL_H, 0.6]}
          color={COL.wall}
        />
      ))}
      <Slab
        position={[0, DOOR_H + (CEIL_H - DOOR_H) / 2, R_HUB]}
        size={[DOOR_W, CEIL_H - DOOR_H, 0.6]}
        color={COL.wall}
      />
      {/* 门框发光条 */}
      <GlowBar
        position={[-DOOR_W / 2, DOOR_H / 2, R_HUB - 0.34]}
        size={[0.12, DOOR_H, 0.12]}
        color={COL.frame}
      />
      <GlowBar
        position={[DOOR_W / 2, DOOR_H / 2, R_HUB - 0.34]}
        size={[0.12, DOOR_H, 0.12]}
        color={COL.frame}
      />
      <GlowBar
        position={[0, DOOR_H, R_HUB - 0.34]}
        size={[DOOR_W, 0.12, 0.12]}
        color={COL.frame}
      />
      {/* 门槛：一道横在门口的亮线，指明从这儿进 */}
      <GlowBar position={[0, 0.03, R_HUB]} size={[DOOR_W, 0.06, 0.5]} color={COL.stud} />
      {[-1.2, 0, 1.2].map((x) => (
        <Stud key={x} position={[x, CEIL_H + 0.12, R_HUB]} color={COL.stud} />
      ))}

      {/* 房间的地、顶、两侧墙、尽头墙 */}
      <Slab position={[0, -0.1, zc]} size={[ROOM_W, 0.2, zl]} color={COL.floor} />
      <Slab position={[0, CEIL_H, zc]} size={[ROOM_W, 0.2, zl]} color={COL.ceil} />
      {[-1, 1].map((s) => (
        <Slab
          key={s}
          position={[(s * ROOM_W) / 2 + s * 0.3, CEIL_H / 2, zc]}
          size={[0.6, CEIL_H, zl]}
          color={COL.wall}
        />
      ))}
      <Slab
        position={[0, CEIL_H / 2, R_OUT + 0.3]}
        size={[ROOM_W, CEIL_H, 0.6]}
        color={COL.wall}
      />
      {/* 房间顶上的灯槽 */}
      {[-3.4, 3.4].map((x) => (
        <GlowBar
          key={x}
          position={[x, CEIL_H - 0.12, zc]}
          size={[0.1, 0.06, zl - 3]}
          color="#5a6bb5"
          dim
        />
      ))}
      {/* 地面导引线：从门口铺到板子前 */}
      <GlowBar
        position={[0, 0.012, R_HUB + 6]}
        size={[0.09, 0.03, zl - 5]}
        color={room.accent}
      />
      <mesh position={[0, 0.015, R_HUB + 7.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.4, 3.56, 44]} />
        <meshBasicMaterial color={room.accent} toneMapped={false} />
      </mesh>

      {/* 尽头墙上的色带 + 凸点，标出这间房的颜色 */}
      <GlowBar
        position={[0, 5.95, R_OUT + 0.04]}
        size={[ROOM_W - 2.4, 0.13, 0.08]}
        color={room.accent}
      />
      {[-3.4, 0, 3.4].map((x) => (
        <Stud key={x} position={[x, CEIL_H + 0.12, R_OUT + 0.1]} color={room.accent} />
      ))}

      {/* 解说板的板框与底座：DOM 那块板就贴在这一层上 */}
      <mesh position={[0, BOARD_MID_Y, BOARD_R - 0.2]}>
        <boxGeometry args={[BOARD_W + 0.4, BOARD_H + 0.4, 0.3]} />
        <meshStandardMaterial
          color={room.accent}
          emissive={room.accent}
          emissiveIntensity={0.32}
          roughness={0.85}
          flatShading
        />
      </mesh>
      <Slab
        position={[0, BOARD_BOTTOM / 2, BOARD_R - 0.2]}
        size={[BOARD_W + 1.1, BOARD_BOTTOM, 1.4]}
        color="#141a44"
      />
    </group>
  );
};

/**
 * 门扇。铰链在门洞左边，开度由外部每帧写进来 ——
 * 跟着镜头位置走，不是跟着「点没点」走，这样才有「推开」的过程。
 */
const Door = ({
  room,
  openness,
  onEnter,
}: {
  room: Room;
  openness: React.MutableRefObject<number[]>;
  onEnter: (index: number) => void;
}) => {
  const index = roomIndex(room.id);
  const ref = useRef<THREE.Group>(null);

  useFrame(() => {
    if (ref.current) {
      const open = openness.current[index] ?? 0;
      /* 负角才是往房间那一侧推开。铰链在局部 x=0、门扇朝 +x 展开，而局部 +z
         是「朝外」；绕 y 转 θ 会把自由端送到 −dx·sinθ 的 z 上 —— 取正角会
         推向门厅，正好撞上进门的访客。 */
      ref.current.rotation.y = -open * THREE.MathUtils.degToRad(96);
    }
  });

  return (
    <group rotation={[0, room.angle, 0]}>
      <group position={[-DOOR_W / 2, 0, R_HUB]} ref={ref}>
        <mesh
          position={[DOOR_W / 2, DOOR_H / 2, 0]}
          onClick={(e) => {
            e.stopPropagation();
            onEnter(index);
          }}
          onPointerOver={() => (document.body.style.cursor = "pointer")}
          onPointerOut={() => (document.body.style.cursor = "")}
        >
          <boxGeometry args={[DOOR_W - 0.12, DOOR_H - 0.08, 0.18]} />
          <meshStandardMaterial
            color={COL.door}
            emissive={room.accent}
            /* 只留一丝自发光。给足会把整扇门染成强调色，看着不像门、像一堵墙 */
            emissiveIntensity={0.05}
            roughness={0.82}
            flatShading
          />
        </mesh>
        {/* 门扇上下两道本色描边，让「这是一扇门」一眼成立 */}
        <GlowBar
          position={[DOOR_W / 2, DOOR_H - 0.14, -0.12]}
          size={[DOOR_W - 0.4, 0.06, 0.05]}
          color={room.accent}
          dim
        />
        <GlowBar
          position={[DOOR_W / 2, 0.16, -0.12]}
          size={[DOOR_W - 0.4, 0.06, 0.05]}
          color={room.accent}
          dim
        />
        {/* 门把手：装在 −z（朝门厅）这一侧，来客才看得见 */}
        <mesh position={[DOOR_W - 0.58, 1.95, -0.24]}>
          <boxGeometry args={[0.16, 0.62, 0.16]} />
          <meshStandardMaterial
            color={COL.stud}
            emissive={COL.stud}
            emissiveIntensity={2.2}
            toneMapped={false}
          />
        </mesh>
        {/* 门面上一道竖灯，用这间房的颜色 */}
        <GlowBar
          position={[DOOR_W / 2, DOOR_H / 2, -0.14]}
          size={[0.07, DOOR_H - 1.6, 0.05]}
          color={room.accent}
        />
      </group>
    </group>
  );
};

/* ---------------------------- 相机 ---------------------------- */

/**
 * 相机。门厅里站在厅心按 hubYaw 朝外看；走进房间时沿着自己的方位角直着往外走。
 * 位置一律由 (progress, target, hubYaw) 决定，没有自由漫游 —— 这样任何时刻
 * 都能算出确定的位置，不会出现「走到一半卡住」。
 */
const Rig = ({ view }: { view: React.MutableRefObject<View> }) => {
  const { camera } = useThree();
  const look = useRef(new THREE.Vector3(0, 2.2, R_HUB));
  const want = useRef(new THREE.Vector3());
  const dir = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    const v = view.current;

    if (v.target < 0) {
      camera.position.set(0, EYE, 0);
      dir.current.set(Math.sin(v.hubYaw), 0, Math.cos(v.hubYaw));
      want.current.copy(camera.position).addScaledVector(dir.current, R_HUB);
      want.current.y = DOOR_H * 0.42;
    } else {
      const room = ROOMS[v.target];
      dir.current.set(Math.sin(room.angle), 0, Math.cos(room.angle));
      const r = THREE.MathUtils.lerp(0, DOCK_R, v.progress);
      camera.position.set(dir.current.x * r, EYE, dir.current.z * r);

      // 先看门，穿过去之后改看板子 —— 视线也要跟着走
      const doorY = DOOR_H * 0.42;
      want.current.copy(dir.current).multiplyScalar(R_HUB);
      want.current.y = doorY;
      const boardPos = dir.current.clone().multiplyScalar(BOARD_R);
      boardPos.y = BOARD_MID_Y;
      want.current.lerp(
        boardPos,
        THREE.MathUtils.smoothstep(v.progress, 0.62, 0.92)
      );
    }

    // 视线本身也缓一下，免得穿过门那一瞬镜头猛地一抬头
    look.current.lerp(want.current, 1 - Math.pow(0.0025, delta));
    camera.lookAt(look.current);
  });

  return null;
};

type Stage = {
  el: HTMLElement | null;
  baseLeft: number;
  baseTop: number;
  alpha: number;
};

/**
 * 把 8 块解说板摆进各自的房间。
 * 每帧把板心的世界坐标投影到屏幕，再用板顶的投影反推 scale，写回
 * translate3d + scale。只有当前这间房的板子会淡入 ——
 * 否则会看到 8 块板同时糊在屏幕上。
 */
const Boards = ({
  view,
  stages,
  painted,
}: {
  view: React.MutableRefObject<View>;
  stages: React.MutableRefObject<Stage[]>;
  painted: React.MutableRefObject<boolean>;
}) => {
  const proj = useRef(new THREE.Vector3());
  const edge = useRef(new THREE.Vector3());
  const world = useRef(new THREE.Vector3());

  useFrame(({ camera, size }) => {
    const v = view.current;

    ROOMS.forEach((room, i) => {
      const s = stages.current[i];
      const el = s?.el;
      if (!el) return;

      // 只有「正在走向的这间」、且已经走进去大半时，板子才露面
      const wanted =
        v.target === i ? THREE.MathUtils.smoothstep(v.progress, 0.6, 0.95) : 0;
      // 收的时候比放的时候快一点，避免换房时两块板同时可见
      s.alpha += (wanted - s.alpha) * (wanted > s.alpha ? 0.12 : 0.28);

      if (s.alpha < 0.02) {
        if (el.style.visibility !== "hidden") {
          el.style.visibility = "hidden";
          el.style.pointerEvents = "none";
        }
        return;
      }

      world.current.set(
        Math.sin(room.angle) * BOARD_R,
        BOARD_MID_Y,
        Math.cos(room.angle) * BOARD_R
      );

      proj.current.copy(world.current).project(camera);
      const cx = (proj.current.x * 0.5 + 0.5) * size.width;
      const cy = (-proj.current.y * 0.5 + 0.5) * size.height;

      // 用板子上沿的投影反推缩放：世界里的高度 ↔ DOM 里的像素高度
      edge.current.copy(world.current);
      edge.current.y += BOARD_H / 2;
      edge.current.project(camera);
      const heightPx =
        Math.abs(cy - (-edge.current.y * 0.5 + 0.5) * size.height) * 2;
      const scale = heightPx / BOARD_PX_H;

      // DOM 那块板躺在 .stage 左上角，算出它到目标位置的位移
      const dx = cx - (s.baseLeft + BOARD_PX_W / 2);
      const dy = cy - (s.baseTop + BOARD_PX_H / 2);

      el.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(
        1
      )}px, 0) scale(${scale.toFixed(4)})`;
      el.style.opacity = s.alpha.toFixed(3);
      el.style.visibility = "visible";
      el.style.pointerEvents = "auto";
    });

    painted.current = true;
  });

  return null;
};

/**
 * 房名牌：8 块真实 DOM 按钮，每帧被投影到各自门洞的上方。
 * 用 DOM 而不是 3D 文字，是因为中文字形在 3D 里要么糊、要么得额外加载字体；
 * 而且做成按钮之后键盘 Tab 也能走到，不会把键盘用户锁在门厅里。
 */
const Plates = ({
  view,
  plates,
  sizes,
  onEnter,
}: {
  view: React.MutableRefObject<View>;
  plates: React.MutableRefObject<(HTMLElement | null)[]>;
  sizes: React.MutableRefObject<number[]>;
  onEnter: (index: number) => void;
}) => {
  const proj = useRef(new THREE.Vector3());
  const unit = useRef(new THREE.Vector3());
  const fwd = useRef(new THREE.Vector3());
  const world = useRef(new THREE.Vector3());
  const dir = useRef(new THREE.Vector3());

  useFrame(({ camera, size }) => {
    const v = view.current;
    camera.getWorldDirection(fwd.current);

    ROOMS.forEach((room, i) => {
      const el = plates.current[i];
      if (!el) return;

      dir.current.set(Math.sin(room.angle), 0, Math.cos(room.angle));
      world.current.copy(dir.current).multiplyScalar(R_HUB);
      world.current.y = DOOR_H + PLATE_LIFT;

      // 只在门厅里、且这扇门确实在镜头前方时显示。
      // 不做这层剔除的话，背后那几扇门的牌子会翻过来糊在屏幕上。
      const toDoor = world.current.clone().sub(camera.position).normalize();
      const facing = toDoor.dot(fwd.current);
      const inHub = v.target < 0 && v.progress <= 0.02;
      const alpha = inHub
        ? THREE.MathUtils.smoothstep(facing, 0.42, 0.72)
        : 0;

      const prev = Number(el.dataset.alpha ?? "0");
      const next = prev + (alpha - prev) * 0.16;
      el.dataset.alpha = String(next);
      el.style.opacity = next.toFixed(3);
      el.style.visibility = next < 0.02 ? "hidden" : "visible";
      el.style.pointerEvents = next < 0.5 ? "none" : "auto";

      if (next < 0.02) return;

      proj.current.copy(world.current).project(camera);
      const cx = (proj.current.x * 0.5 + 0.5) * size.width;
      const cy = (-proj.current.y * 0.5 + 0.5) * size.height;

      /* 缩放要按「屏幕上 1 个世界单位 = 多少 CSS 像素」来算，再乘上牌子在
         世界里的目标高度，最后除以它自己的像素高度。这里最容易错的是拿世界
         单位当像素用 —— 那样牌子会被放大上百倍，直接糊满屏幕把 3D 盖住。 */
      unit.current.copy(world.current);
      unit.current.y += 1;
      unit.current.project(camera);
      const pxPerUnit = Math.abs(
        cy - (-unit.current.y * 0.5 + 0.5) * size.height
      );
      const platePx = sizes.current[i] || 44;
      const scale = (pxPerUnit * PLATE_WORLD_H) / platePx;

      el.style.transform = `translate(-50%, -50%) translate(${cx.toFixed(
        1
      )}px, ${cy.toFixed(1)}px) scale(${scale.toFixed(3)})`;
    });
  });

  return null;
};

/* ---------------------------- 空间内容 ---------------------------- */

const Hall = ({
  view,
  stages,
  plates,
  sizes,
  openness,
  painted,
  onEnter,
}: {
  view: React.MutableRefObject<View>;
  stages: React.MutableRefObject<Stage[]>;
  plates: React.MutableRefObject<(HTMLElement | null)[]>;
  sizes: React.MutableRefObject<number[]>;
  openness: React.MutableRefObject<number[]>;
  painted: React.MutableRefObject<boolean>;
  onEnter: (index: number) => void;
}) => (
  <>
    <color attach="background" args={[SPACE_COLOR]} />
    <fog attach="fog" args={[SPACE_COLOR, 34, 78]} />

    <ambientLight intensity={0.85} color="#93a4ff" />
    <hemisphereLight args={["#6a7bd0", "#0a0e28", 0.55]} />
    <directionalLight position={[-10, 16, 9]} intensity={0.35} color="#ffffff" />

    {/* 点光源一律 decay={0}：three 现在用物理正确的衰减，按平方反比算的话，
        门厅半径 14.5 处的照度只有 3 单位处的 1/23，灯得开到几百才够亮。 */}
    <pointLight
      position={[0, CEIL_H - 0.6, 0]}
      intensity={2.4}
      distance={42}
      decay={0}
      color="#cdd8ff"
    />
    {ROOMS.map((room) => (
      <pointLight
        key={room.id}
        position={[
          Math.sin(room.angle) * (R_HUB + 7),
          5.6,
          Math.cos(room.angle) * (R_HUB + 7),
        ]}
        intensity={1.7}
        distance={22}
        decay={0}
        color={room.accent}
      />
    ))}

    <Hub />
    {ROOMS.map((room) => (
      <RoomShell key={room.id} room={room} />
    ))}
    {ROOMS.map((room) => (
      <Door key={room.id} room={room} openness={openness} onEnter={onEnter} />
    ))}

    <Rig view={view} />
    <Boards view={view} stages={stages} painted={painted} />
    <Plates view={view} plates={plates} sizes={sizes} onEnter={onEnter} />
  </>
);

/* ---------------------------- 门槛判定 ---------------------------- */

/** 判断能不能跑 WebGL，探测用的上下文用完立刻释放，别白占一个名额 */
const detectWebGL = () => {
  try {
    const probe = document.createElement("canvas");
    const gl = probe.getContext("webgl2") || probe.getContext("webgl");
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
};

/* ------------------------------ 对外组件 ------------------------------ */

/**
 * 显卡驱动异常 / 上下文耗尽时 Canvas 会抛错，
 * 兜住它免得整个页面跟着白屏，出问题就退回静态渐变。
 */
class SceneErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

const Scene3D = () => {
  const [supported, setSupported] = useState(false);
  const [broken, setBroken] = useState(false);
  /** 已经站定的房间；null = 还在门厅 */
  const [here, setHere] = useState<number | null>(null);
  const [walking, setWalking] = useState(false);

  const view = useRef<View>({ progress: 0, hubYaw: 0, target: -1 });
  const openness = useRef<number[]>(ROOMS.map(() => 0));
  const walk = useRef({
    active: false,
    phase: "turn" as "turn" | "walk",
    t: 0,
    from: 0,
    to: 0,
    toRoom: -1,
    yawFrom: 0,
    yawTarget: 0,
  });

  const stages = useRef<Stage[]>(
    ROOMS.map(() => ({ el: null, baseLeft: 0, baseTop: 0, alpha: 0 }))
  );
  const plates = useRef<(HTMLElement | null)[]>(ROOMS.map(() => null));
  /** 每块房名牌自身的像素高度，投影时要用它反推缩放 */
  const sizes = useRef<number[]>(ROOMS.map(() => 44));
  /** 渲染循环有没有真的跑起来（跑不起来就得退回普通排版） */
  const painted = useRef(false);
  const shade = useRef<HTMLDivElement>(null);

  const showScene = supported && !broken;

  /* 量 8 块解说板的布局位置。transform 先清掉再量，否则量到的是上一帧的结果 */
  const measure = useCallback(() => {
    ROOMS.forEach((room, i) => {
      const el = document.querySelector<HTMLElement>(`[data-board="${room.id}"]`);
      if (!el) return;
      el.style.transform = "none";
      const r = el.getBoundingClientRect();
      stages.current[i].el = el;
      stages.current[i].baseLeft = r.left;
      stages.current[i].baseTop = r.top;
    });
    plates.current.forEach((el, i) => {
      if (el?.offsetHeight) sizes.current[i] = el.offsetHeight;
    });
  }, []);

  /* 门槛：窗口够大、比例够宽、没关动效、取得到 WebGL。
     必须监听变化，不能只算一次 —— 否则把窗口从宽拖窄，3D 会赖着不走。 */
  useEffect(() => {
    const wideScreen = window.matchMedia("(min-width: 1024px)");
    const tallScreen = window.matchMedia("(min-height: 600px)");
    const wideRatio = window.matchMedia("(min-aspect-ratio: 13/10)");
    const calmMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const sync = () => {
      const why: string[] = [];
      if (!wideScreen.matches)
        why.push(`窗口太窄（${window.innerWidth}px，至少要 1024）`);
      if (!tallScreen.matches)
        why.push(`窗口太矮（${window.innerHeight}px，至少要 600）`);
      if (!wideRatio.matches) why.push("窗口太接近方形（宽高比要 ≥ 1.3）");
      if (calmMotion.matches) why.push("系统开了「减少动态效果」");
      if (why.length === 0 && !detectWebGL()) why.push("浏览器取不到 WebGL");

      if (why.length) {
        // 留一行日志：出问题时按 F12 就能看到究竟卡在哪一条
        console.info(`[空间模式] 已退回普通排版 —— ${why.join("、")}`);
      }
      setSupported(why.length === 0);
    };

    sync();
    [wideScreen, tallScreen, wideRatio, calmMotion].forEach((q) =>
      q.addEventListener("change", sync)
    );
    window.addEventListener("resize", sync);
    return () => {
      [wideScreen, tallScreen, wideRatio, calmMotion].forEach((q) =>
        q.removeEventListener("change", sync)
      );
      window.removeEventListener("resize", sync);
    };
  }, []);

  /** 走进第 index 间房 */
  const enter = useCallback((index: number) => {
    if (index < 0 || index >= ROOMS.length) return;
    const v = view.current;
    if (v.target === index && v.progress > 0.9) return;

    // 已经在别的房间里：先把在这间的进度收掉，再由本轮行走接管
    const w = walk.current;
    w.active = true;
    w.phase = "turn";
    w.t = 0;
    w.from = 0;
    w.to = 1;
    w.toRoom = index;
    w.yawFrom = v.hubYaw;
    w.yawTarget = ROOMS[index].angle;
    setWalking(true);
    setHere(null);
  }, []);

  /** 回到门厅 */
  const leave = useCallback(() => {
    const v = view.current;
    const w = walk.current;
    // 记住刚才那扇门的方向，回到门厅时就不用再转一次头
    const yaw = v.target >= 0 ? ROOMS[v.target].angle : v.hubYaw;
    w.active = true;
    w.phase = "walk";
    w.t = 0;
    w.from = v.progress;
    w.to = 0;
    w.toRoom = -1;
    w.yawFrom = yaw;
    w.yawTarget = yaw;
    v.target = -1;
    v.hubYaw = yaw;
    setWalking(true);
    setHere(null);
  }, []);

  /** 上一间 / 下一间 */
  const step = useCallback(
    (delta: number) => {
      const current = view.current.target;
      const from = current < 0 ? 0 : current;
      enter((from + delta + ROOMS.length) % ROOMS.length);
    },
    [enter]
  );

  /* 把导航权交出去：站内所有指着房间的 # 锚点、以及命令面板，都走 enterRoom */
  useEffect(() => {
    if (!showScene) return;
    return registerRoomEnter((roomId) => {
      const index = roomIndex(roomId);
      if (index >= 0) enter(index);
    });
  }, [showScene, enter]);

  /* spatial-on：板子脱离文档流，交给下面的投影脚本摆位。
     同时锁住滚动 —— 滚动已经不是导航手段，留着它只会让板子漂走。 */
  useEffect(() => {
    if (!showScene) return;
    document.documentElement.classList.add("spatial-on");
    measure();

    return () => {
      document.documentElement.classList.remove("spatial-on");
      stages.current.forEach((s) => {
        if (!s.el) return;
        s.el.style.visibility = "";
        s.el.style.transform = "";
        s.el.style.opacity = "";
        s.el.style.pointerEvents = "";
      });
      if (shade.current) shade.current.style.opacity = "";
      painted.current = false;
      view.current = { progress: 0, hubYaw: 0, target: -1 };
      setHere(null);
    };
  }, [showScene, measure]);

  /* 拦截站内所有指着房间的 # 锚点 ——
     导航栏、Hero 的「看看我的作品」都是这种链接，统一在这里转成「进门」，
     页面里各处的链接就一行都不用改。 */
  useEffect(() => {
    if (!showScene) return;
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest?.('a[href^="#"]') as HTMLAnchorElement | null;
      if (!anchor) return;
      const id = anchor.getAttribute("href")!.slice(1);
      const index = roomIndex(id);
      if (index < 0) return;
      // 捕获阶段就拦掉，并且不让事件继续冒泡 ——
      // 导航栏用的是 next/link，它自己也会处理这个 # 锚点去滚动，
      // 不拦住的话两边会同时动手。
      event.preventDefault();
      event.stopPropagation();
      enter(index);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [showScene, enter]);

  /* 主循环：转身 → 行走 → 门扇开合 */
  useEffect(() => {
    if (!showScene) return;
    let raf = 0;
    let last = 0;

    const tick = () => {
      const now = performance.now();
      // 用真实间隔推进，掉帧时不会变慢；上限 50ms 防止切回标签页时一次跳完
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 1 / 60);
      last = now;

      const v = view.current;
      const w = walk.current;

      if (w.active) {
        if (w.phase === "turn") {
          /* 先转身面对门，再往前走。不这么做的话，从门厅任意朝向一步跨出去，
             视线会猛地甩过来。 */
          w.t = Math.min(1, w.t + dt / TURN_SECONDS);
          const e = 1 - Math.pow(1 - w.t, 3);
          v.hubYaw = w.yawFrom + (w.yawTarget - w.yawFrom) * e;
          if (w.t >= 1) {
            w.phase = "walk";
            w.t = 0;
            v.target = w.toRoom;
            v.hubYaw = w.yawTarget;
          }
        } else {
          /* 行走用「时间」推进，不用指数逼近 —— 后者一开始冲得极快，
             门刚开一条缝人已经贴上去了，完全不像走路。 */
          w.t = Math.min(1, w.t + dt / WALK_SECONDS);
          const t = w.t;
          // easeInOutCubic：起步慢、中段快、收尾稳稳停住
          const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
          v.progress = w.from + (w.to - w.from) * e;
          if (t >= 1) {
            w.active = false;
            setWalking(false);
            setHere(w.toRoom >= 0 ? w.toRoom : null);
          }
        }
      } else if (v.target < 0) {
        v.progress = 0;
      } else {
        v.progress = 1;
      }

      /* 门扇开度由「走到哪了」决定，不由「点没点」决定 ——
         否则门会瞬间弹开，等于没有「推开」这个动作。
         起点压到 0.04，点击后立刻能看到门动，不至于以为按钮没生效。 */
      ROOMS.forEach((_, i) => {
        const relevant = w.active && w.phase === "walk" && w.toRoom === i
          ? v.progress
          : v.target === i
          ? v.progress
          : 0;
        const want = THREE.MathUtils.smoothstep(relevant, 0.04, 0.36);
        openness.current[i] += (want - openness.current[i]) * 0.12;
      });

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [showScene]);

  /* 门厅里滚轮转向；房间里按 Esc 退回门厅 */
  useEffect(() => {
    if (!showScene) return;
    const onWheel = (event: WheelEvent) => {
      const v = view.current;
      if (v.target >= 0 || walk.current.active) return;
      event.preventDefault();
      v.hubYaw += event.deltaY * 0.0016;
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && view.current.target >= 0) leave();
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
    };
  }, [showScene, leave]);

  /* 渲染循环万一没跑起来（显卡抽风），把空间模式撤掉，别让正文一直藏着 */
  useEffect(() => {
    if (!showScene) return;
    const guard = window.setTimeout(() => {
      if (!painted.current) setBroken(true);
    }, 3000);
    return () => window.clearTimeout(guard);
  }, [showScene]);

  return (
    <>
      <div
        aria-hidden="true"
        className="fixed inset-0 z-0 overflow-hidden"
        style={{
          background: `radial-gradient(120% 90% at 50% 8%, #141034 0%, #06071f 45%, ${SPACE_COLOR} 100%)`,
        }}
      >
        {showScene && (
          <SceneErrorBoundary>
            <Canvas
              dpr={[1, 1.75]}
              gl={{ antialias: true, powerPreference: "high-performance" }}
              camera={{ position: [0, EYE, 0], fov: 45, near: 0.1, far: 260 }}
              onCreated={({ gl }) => {
                // 上下文丢了就直接撤掉 3D，别让页面卡在一张黑画布上
                gl.domElement.addEventListener("webglcontextlost", (event) => {
                  event.preventDefault();
                  setBroken(true);
                });
              }}
            >
              <Hall
                view={view}
                stages={stages}
                plates={plates}
                sizes={sizes}
                openness={openness}
                painted={painted}
                onEnter={enter}
              />
            </Canvas>
          </SceneErrorBoundary>
        )}

        {/* 四周压暗一点：解说板是主角，空间只做背景 */}
        <div
          ref={shade}
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 78% 62% at 50% 52%, rgba(0,3,25,0.5) 0%, rgba(0,3,25,0.24) 55%, rgba(0,3,25,0.5) 100%)",
          }}
        />
      </div>

      {/* 交互层：房名牌、门厅提示、房间导航。
          必须放在上面那层（z-0，自成层叠上下文）之外，才能压在正文（z-10）之上。 */}
      {showScene && (
        <div className="hall-ui fixed inset-0 z-20">
          {ROOMS.map((room, i) => (
            <button
              key={room.id}
              type="button"
              ref={(el) => {
                plates.current[i] = el;
              }}
              className="hall-plate"
              style={{ ["--plate-accent" as string]: room.accent }}
              onClick={() => enter(i)}
              aria-label={`推门进入${room.label}`}
            >
              <span className="hall-plate-no">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="hall-plate-name">{room.label}</span>
            </button>
          ))}

          {/* 门厅提示：只在门厅里显示 */}
          <div className="hall-hint" data-hidden={walking || here !== null}>
            <span className="hall-hint-line">
              滚轮左右转一圈看看，点门上的房名进去
            </span>
            <button
              type="button"
              className="hall-door-btn"
              onClick={() => enter(1)}
            >
              <FaDoorOpen />
              直接进 · 作品房
            </button>
          </div>

          {/* 房间里的门牌导航 */}
          {here !== null && !walking && (
            <div className="hall-nav">
              <button type="button" className="hall-nav-btn" onClick={() => step(-1)}>
                <FaArrowLeft className="me-1.5" />
                上一间
              </button>
              <button
                type="button"
                className="hall-nav-btn hall-nav-btn--back"
                onClick={leave}
              >
                回到门厅
              </button>
              <span className="hall-nav-label">
                {here + 1} / {ROOMS.length} · {ROOMS[here].label}
              </span>
              <button type="button" className="hall-nav-btn" onClick={() => step(1)}>
                下一间
                <FaArrowRight className="ms-1.5" />
              </button>
            </div>
          )}

          {walking && (
            <div className="hall-nav">
              <span className="hall-nav-label">正在前往…</span>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default Scene3D;
