import { Router } from "express";
import { createHash } from "crypto";
import { db, apiKeysTable, analysesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

const VALID_EXITS = ["SL", "BE", "TP1", "TP2", "TP3"] as const;
type ExitLevel = typeof VALID_EXITS[number];

router.post("/outcome", async (req, res) => {
  const rawKey = req.headers["x-api-key"] as string | undefined;
  if (!rawKey) {
    res.status(401).json({ error: "Missing X-API-Key header" });
    return;
  }

  const keyHash = createHash("sha256").update(rawKey).digest("hex");
  const keyRows = await db
    .select()
    .from(apiKeysTable)
    .where(eq(apiKeysTable.keyHash, keyHash))
    .limit(1);

  if (!keyRows.length) {
    res.status(401).json({ error: "Invalid API key" });
    return;
  }
  const apiKey = keyRows[0];

  const { id, exit, realizedR } = req.body as {
    id?: unknown;
    exit?: unknown;
    realizedR?: unknown;
  };

  if (!id || typeof id !== "string") {
    res.status(400).json({ error: "id is required and must be a string" });
    return;
  }
  if (!exit || !VALID_EXITS.includes(exit as ExitLevel)) {
    res.status(400).json({ error: "exit must be one of SL/BE/TP1/TP2/TP3" });
    return;
  }
  if (typeof realizedR !== "number" || isNaN(realizedR)) {
    res.status(400).json({ error: "realizedR must be a number" });
    return;
  }

  const updated = await db
    .update(analysesTable)
    .set({ exit: exit as string, realizedR })
    .where(and(eq(analysesTable.id, id), eq(analysesTable.userId, apiKey.userId)))
    .returning({ id: analysesTable.id });

  if (!updated.length) {
    res.status(404).json({ error: "Analysis not found for this user" });
    return;
  }

  await db
    .update(apiKeysTable)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeysTable.id, apiKey.id));

  res.json({ success: true });
});

export default router;
