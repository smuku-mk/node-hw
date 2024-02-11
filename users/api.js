import express from "express";
const router = express.Router();
import * as ctrlUser from "./controller.js";
import upload from "./multer.js";

router.get("/", ctrlUser.getUsers);
router.post("/signup", ctrlUser.signup);
router.post("/login", ctrlUser.login);
router.get("/logout", ctrlUser.auth, ctrlUser.logout);
router.get("/current", ctrlUser.auth, ctrlUser.current);
router.patch("/avatars", ctrlUser.auth, upload.single("avatar"), ctrlUser.avatar);
router.get("/verify/:verificationToken", ctrlUser.verification);
router.post("/verify", ctrlUser.sendEmailAgain);

export default router;
