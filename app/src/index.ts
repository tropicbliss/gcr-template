import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { SecretManagerServiceClient } from "@google-cloud/secret-manager"

const app = new Hono();
const port = parseInt(process.env.PORT || "8000");

app.get("/ping", async (c) => {
    return c.text(process.env.sharedEnv!)
});

serve({
    fetch: app.fetch,
    port,
});
