// server/index.ts
import { Hono } from "hono";

const app = new Hono();

// 1. API エンドポイント
app.get("/api/status", (c) => {
  return c.json({ status: "operational", engine: "Bun + Hono" });
});

// 2. Cloudflare Pages Functions 用
import { handle } from "hono/cloudflare-pages";
export const onRequest = handle(app);

// 3. ローカル開発（Bun環境）のルーティング適正化
// globalThis を経由させることで、Node/Bun の型定義を入れていなくても TS エラーを完全回避します
if (typeof globalThis !== "undefined" && "Bun" in globalThis) {
  const { serveStatic: bunServeStatic } = await import("hono/bun");

  // 先に public 内の静的ファイルを確実に配信
  app.use("*", bunServeStatic({ root: "./public" }));

  // 拡張子がない通常のページルート（/skills や /contact など）だけを index.html にフォールバック
  app.get("*", async (c) => {
    const url = new URL(c.req.url);
    if (url.pathname.includes(".")) {
      return c.text("Not Found", 404);
    }

    const file = Bun.file("./public/index.html");
    return c.html(await file.text());
  });
}

export default app;
