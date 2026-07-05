// build.ts
import { $ } from "bun";
//Reactのビルド
console.log("Starting full satck build");
console.log("Compoling Odin to WASMOSIN");
await $ `odin build core -target:freestanding_wasm32 -out:./public/main.wasm`;
console.log("Building Frontend of React");
await Bun.build({
  entrypoints: ["./src/main.tsx"],
  outdir: "./public/dist",
  naming: "[name].[ext]",
  minify: true,
  // プラグインは不要になったので削除
});

// 2. バックエンド (Hono) のビルド
await Bun.build({
  entrypoints: ["./server/index.ts"],
  outdir: "./functions",
  naming: "[[path]].ts",
  minify: true,
});

console.log("All systems successfully built! (WASM + React + Hono)!");
