import express from "express";
import { checkAuth, login, logout, signup, updateProfile } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import User from "../models/user.model.js"; 

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

router.put("/update-profile", protectRoute, updateProfile);

router.put("/preferences", protectRoute, async (req, res) => {
    try {
      const user = await User.findById(req.user._id);
      user.preferredLanguage = req.body.preferredLanguage || null;
      await user.save();
      res.status(200).json({ preferredLanguage: user.preferredLanguage });
    } catch (err) {
      res.status(500).json({ error: "Failed to update preferences" });
    }
  });
  

router.get("/check", protectRoute, checkAuth);

export default router;
