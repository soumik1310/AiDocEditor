import { Router } from "express";
import { createDoc, listDocs, getDoc } from "../controllers/docController.js";
import protect from "../middleware/auth.js";

const router = Router();

router.use(protect); // every doc route needs login

router.post("/", createDoc);
router.get("/", listDocs);
router.get("/:id", getDoc);

export default router;