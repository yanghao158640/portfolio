export const filmSeries = {
  title: "每次救女儿，我都会失去记忆",
  world: "海妖囚岛",
  format: "AI 短剧 / 竖屏影像",
  description: "一次营救，一次遗忘。把关于记忆与牵挂的想象，变成可以被看见的故事。",
};

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
