import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { SecretManagerServiceClient } from "@google-cloud/secret-manager"
import admin from "firebase-admin"

admin.initializeApp()

const firestore = admin.firestore()

async function listCollections() {
    try {
        const collections = await firestore.listCollections();

        // Get collection IDs
        const collectionIds = collections.map(col => col.id);

        console.log('Collections:', collectionIds);
        return collectionIds;
    } catch (error) {
        console.error('Error listing collections:', error);
        throw error;
    }
}

const PROJECT_ID = process.env.projectId || "gcr-test-temp"

async function getAllSecrets() {
    const client = new SecretManagerServiceClient()
    const parent = `projects/${PROJECT_ID}`
    const [secrets] = await client.listSecrets({
        parent
    })
    const rawSecrets: Record<string, string> = {}
    await Promise.all(secrets.map(async (secret) => {
        const [version] = await client.accessSecretVersion({
            name: `${secret.name}/versions/latest`
        })
        const secretName = secret.name?.split("/").pop()
        const value = version.payload?.data?.toString()
        if (secretName && value) {
            rawSecrets[secretName] = value
        }
    }))
    const result: Record<string, any> = {}
    for (const [key, value] of Object.entries(rawSecrets)) {
        const parts = key.split("-")
        let current = result
        parts.forEach((part, index) => {
            if (index === parts.length - 1) {
                current[part] = value
            } else {
                current[part] = current[part] || {}
                current = current[part]
            }
        })
    }
    process.env.main = JSON.stringify(result)
}

export function getEnv() {
    return JSON.parse(process.env.main!)
}

getAllSecrets()

const app = new Hono();
const port = parseInt(process.env.PORT || "8000");

app.get("/", async (c) => {
    const ids = await listCollections()
    return c.json({ ids, ...getEnv() })
});

serve({
    fetch: app.fetch,
    port,
});
