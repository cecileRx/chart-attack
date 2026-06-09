import { Router, type IRouter } from "express";
import healthRouter from "./health";
import analyzeChartRouter from "./analyzeChart";
import historyRouter from "./history";
import keysRouter from "./keys";
import ingestRouter from "./ingest";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/analyze-chart", analyzeChartRouter);
router.use("/history", historyRouter);
router.use("/keys", keysRouter);
router.use("/ingest", ingestRouter);

export default router;
