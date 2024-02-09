import express from "express";
const router = express.Router();
import * as ctrlUser from "./controller.js";

router.get("/", ctrlUser.getUsers);
router.post("/signup", ctrlUser.signup);
router.post("/login", ctrlUser.login);
router.get("/logout", ctrlUser.auth, ctrlUser.logout);
router.get("/current", ctrlUser.auth, ctrlUser.current);

export default router;
