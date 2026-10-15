import { Router } from "express";
import { getPublicDoc } from "../controllers/docController.js";

const router = Router();

router.get("/:shareId", getPublicDoc); // no protect: anyone with the link

export default router;