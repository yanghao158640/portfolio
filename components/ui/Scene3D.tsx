"use client";

/**
 * 全站 3D 空间 —— 环形旋转展厅
 * ---------------------------------------------------------------------------
 * 页面上每一个区块 = 圆厅里沿墙排布的一个展位，8 个展位均分一圈（每 45° 一格）：
 *
 *   入口展位 → 作品 → 实践 → 证书 → 关于 → 经历 → 技能 → 联系
 *
 * 每个展位正对圆心立着一台「解说板」——那就是这个区块的正文本身（DOM 里那块
 * .board）。它不是浮在页面上方的卡片，而是摆进圆厅的一件陈设：每帧把这块板在
 * 空间里的平面投影到屏幕上，再把 translate/scale 写回元素。
 *
 * 相机站在比板子更靠里的轨道上、面朝外，滚动时沿着圆环转过去 —— 所以整站是
 * 「转」着看完的：外墙色带、隔墙、地面同心环依次从身边扫过，转得快时机身轻轻
 * 侧倾一下，像坐旋转木马。落位时相机正好停在那间展位正前方、视线锁着板心，
 * 板子的投影是 1:1 —— 字就是设计时的大小，而且纹丝不动地居中。
 *
 * 这样做的好处：正文只有一份，不会出现「正文和 3D 各显示一遍」的重影；
 * 中文清晰、可选中、可点、可被搜索，同时又确实活在空间里。
 *
 * 窄屏 / 系统开启「减少动态效果」/ 不支持 WebGL 时整层退回静态渐变，
 * 摘掉 html.spatial-on，区块回到普通文档流，页面照常可读可点。
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
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/* ============================== 空间尺寸表 ============================== */

const SPACE_COLOR = "#05071f";

/** 相机站在地面上的视高，圆厅地面统一在 y = 0 */
const EYE = 2.2;

/** 圆厅层高 */
const ROOM_H = 10;

/** 解说板：DOM 里那块是 1000×600，在空间里高 5.8 个世界单位 */
const BOARD_PX_W = 1000;
const BOARD_PX_H = 600;
const BOARD_H = 5.8;
const BOARD_W = (BOARD_H * BOARD_PX_W) / BOARD_PX_H;
/** 板子底边离地高度，以及板心的世界 y */
const BOARD_BOTTOM = 0.35;
const BOARD_MID_Y = BOARD_BOTTOM + BOARD_H / 2;
/** 相机停靠点到解说板的距离。这个距离下 1000×600 正好 1:1 铺满屏幕中间区域
    （相机在 2.2 处抬着头看板心，投影略小于正视，所以比 10.5 稍近一点） */
const BOARD_DIST = 10.1;

/**
 * 圆厅半径表。板子贴在 R_BOARD 这一圈上：板面与圆相切、正面朝里对着圆心，
 * 相机在更靠里的 R_CAM 轨道上朝外看它。
 */
const R_BOARD = 26;
/** 外墙 */
const R_OUTER = 30.2;
/** 中央立柱，圆厅的「圆心」 */
const R_HUB = 7;
/** 隔墙内端半径：从板子往里伸出来的短墙，把一圈分成 8 个展位 */
const R_DIV_IN = R_BOARD - 4.2;

/** 8 个展位均分一圈 */
const RING_STEP = (Math.PI * 2) / 8;

/** 相机轨道半径：板子往里 BOARD_DIST 处。随视口高低变的是 BOARD_DIST，圆厅本身不动 */
const R_CAM = R_BOARD - BOARD_DIST;

const WALL_COLOR = "#0c1130";
const FLOOR_COLOR = "#0a0e28";
const HUB_COLOR = "#151c46";
const TILE_COLOR = "#0d1338";

/** 地面同心环的半径：一眼看出这是个圆厅 */
const FLOOR_RINGS = [11.6, 16.4, 21.2, 26.2];

/** 外墙上色带的高度 */
const BAND_Y = 7.6;

/**
 * 相机到板子的实际距离，随视口高度伸缩：视口矮就往前站一点，板子不至于缩成看不清的一小块。
 * 0.6 次方是折中 —— 板子始终占视口高的 0.6～0.85，正文落在 11～14px 之间；
 * 圆厅几何完全不动，动的只是相机站在哪一圈轨道上。
 */
const viewDist = () => {
  const k = Math.min(1, Math.max(0.72, Math.pow(window.innerHeight / 900, 0.6)));
  return BOARD_DIST * k;
};

type ViewRef = React.MutableRefObject<number>;
type TargetAngle = React.MutableRefObject<number>;
type AngleRef = React.MutableRefObject<number>;

type Station = {
  /** 区块 id，也是 DOM 里 [data-board="…"] 的值 */
  id: string;
  /** 这个展位在圆厅里的角度：0 在 +z 轴上，顺时针每格 45° */
  angle: number;
  /** 这间展位的配色，墙面色带、地砖、隔墙都用它 */
  accent: string;
};

const STATIONS: Station[] = [
  { id: "hero", angle: RING_STEP * 0, accent: "#ffcf00" },
  { id: "projects", angle: RING_STEP * 1, accent: "#2f7ff0" },
  { id: "approach", angle: RING_STEP * 2, accent: "#ff8a00" },
  { id: "certs", angle: RING_STEP * 3, accent: "#00a3da" },
  { id: "about", angle: RING_STEP * 4, accent: "#b0e01a" },
  { id: "experience", angle: RING_STEP * 5, accent: "#e5007d" },
  { id: "skills", angle: RING_STEP * 6, accent: "#25a745" },
  { id: "contact", angle: RING_STEP * 7, accent: "#e3000b" },
];

/** 圆环上的坐标：角度 a、半径 r 处的 (x, z) */
const ringX = (a: number, r: number) => Math.sin(a) * r;
const ringZ = (a: number, r: number) => Math.cos(a) * r;

/* ------------------------------ 通用零件 ------------------------------ */

/** 细长的发光条：墙面色带、隔墙灯都用它 */
const GlowBar = ({
  position,
  size,
  color,
  opacity = 0.9,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  opacity?: number;
}) => (
  <mesh position={position}>
    <boxGeometry args={size} />
    <meshBasicMaterial color={color} transparent opacity={opacity} />
  </mesh>
);

/** 积木本体：墙、地面、地砖、板框都用它。低粗糙度 + 平面着色 = 玩具块面感 */
const Slab = ({
  position,
  size,
  color,
  emissive,
  intensity = 0.25,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  emissive?: string;
  intensity?: number;
}) => (
  <mesh position={position}>
    <boxGeometry args={size} />
    <meshStandardMaterial
      color={color}
      emissive={emissive ?? "#000000"}
      emissiveIntensity={emissive ? intensity : 0}
      roughness={0.92}
      metalness={0.02}
      flatShading
    />
  </mesh>
);

/** 凸点：积木顶上那颗小圆柱，最直白的乐高记号 */
const Stud = ({
  position,
  color,
  r = 0.26,
  h = 0.22,
}: {
  position: [number, number, number];
  color: string;
  r?: number;
  h?: number;
}) => (
  <mesh position={position}>
    <cylinderGeometry args={[r, r, h, 10]} />
    <meshStandardMaterial
      color={color}
      roughness={0.9}
      metalness={0.02}
      flatShading
    />
  </mesh>
);

/* ------------------------------- 圆厅 -------------------------------- */

/**
 * 圆厅本身：地面、天花、外墙（连同每间展位的色带）、中央立柱、地面同心环。
 * 这些都不承载内容，只负责让人一眼看出「我在一个圆的展厅里转」。
 */
const Ring = () => (
  <group>
    {/* 地面 / 天花：两个大圆盘 */}
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[R_OUTER, 72]} />
      <meshStandardMaterial color={FLOOR_COLOR} roughness={1} metalness={0} />
    </mesh>
    <mesh position={[0, ROOM_H, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <circleGeometry args={[R_OUTER, 72]} />
      <meshStandardMaterial color={WALL_COLOR} roughness={1} metalness={0} />
    </mesh>

    {/* 地面的同心环：转动时它们从脚下扫过，圆厅的形状就出来了 */}
    {FLOOR_RINGS.map((r) => (
      <mesh key={r} position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[r, 0.075, 6, 96]} />
        <meshBasicMaterial color="#33439b" transparent opacity={0.6} />
      </mesh>
    ))}

    {/* 外墙：站在厅里看到的是它的内表面 */}
    <mesh position={[0, ROOM_H / 2, 0]}>
      <cylinderGeometry args={[R_OUTER, R_OUTER, ROOM_H, 64, 1, true]} />
      <meshStandardMaterial
        color={WALL_COLOR}
        side={THREE.BackSide}
        roughness={0.95}
        metalness={0.02}
      />
    </mesh>

    {/* 外墙上的色带：每间展位一段，转动时颜色一段段换过去 */}
    {STATIONS.map((station) => (
      <mesh key={station.id} position={[0, BAND_Y, 0]}>
        <cylinderGeometry
          args={[
            R_OUTER - 0.3,
            R_OUTER - 0.3,
            0.6,
            28,
            1,
            true,
            station.angle - RING_STEP / 2,
            RING_STEP,
          ]}
        />
        <meshBasicMaterial
          color={station.accent}
          side={THREE.BackSide}
          transparent
          opacity={0.5}
        />
      </mesh>
    ))}

    {/* 中央立柱：圆厅的圆心 */}
    <mesh position={[0, ROOM_H / 2, 0]}>
      <cylinderGeometry args={[R_HUB, R_HUB, ROOM_H, 28, 1, false]} />
      <meshStandardMaterial
        color={HUB_COLOR}
        roughness={0.95}
        metalness={0.02}
        flatShading
      />
    </mesh>
  </group>
);

/** 展位之间的隔墙：从外墙往里伸的短墙，顶上带一排凸点 */
const Divider = ({ angle, accent }: { angle: number; accent: string }) => {
  const h = 4.8;
  const len = R_OUTER - R_DIV_IN;
  const mid = (R_OUTER + R_DIV_IN) / 2;

  return (
    <group
      position={[ringX(angle, mid), 0, ringZ(angle, mid)]}
      rotation={[0, angle, 0]}
    >
      <Slab
        position={[0, h / 2, 0]}
        size={[0.75, h, len]}
        color={WALL_COLOR}
        emissive={accent}
        intensity={0.12}
      />
      {[-2.9, 0, 2.9].map((z) => (
        <Stud key={z} position={[0, h + 0.11, z]} color={accent} />
      ))}
      {/* 内端一根竖灯，远远看到就知道下一个展位在哪 */}
      <GlowBar
        position={[0, h / 2, -len / 2 + 0.45]}
        size={[0.18, h - 1.6, 0.18]}
        color={accent}
      />
    </group>
  );
};

/** 展位背板：贴在弧形外墙上的一块暗色板，让解说板有个「窗口」 */
const BackPanel = ({ angle, accent }: { angle: number; accent: string }) => {
  const r = R_OUTER - 0.5;
  return (
    <mesh
      position={[ringX(angle, r), 3.9, ringZ(angle, r)]}
      rotation={[0, angle + Math.PI, 0]}
    >
      <planeGeometry args={[BOARD_W + 5.4, 7.4]} />
      <meshStandardMaterial
        color="#0b1026"
        emissive={accent}
        emissiveIntensity={0.12}
        roughness={1}
        metalness={0}
      />
    </mesh>
  );
};

/** 展位前的地砖：一小块亮色积木，站在哪一间一眼看得出来 */
const FloorTile = ({ angle, accent }: { angle: number; accent: string }) => {
  const r = (R_CAM + R_BOARD) / 2;
  return (
    <group
      position={[ringX(angle, r), 0, ringZ(angle, r)]}
      rotation={[0, angle, 0]}
    >
      <Slab
        position={[0, 0.07, 0]}
        size={[9.2, 0.14, 8]}
        color={TILE_COLOR}
        emissive={accent}
        intensity={0.5}
      />
    </group>
  );
};

/* --------------------- 解说板在空间里的那台「屏」 --------------------- */

/**
 * 真正承载内容的是 DOM 里那块板（Scene3D 每帧把它投影到正确的位置）。
 * 这里画的是它在空间里的实体：一块亮色积木框 + 底座 + 顶上一排凸点。
 * 框比板子大一圈，露出来的那圈边就是「板框」。
 */
const Partition = ({ station }: { station: Station }) => {
  const frameW = BOARD_W + 0.4;
  const frameH = BOARD_H + 0.4;

  return (
    <group
      position={[ringX(station.angle, R_BOARD), 0, ringZ(station.angle, R_BOARD)]}
      rotation={[0, station.angle + Math.PI, 0]}
    >
      {/* 板框：正面正好在 R_BOARD 这圈上，DOM 那块板就贴在这一层 */}
      <mesh position={[0, BOARD_MID_Y, -0.16]}>
        <boxGeometry args={[frameW, frameH, 0.32]} />
        <meshStandardMaterial
          color={station.accent}
          emissive={station.accent}
          emissiveIntensity={0.3}
          roughness={0.85}
          metalness={0.02}
          flatShading
        />
      </mesh>

      {/* 底座：把板子落到地上，看着是立着的而不是飘着的 */}
      <mesh position={[0, BOARD_BOTTOM / 2, -0.16]}>
        <boxGeometry args={[frameW + 0.9, BOARD_BOTTOM, 1.3]} />
        <meshStandardMaterial
          color="#1a2150"
          roughness={0.95}
          metalness={0.02}
          flatShading
        />
      </mesh>

      {/* 板框顶上的一排凸点：这块板本身也是一块积木 */}
      {[-3.7, -1.85, 0, 1.85, 3.7].map((x) => (
        <Stud
          key={x}
          position={[x, BOARD_MID_Y + frameH / 2 + 0.26, -0.16]}
          color={station.accent}
          r={0.28}
          h={0.24}
        />
      ))}

      {/* 板前的一盏灯，让展位里有方向感 */}
      <pointLight
        position={[0, BOARD_MID_Y + 1.4, 3.6]}
        intensity={20}
        distance={18}
        decay={2}
        color={station.accent}
      />
    </group>
  );
};

/* ------------------------ 解说板的投影引擎 ------------------------ */

/**
 * 一块要被摆进空间的板。DOM 那边是 .board（固定 1000×600，绝对定位在
 * .stage 左上角），这里每帧算出它应该在屏幕上的位置与缩放。
 */
type Board = {
  id: string;
  /** 这块板在圆厅里的角度，用来判断相机转到它面前了没有 */
  angle: number;
  el: HTMLElement | null;
  /** 所属 .stage 在文档里的位置（stage 自己不做 transform，随时量都准） */
  stageTop: number;
  stageLeft: number;
  /** 板心在世界里的位置 */
  world: THREE.Vector3;
  /** 板面法线（朝圆心），相机在它正面时才看得见 */
  normal: THREE.Vector3;
  /** 淡入淡出用的透明度，逐帧靠近目标值 */
  alpha: number;
};

/* 投影计算用的临时对象，避免每帧新建 */
const _toCam = new THREE.Vector3();
const _proj = new THREE.Vector3();
const _edge = new THREE.Vector3();

/** 平滑阶跃，用来做角度 / 距离上的淡入淡出 */
const smooth = (from: number, to: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - from) / (to - from)));
  return t * t * (3 - 2 * t);
};

/** 角差折算到 [-π, π]，这样「最近的角差」永远是走短边 */
const wrapPi = (a: number) => {
  let x = a % (Math.PI * 2);
  if (x > Math.PI) x -= Math.PI * 2;
  if (x < -Math.PI) x += Math.PI * 2;
  return x;
};

/**
 * 逐帧把每块板摆到它该在的屏幕位置。
 *
 * 相机是绕着圆厅转的，所以正对着板时板子正好铺在屏幕中间；转过去的路上板子
 * 先按角差淡出、下一块再淡进来（中途板子是被斜着看的，用等比缩放去近似会失真，
 * 索性在偏过 20° 左右就让它退场）。
 */
const Boards = ({
  boards,
  angleRef,
  painted,
}: {
  boards: React.MutableRefObject<Board[]>;
  angleRef: AngleRef;
  painted: React.MutableRefObject<boolean>;
}) => {
  useFrame((state, delta) => {
    const { camera, size } = state;
    const scrollY = window.scrollY;
    const step = Math.min(1, delta * 8);

    // Rig 的 useFrame 排在这之前，本帧它刚改过相机位置，但矩阵还没更新；
    // 这里主动刷新一次，投影才不会慢一帧（快滚时板子会明显拖影）
    camera.updateMatrixWorld();
    camera.matrixWorldInverse.copy(camera.matrixWorld).invert();

    for (const board of boards.current) {
      const el = board.el;
      if (!el) continue;

      _toCam.copy(camera.position).sub(board.world);
      const distance = _toCam.length() || 1;
      const facing = _toCam.dot(board.normal) / distance;
      // 相机转到别的展位去了就退场：角差比距离更说明「这块板现在是不是主角」
      const offAngle = Math.abs(wrapPi(angleRef.current - board.angle));

      // 偏过半个展位（22.5°）时两块板各留一半，转到哪一间都是「迎面来、背后走」；
      // 停稳时邻居偏了 45°，早淡干净了，绝不会两块板同时占着屏幕
      const wanted =
        facing > 0.2
          ? (1 - smooth(0.3, 0.48, offAngle)) *
            smooth(4.5, 8, distance) *
            (1 - smooth(24, 40, distance))
          : 0;
      board.alpha += (wanted - board.alpha) * step;

      if (board.alpha < 0.02) {
        if (el.style.visibility !== "hidden") {
          el.style.visibility = "hidden";
          el.style.pointerEvents = "none";
        }
        continue;
      }

      _proj.copy(board.world).project(camera);
      const cx = (_proj.x * 0.5 + 0.5) * size.width;
      const cy = (-_proj.y * 0.5 + 0.5) * size.height;

      // 用板子上沿的投影反推缩放：世界里的高度 ↔ DOM 里的像素高度
      _edge.copy(board.world);
      _edge.y += BOARD_H / 2;
      _edge.project(camera);
      const heightPx = Math.abs(cy - (-_edge.y * 0.5 + 0.5) * size.height) * 2;
      const scale = heightPx / BOARD_PX_H;

      // DOM 那块板目前躺在 .stage 左上角（layout 位置），算出它到目标位置的位移
      const dx = cx - (board.stageLeft + BOARD_PX_W / 2);
      const dy = cy - (board.stageTop - scrollY + BOARD_PX_H / 2);

      el.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(
        1
      )}px, 0) scale(${scale.toFixed(4)})`;
      el.style.opacity = board.alpha.toFixed(3);
      el.style.visibility = "visible";
      el.style.pointerEvents = "auto";
    }

    painted.current = true;
  });

  return null;
};

/* ---------------------------- 相机 ---------------------------- */

/**
 * 相机在半径 R_CAM 的轨道上转：角度缓动到目标展位，视线始终锁在那块板的板心上。
 * 这样「停稳」的时候投影一定正中，正文才不会一边读一边飘。
 * 转得快的时候机身轻轻侧倾一下（侧倾量取自实际角速度，停下来就回正）。
 */
const Rig = ({
  targetAngle,
  angleRef,
  view,
}: {
  targetAngle: TargetAngle;
  angleRef: AngleRef;
  view: ViewRef;
}) => {
  /** 缓动后的角速度，只用来决定侧倾多少 */
  const omega = useRef(0);

  useFrame((state, delta) => {
    const camera = state.camera;
    const t = state.clock.elapsedTime;
    const ease = Math.min(1, delta * 3.2);
    const dt = Math.max(delta, 0.001);

    const before = angleRef.current;
    angleRef.current += (targetAngle.current - before) * ease;
    const a = angleRef.current;

    // 实际转得多快（弧度/秒），转得快就多侧倾一点
    omega.current += ((a - before) / dt - omega.current) * Math.min(1, delta * 4);

    const r = R_BOARD - view.current;
    // 走路的轻微摇晃：身体沿切线偏一丁点、上下起伏一点（房间在晃、板子不动）
    const theta = a + (Math.sin(t * 0.16) * 0.2) / r;
    camera.position.set(
      ringX(theta, r),
      EYE + Math.cos(t * 0.13) * 0.1,
      ringZ(theta, r)
    );

    // 视线正对板心上（不是板前的一点）：身体再怎么晃，板心都钉在画面正中
    camera.lookAt(ringX(a, R_BOARD), BOARD_MID_Y, ringZ(a, R_BOARD));

    // 转起来的时候侧倾一点，像坐旋转木马
    camera.rotateZ(Math.max(-0.035, Math.min(0.035, -omega.current * 0.06)));
  });

  return null;
};

/* -------------------------------- 场景 -------------------------------- */

const Scene = ({
  targetAngle,
  angleRef,
  view,
  boards,
  painted,
}: {
  targetAngle: TargetAngle;
  angleRef: AngleRef;
  view: ViewRef;
  boards: React.MutableRefObject<Board[]>;
  painted: React.MutableRefObject<boolean>;
}) => (
  <>
    <color attach="background" args={[SPACE_COLOR]} />
    {/* 近处清晰，对面那半圈逐间接上底色，转的时候不会糊成一片 */}
    <fog attach="fog" args={[SPACE_COLOR, 18, 58]} />
    <ambientLight intensity={0.6} />
    <directionalLight position={[-8, 14, 6]} intensity={1.15} color="#dbe4ff" />
    <directionalLight position={[8, 6, -12]} intensity={0.5} color="#8fb4ff" />

    <Rig targetAngle={targetAngle} angleRef={angleRef} view={view} />

    <Ring />

    {STATIONS.map((station, index) => (
      <group key={station.id}>
        {/* 隔墙摆在本展位与下一间之间，用下一间的颜色 */}
        <Divider
          angle={station.angle + RING_STEP / 2}
          accent={STATIONS[(index + 1) % STATIONS.length].accent}
        />
        <BackPanel angle={station.angle} accent={station.accent} />
        <FloorTile angle={station.angle} accent={station.accent} />
        <Partition station={station} />
      </group>
    ))}

    <Boards boards={boards} angleRef={angleRef} painted={painted} />
  </>
);

/* ------------------------------ 对外组件 ------------------------------ */

/**
 * 显卡驱动异常 / 上下文耗尽时 Canvas 会抛错，
 * 兜住它免得整个页面跟着白屏，出问题就退回静态渐变。
 */
class SceneErrorBoundary extends Component<
  { children: ReactNode },
  { broken: boolean }
> {
  state = { broken: false };

  static getDerivedStateFromError() {
    return { broken: true };
  }

  render() {
    return this.state.broken ? null : this.props.children;
  }
}

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

const Scene3D = () => {
  const [supported, setSupported] = useState(false);
  const [broken, setBroken] = useState(false);

  /** 相机当前转到哪个角度、应该停在哪个角度 */
  const angleRef = useRef(STATIONS[0].angle);
  const targetAngle = useRef(STATIONS[0].angle);
  /** 每个区块滚到视口正中时的 scrollY，作为相机的路标 */
  const stops = useRef<number[]>([]);
  /** 渲染循环有没有真的跑起来（跑不起来就得退回普通排版） */
  const painted = useRef(false);
  const shade = useRef<HTMLDivElement>(null);

  /** 8 块解说板，DOM 元素在下面量位置时挂上去 */
  const boards = useRef<Board[]>([]);
  if (boards.current.length === 0) {
    boards.current = STATIONS.map((station) => ({
      id: station.id,
      angle: station.angle,
      el: null,
      stageTop: 0,
      stageLeft: 0,
      world: new THREE.Vector3(
        ringX(station.angle, R_BOARD),
        BOARD_MID_Y,
        ringZ(station.angle, R_BOARD)
      ),
      normal: new THREE.Vector3(
        -Math.sin(station.angle),
        0,
        -Math.cos(station.angle)
      ),
      alpha: 0,
    }));
  }

  /** 相机这一帧站得离板子多远，随视口高度变，resize 时重算 */
  const view = useRef<number>(BOARD_DIST);
  const syncView = useCallback(() => {
    view.current = viewDist();
  }, []);

  useEffect(() => {
    // 门槛只要能装下板子就放行。板子内部排版是按 1000px 宽写的（lg: 断点），
    // 视口窄于 1024 时媒体查询不命中，内容会被挤成两列、溢出固定高度的板子，
    // 所以 1024 是硬下限；高度 600 是字号的地板（此时正文约 11px）。
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
    wideScreen.addEventListener("change", sync);
    tallScreen.addEventListener("change", sync);
    wideRatio.addEventListener("change", sync);
    calmMotion.addEventListener("change", sync);
    return () => {
      wideScreen.removeEventListener("change", sync);
      tallScreen.removeEventListener("change", sync);
      wideRatio.removeEventListener("change", sync);
      calmMotion.removeEventListener("change", sync);
    };
  }, []);

  const showScene = supported && !broken;

  /**
   * 量出每个区块在文档里的位置：既是相机的路标，也是每块板在 DOM 里的落点。
   * stage 自身没有 transform，所以什么时候量都准。
   *
   * 注意：进不进空间模式，区块的高度完全不同（100vh vs 内容高度），
   * 所以每次切换模式都要重新量一次，否则相机会按错误的刻度走。
   */
  const measure = useCallback(() => {
    const middle = window.innerHeight / 2;
    const marks: number[] = [];
    STATIONS.forEach((station, index) => {
      const el = document.querySelector<HTMLElement>(
        `[data-board="${station.id}"]`
      );
      const stage = el?.parentElement;
      if (!el || !stage) {
        marks[index] = index === 0 ? 0 : marks[index - 1] + 1;
        return;
      }
      const rect = stage.getBoundingClientRect();
      const board = boards.current[index];
      board.el = el;
      board.stageTop = rect.top + window.scrollY;
      board.stageLeft = rect.left;
      marks[index] = Math.max(
        0,
        rect.top + window.scrollY + rect.height / 2 - middle
      );
    });
    stops.current = marks;
  }, []);

  useEffect(() => {
    const onResize = () => {
      syncView();
      measure();
    };

    syncView();
    measure();
    // 字体和图片落位后高度会变，稍后再量一次
    const timer = window.setTimeout(measure, 1200);
    window.addEventListener("resize", onResize);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", onResize);
    };
  }, [measure, syncView]);

  useEffect(() => {
    if (!showScene) return;

    document.documentElement.classList.add("spatial-on");
    // 区块从「内容高度」变成「一屏高」，位置全变了，立刻按新的排版重量一次
    syncView();
    measure();

    const onScroll = () => {
      const marks = stops.current;
      if (marks.length !== STATIONS.length) return;

      const y = window.scrollY;
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;

      // 路标：每个区块正中 → 对应展位的角度，页面底部 → 再往前转小半格。
      // 相机站得远近只影响轨道半径，圆厅和展位的角度一个不动。
      const path: [number, number][] = STATIONS.map((station, i) => [
        marks[i],
        station.angle,
      ]);
      path.push([
        maxScroll,
        STATIONS[STATIONS.length - 1].angle + RING_STEP * 0.55,
      ]);

      // 万一某个区块没量到（长度为 0），强行拉成递增，避免相机乱跳
      for (let i = 1; i < path.length; i++) {
        if (path[i][0] <= path[i - 1][0]) path[i][0] = path[i - 1][0] + 1;
      }

      if (y <= path[0][0]) {
        targetAngle.current = path[0][1];
      } else {
        targetAngle.current = path[path.length - 1][1];
        for (let i = 1; i < path.length; i++) {
          if (y <= path[i][0]) {
            const [s0, a0] = path[i - 1];
            const [s1, a1] = path[i];
            targetAngle.current = a0 + (a1 - a0) * ((y - s0) / (s1 - s0));
            break;
          }
        }
      }

      // 走到某个展位前时，把四周压暗一点，板子当主角
      const reach = window.innerHeight * 0.7;
      let nearest = 0;
      marks.forEach((mark, i) => {
        if (i === 0) return;
        const f = Math.max(0, 1 - Math.abs(y - mark) / reach);
        if (f > nearest) nearest = f;
      });
      if (shade.current) {
        shade.current.style.opacity = (0.45 + 0.55 * nearest).toFixed(3);
      }
    };

    // 滚动事件比帧还密，攒到下一帧再写一次样式
    let queued = 0;
    const schedule = () => {
      if (queued) return;
      queued = window.requestAnimationFrame(() => {
        queued = 0;
        onScroll();
      });
    };

    onScroll();
    window.addEventListener("scroll", schedule, { passive: true });
    const onResize = () => {
      syncView();
      schedule();
    };
    window.addEventListener("resize", onResize);

    // 渲染循环万一没跑起来（显卡抽风），把空间模式撤掉，别让正文一直藏着
    const guard = window.setTimeout(() => {
      if (!painted.current) setBroken(true);
    }, 3000);

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", onResize);
      window.cancelAnimationFrame(queued);
      window.clearTimeout(guard);
      document.documentElement.classList.remove("spatial-on");
      boards.current.forEach((board) => {
        if (!board.el) return;
        board.el.style.visibility = "";
        board.el.style.transform = "";
        board.el.style.opacity = "";
        board.el.style.pointerEvents = "";
      });
      if (shade.current) shade.current.style.opacity = "";
      // 摘掉空间模式后排版又变了，把路标量回普通文档流的值
      measure();
    };
  }, [showScene, measure, syncView]);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
      style={{
        background: `radial-gradient(120% 90% at 50% 8%, #141034 0%, #06071f 45%, ${SPACE_COLOR} 100%)`,
      }}
    >
      {showScene && (
        <SceneErrorBoundary>
          <Canvas
            dpr={[1, 1.75]}
            gl={{ antialias: true, powerPreference: "high-performance" }}
            camera={{
              position: [0, EYE, R_CAM],
              fov: 45,
              near: 0.1,
              far: 140,
            }}
            onCreated={({ gl }) => {
              // 上下文丢了就直接撤掉 3D，别让页面卡在一张黑画布上
              gl.domElement.addEventListener("webglcontextlost", (event) => {
                event.preventDefault();
                setBroken(true);
              });
            }}
          >
            <Scene
              targetAngle={targetAngle}
              angleRef={angleRef}
              view={view}
              boards={boards}
              painted={painted}
            />
          </Canvas>
        </SceneErrorBoundary>
      )}

      {/* 四周压暗一点：解说板是主角，空间只做背景 */}
      <div
        ref={shade}
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 78% 62% at 50% 52%, rgba(0,3,25,0.55) 0%, rgba(0,3,25,0.28) 55%, rgba(0,3,25,0.55) 100%)",
        }}
      />
    </div>
  );
};

export default Scene3D;