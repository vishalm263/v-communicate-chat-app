import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { 
  addReaction, 
  deleteMessage, 
  editMessage, 
  getMessages, 
  getUsersForSidebar, 
  sendMessage,
  markMessagesAsSeen
} from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users-sidebar", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);

router.post("/:id", protectRoute, sendMessage);
router.put("/:id", protectRoute, editMessage);
router.delete("/:id", protectRoute, deleteMessage);
router.post("/:id/react", protectRoute, addReaction);
router.post("/:id/seen", protectRoute, markMessagesAsSeen);

export default router;
