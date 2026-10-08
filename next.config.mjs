/**
 * @type {import('next').NextConfig}
 *
 * 平时按普通 Next 应用构建，`npm run dev / build / start` 一切照旧。
 * 只有部署到 GitHub Pages 时才切成静态导出：
 *
 *   $env:BUILD_TARGET="pages"; npm run build    →  产物在 out/
 *
 * 站点本身没有服务端逻辑（无 cookies / headers / fetch，也没用 next/image），
 * 所以两种模式渲染出来的东西是一致的，切换不影响预览效果。
 */
const nextConfig =
  process.env.BUILD_TARGET === "pages" ? { output: "export" } : {};

export default nextConfig;