import { Router } from "express";
import { getAuth } from "@clerk/express";
import { randomBytes, createHash } from "crypto";
import { db, apiKeysTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/status", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const rows = await db
    .select({ createdAt: apiKeysTable.createdAt })
    .from(apiKeysTable)
    .where(eq(apiKeysTable.userId, userId))
    .limit(1);

  res.json({
    hasKey: rows.length > 0,
    createdAt: rows[0]?.createdAt ?? null,
  });
});

router.post("/", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  await db.delete(apiKeysTable).where(eq(apiKeysTable.userId, userId));

  const rawKey = "ca_" + randomBytes(16).toString("hex");
  const keyHash = createHash("sha256").update(rawKey).digest("hex");
  const id = randomBytes(8).toString("hex");

  await db.insert(apiKeysTable).values({ id, userId, keyHash, label: "MT5 Key" });

  res.json({ key: rawKey });
});

export default router;
