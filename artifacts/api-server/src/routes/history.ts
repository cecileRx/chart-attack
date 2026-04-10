import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, analysesTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  const auth = getAuth(req);
  const userId = auth?.userId;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const rows = await db
    .select()
    .from(analysesTable)
    .where(eq(analysesTable.userId, userId))
    .orderBy(desc(analysesTable.createdAt))
    .limit(100);

  res.json(rows);
});

router.delete("/:id", async (req, res) => {
  const auth = getAuth(req);
  const userId = auth?.userId;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { id } = req.params;

  const deleted = await db
    .delete(analysesTable)
    .where(and(eq(analysesTable.id, id), eq(analysesTable.userId, userId)))
    .returning();

  if (deleted.length === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.json({ success: true });
});

export default router;
