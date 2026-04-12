import { Router, type IRouter } from "express";
import healthRouter from "./health";
import analyzeChartRouter from "./analyzeChart";
import historyRouter from "./history";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/analyze-chart", analyzeChartRouter);
router.use("/history", historyRouter);

export default router;
