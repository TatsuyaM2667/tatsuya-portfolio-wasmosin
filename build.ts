// build.ts
import { $ } from "bun";

console.log("Starting full stack build");

// Cloudflare Pages など CI 環境には odin コンパイラが無いため、
// CI=1/true の場合は WASM ビルドをスキップして事前コミット済みの
// public/main.wasm をそのまま使用する。
const isCI = process.env.CI === "true" || process.env.CI === "1";
if (isCI) {
  console.log("CI detected: skipping odin build, using pre-built main.wasm");
} else {
  console.log("Compiling Odin to WASM...");
  await $`odin build core -target:freestanding_wasm32 -out:./public/main.wasm -o:speed`;
}

console.log("Building Frontend (React)...");
await Bun.build({
  entrypoints: ["./src/main.tsx"],
  outdir: "./public/dist",
  naming: "[name].[ext]",
  minify: true,
});

// Hono (Cloudflare Pages Functions) のビルド
// /api/* だけを Functions でハンドルするため functions/api/ 配下に出力する。
// functions/[[path]].ts（ルートキャッチオール）だと静的ファイルまで横取りして404になる。
await $`mkdir -p ./functions/api`;
await Bun.build({
  entrypoints: ["./server/index.ts"],
  outdir: "./functions/api",
  naming: "_worker.js",
  minify: true,
});
await $`rm -f "./functions/api/[[path]].ts" "./functions/api/[path]].ts"`;
await $`mv ./functions/api/_worker.js "./functions/api/[[path]].ts"`;
// ルートレベルの古いキャッチオールを削除（あれば）
await $`rm -f "./functions/[[path]].ts"`;

console.log("All systems successfully built! (WASM + React + Hono)!");

