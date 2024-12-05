import { serve } from "@hono/node-server";
import { Hono } from "hono";

const app = new Hono();
const port = parseInt(process.env.PORT || "8000");

app.get("/ping", (c) => c.text("Pong!"));

serve({
    fetch: app.fetch,
    port,
});
