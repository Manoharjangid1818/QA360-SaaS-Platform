import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import aiGenerateRouter from "./ai-generate.js";
import testCasesRouter from "./test-cases.js";
import bugsRouter from "./bugs.js";
import schedulesRouter from "./schedules.js";
import cicdRouter from "./cicd.js";
import reportsRouter from "./reports.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(aiGenerateRouter);
router.use(testCasesRouter);
router.use(bugsRouter);
router.use(schedulesRouter);
router.use(cicdRouter);
router.use(reportsRouter);

export default router;
