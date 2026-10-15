import { Router } from "express";
import {
  createDoc,
  listDocs,
  getDoc,
  updateDoc,
  deleteDoc,
} from "../controllers/docController.js";
import protect from "../middleware/auth.js";

const router = Router();

router.use(protect); // every doc route needs login

router.post("/", createDoc);
router.get("/", listDocs);
router.get("/:id", getDoc);
router.put("/:id", updateDoc);
router.delete("/:id", deleteDoc);

export default router;