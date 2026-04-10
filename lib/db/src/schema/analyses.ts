import { pgTable, text, integer, real, timestamp, jsonb } from "drizzle-orm/pg-core";

export const analysesTable = pgTable("analyses", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  context: text("context").notNull().default(""),
  timeframe: text("timeframe").notNull().default(""),
  direction: text("direction").notNull(),
  entry: real("entry").notNull(),
  sl: real("sl").notNull(),
  tp1: real("tp1").notNull(),
  tp2: real("tp2").notNull(),
  tp3: real("tp3").notNull(),
  rrRatio: real("rr_ratio").notNull(),
  rrTp1: real("rr_tp1").notNull(),
  rrTp2: real("rr_tp2").notNull(),
  rrTp3: real("rr_tp3").notNull(),
  confidence: text("confidence").notNull(),
  confidenceScore: integer("confidence_score").notNull(),
  explanation: text("explanation").notNull(),
  setupQuality: text("setup_quality").notNull(),
  keyLevels: text("key_levels").notNull().default(""),
  priceMin: real("price_min").notNull(),
  priceMax: real("price_max").notNull(),
  imageDataUrl: text("image_data_url").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Analysis = typeof analysesTable.$inferSelect;
export type InsertAnalysis = typeof analysesTable.$inferInsert;
