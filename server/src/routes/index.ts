import commentRouter from "./commentRoute";
import { Router } from "express";

const router=Router();

router.use('/',commentRouter);

export default router;