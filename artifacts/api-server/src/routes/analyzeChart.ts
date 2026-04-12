import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { db, analysesTable } from "@workspace/db";
import { randomBytes } from "crypto";

const router = Router();

const SYSTEM_PROMPT = `You are an expert technical analyst specializing in financial chart reading. When given a chart image, analyze it precisely and return a structured JSON trade plan. Respond ONLY with valid JSON. No markdown fences, no explanation outside the JSON object.

Your JSON must have EXACTLY these fields:
{
  "context": "Name of the asset/instrument visible on the chart (e.g. EUR/USD, BTC/USD, Apple Inc., Gold, S&P500, NAS100). Look at the chart title, legend, or symbol label. If unclear, make your best guess based on price range.",
  "timeframe": "Visible timeframe if identifiable (e.g. 1H, 4H, Daily, Weekly), or 'Unknown'",
  "priceMin": <number — EXACT lowest price shown on the right price axis>,
  "priceMax": <number — EXACT highest price shown on the right price axis>,
  "direction": "BUY" or "SELL",
  "entry": <number — suggested entry price within priceMin and priceMax>,
  "sl": <number — stop loss price beyond the invalidation zone>,
  "tp1": <number — first take profit at 1R>,
  "tp2": <number — second take profit at 2R>,
  "tp3": <number — third take profit at 3R>,
  "confidence": "LOW" or "MEDIUM" or "GOOD",
  "confidenceScore": <integer from 40 to 85>,
  "explanation": "2-3 sentences explaining the setup in simple, educational language. Reference actual price levels visible on the chart.",
  "setupQuality": "One sentence on setup quality and what to watch for.",
  "keyLevels": "Brief description of the key support/resistance levels you identified on the chart."
}

Critical rules:
- priceMin and priceMax MUST be read from the right price axis labels visible in the image — use the actual numbers shown.
- All price values (entry, sl, tp1, tp2, tp3) MUST be within or very close to the priceMin/priceMax range.
- For BUY: sl must be BELOW entry; tp1, tp2, tp3 must be ABOVE entry.
- For SELL: sl must be ABOVE entry; tp1, tp2, tp3 must be BELOW entry.
- tp1 = entry ± 1 × (entry - sl), tp2 = ± 2 ×, tp3 = ± 3 × (using the actual risk distance).
- Never use language like "guaranteed", "safe signal", or "winning trade".
- If the chart is unclear or doesn't show price levels, still provide your best estimate and set confidence to "LOW".`;

const MULTI_TIMEFRAME_SYSTEM_PROMPT = `You are an expert technical analyst specializing in financial chart reading and multi-timeframe analysis. When given multiple chart images at different timeframes, analyse them together to produce a confluence-based trade plan. Respond ONLY with valid JSON. No markdown fences, no explanation outside the JSON object.

The FIRST image is the PRIMARY chart — base the trade levels (entry, sl, tp1-3) on this chart. The additional images provide higher/lower timeframe context for confluence.

Your JSON must have EXACTLY these fields:
{
  "context": "Name of the asset/instrument visible on the chart (e.g. EUR/USD, BTC/USD, Apple Inc., Gold, S&P500, NAS100). Look at the chart title, legend, or symbol label. If unclear, make your best guess based on price range.",
  "timeframe": "Visible timeframe of the PRIMARY chart if identifiable (e.g. 1H, 4H, Daily, Weekly), or 'Unknown'",
  "priceMin": <number — EXACT lowest price shown on the right price axis of the PRIMARY chart>,
  "priceMax": <number — EXACT highest price shown on the right price axis of the PRIMARY chart>,
  "direction": "BUY" or "SELL",
  "entry": <number — suggested entry price within priceMin and priceMax>,
  "sl": <number — stop loss price beyond the invalidation zone>,
  "tp1": <number — first take profit at 1R>,
  "tp2": <number — second take profit at 2R>,
  "tp3": <number — third take profit at 3R>,
  "confidence": "LOW" or "MEDIUM" or "GOOD",
  "confidenceScore": <integer from 40 to 85>,
  "explanation": "2-3 sentences explaining the setup in simple, educational language. Reference actual price levels visible on the chart.",
  "setupQuality": "One sentence on setup quality and what to watch for.",
  "keyLevels": "Brief description of the key support/resistance levels you identified on the PRIMARY chart.",
  "multiTimeframeContext": "2-4 sentences summarising the bias and key confluences found across all timeframes. Mention whether the higher timeframe trend supports or contradicts the setup, and any confluence zones identified."
}

Critical rules:
- priceMin and priceMax MUST be read from the right price axis labels of the PRIMARY chart.
- All price values (entry, sl, tp1, tp2, tp3) MUST be within or very close to the priceMin/priceMax range of the PRIMARY chart.
- For BUY: sl must be BELOW entry; tp1, tp2, tp3 must be ABOVE entry.
- For SELL: sl must be ABOVE entry; tp1, tp2, tp3 must be BELOW entry.
- tp1 = entry ± 1 × (entry - sl), tp2 = ± 2 ×, tp3 = ± 3 × (using the actual risk distance).
- Never use language like "guaranteed", "safe signal", or "winning trade".
- If charts are unclear, still provide your best estimate and set confidence to "LOW".`;

router.post("/", async (req, res) => {
  const imageDataUrl: unknown = req.body?.imageDataUrl;
  if (typeof imageDataUrl !== "string" || imageDataUrl.length < 10) {
    res.status(400).json({ error: "Invalid request: imageDataUrl is required" });
    return;
  }

  if (!imageDataUrl.startsWith("data:image/")) {
    res.status(400).json({ error: "Invalid image format: must be a data URL" });
    return;
  }

  const base64 = imageDataUrl.split(",")[1];
  const mimeType = imageDataUrl.split(";")[0].split(":")[1];

  if (!base64) {
    res.status(400).json({ error: "Could not extract image data" });
    return;
  }

  // Extract optional primary timeframe label
  const primaryTimeframe: string =
    typeof req.body?.primaryTimeframe === "string" ? req.body.primaryTimeframe.trim() : "";

  // Validate and extract additional images — accept all; use "Unknown" as fallback timeframe
  const additionalImages: Array<{ imageDataUrl: string; timeframe: string }> = [];
  const rawAdditional = req.body?.additionalImages;
  if (Array.isArray(rawAdditional)) {
    for (const item of rawAdditional) {
      if (
        item &&
        typeof item.imageDataUrl === "string" &&
        item.imageDataUrl.startsWith("data:image/")
      ) {
        const tf = typeof item.timeframe === "string" && item.timeframe.trim().length > 0
          ? item.timeframe.trim()
          : "Unknown";
        additionalImages.push({ imageDataUrl: item.imageDataUrl, timeframe: tf });
      }
    }
  }

  const isMultiTimeframe = additionalImages.length > 0;
  const systemPrompt = isMultiTimeframe ? MULTI_TIMEFRAME_SYSTEM_PROMPT : SYSTEM_PROMPT;

  // Build user content: primary chart + optional additional charts
  type ContentBlock =
    | { type: "image_url"; image_url: { url: string; detail: "high" } }
    | { type: "text"; text: string };

  const userContent: ContentBlock[] = [];

  if (isMultiTimeframe) {
    const primaryLabel = primaryTimeframe
      ? `PRIMARY chart — ${primaryTimeframe} timeframe (base all trade levels on this one):`
      : "PRIMARY chart (base all trade levels on this one):";
    userContent.push({
      type: "text",
      text: primaryLabel,
    });
  }

  userContent.push({
    type: "image_url",
    image_url: {
      url: `data:${mimeType};base64,${base64}`,
      detail: "high",
    },
  });

  for (const additional of additionalImages) {
    const addBase64 = additional.imageDataUrl.split(",")[1];
    const addMimeType = additional.imageDataUrl.split(";")[0].split(":")[1];
    if (!addBase64) continue;

    userContent.push({
      type: "text",
      text: `Additional chart — ${additional.timeframe} timeframe:`,
    });
    userContent.push({
      type: "image_url",
      image_url: {
        url: `data:${addMimeType};base64,${addBase64}`,
        detail: "high",
      },
    });
  }

  userContent.push({
    type: "text",
    text: isMultiTimeframe
      ? "Analyse all charts together for confluence. Base trade levels on the PRIMARY chart. Return the JSON trade plan including multiTimeframeContext."
      : "Analyze this financial chart. Read the price axis carefully and return the JSON trade plan.",
  });

  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 1024,
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: userContent,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    res.status(500).json({ error: "No response from AI model" });
    return;
  }

  let plan: Record<string, unknown>;
  try {
    const cleaned = content
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    plan = JSON.parse(cleaned);
  } catch {
    req.log.error({ content }, "Failed to parse AI response as JSON");
    res.status(500).json({ error: "AI returned an unexpected response format. Please try again." });
    return;
  }

  // If user is authenticated, persist the analysis
  const userId = req.session.user?.id;

  if (userId) {
    try {
      const risk = Math.abs((plan.entry as number) - (plan.sl as number));
      const isBuy = plan.direction === "BUY";
      const entry = plan.entry as number;
      const sl = plan.sl as number;
      const rrTp1 = risk > 0 ? Number((Math.abs((isBuy ? entry + risk : entry - risk) - entry) / risk).toFixed(2)) : 0;
      const rrTp2 = risk > 0 ? Number((Math.abs((isBuy ? entry + risk * 2 : entry - risk * 2) - entry) / risk).toFixed(2)) : 0;
      const rrTp3 = risk > 0 ? Number((Math.abs((isBuy ? entry + risk * 3 : entry - risk * 3) - entry) / risk).toFixed(2)) : 0;

      const id = randomBytes(8).toString("hex");
      await db.insert(analysesTable).values({
        id,
        userId,
        context: (plan.context as string) || "",
        timeframe: (plan.timeframe as string) || "",
        direction: plan.direction as string,
        entry: entry,
        sl: sl,
        tp1: plan.tp1 as number,
        tp2: plan.tp2 as number,
        tp3: plan.tp3 as number,
        rrRatio: rrTp3,
        rrTp1,
        rrTp2,
        rrTp3,
        confidence: plan.confidence as string,
        confidenceScore: plan.confidenceScore as number,
        explanation: (plan.explanation as string) || "",
        setupQuality: (plan.setupQuality as string) || "",
        keyLevels: (plan.keyLevels as string) || "",
        priceMin: plan.priceMin as number,
        priceMax: plan.priceMax as number,
        imageDataUrl,
      });

      plan = { ...plan, id };
    } catch (err) {
      req.log.error({ err }, "Failed to save analysis to database");
      // Non-fatal: still return the plan even if save fails
    }
  }

  res.json(plan);
});

export default router;
