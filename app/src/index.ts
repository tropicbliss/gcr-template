import { serve } from "@hono/node-server";
import { Hono } from "hono";

const app = new Hono();
const port = parseInt(process.env.PORT || "8000");

app.get("/", (c) => {
    console.log("Example log")
    return c.text("Hello from Google!")
});

serve({
    fetch: app.fetch,
    port,
});

console.log(`Server is running on http://localhost:${port}`);
