export const filmSeries = {
  title: "每次救女儿，我都会失去记忆",
  world: "海妖囚岛",
  format: "AI 短剧 / 竖屏影像",
  link: "https://yanghao158640.github.io/#films",
  description: "一次营救，一次遗忘。把关于记忆与牵挂的想象，变成可以被看见的故事。",
  completed: "2026.10",
  role: "独立创作",
  tools: ["LibTV", "可灵", "GPT"],
  contribution: "从策划、剧本、角色设定与分镜，到提示词、AI 生成、素材修改和成片剪辑，均由我独立完成。",
};

export const makingOf = [
  {
    src: "/films/process-character.jpg",
    title: "01 / 角色设定",
    description: "塞芮／梅瑞娅的身份与衣装参考，记录脸部、耳鳍、服装及不同视角。",
    alt: "塞芮／梅瑞娅角色参考：面部细节与正面、侧面、背面衣装",
  },
  {
    src: "/films/process-storyboard.jpg",
    title: "02 / 分镜设计",
    description: "第三集开场 0–15 秒的九宫格分镜，用于梳理镜头顺序、构图和人物状态。",
    alt: "海妖囚岛第三集开场九宫格分镜，展示角色、道具和场景之间的镜头衔接",
  },
];

export const episodes = [
  { number: 1, duration: "01:08", seconds: 67.96 },
  { number: 2, duration: "01:01", seconds: 61.46 },
  { number: 3, duration: "01:01", seconds: 60.60 },
  { number: 4, duration: "01:01", seconds: 60.56 },
  { number: 5, duration: "01:00", seconds: 60.02 },
].map((episode) => ({
  ...episode,
  id: String(episode.number).padStart(2, "0"),
  src: `/films/episode-${String(episode.number).padStart(2, "0")}.mp4`,
  poster: `/films/poster-${String(episode.number).padStart(2, "0")}.jpg`,
}));
