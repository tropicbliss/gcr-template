import { serve } from "@hono/node-server";
import { Hono } from "hono";

const app = new Hono();
const port = parseInt(process.env.PORT || "8000");

app.get("/", (c) => {
    console.log({
        message: "Example log",
        context: {
            cwqcw: 3,
            vewvfwe: {
                bgregbregesgrw: 5
            }
        }
    })
    return c.text("Hello from Google!")
});

serve({
    fetch: app.fetch,
    port,
});

console.log(`Server is running on http://localhost:${port}`);
