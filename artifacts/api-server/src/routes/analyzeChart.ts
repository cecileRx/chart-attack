import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

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

  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 1024,
    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${base64}`,
              detail: "high",
            },
          },
          {
            type: "text",
            text: "Analyze this financial chart. Read the price axis carefully and return the JSON trade plan.",
          },
        ],
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    res.status(500).json({ error: "No response from AI model" });
    return;
  }

  let plan: unknown;
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

  res.json(plan);
});

export default router;
