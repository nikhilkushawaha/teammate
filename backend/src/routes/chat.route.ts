import { Router } from "express";
import {
  getChatMessagesController,
  createChatMessageController,
} from "../controllers/chat.controller";

const chatRoutes = Router();

chatRoutes.get(
  "/workspace/:workspaceId/messages",
  getChatMessagesController
);

chatRoutes.post(
  "/workspace/:workspaceId/messages",
  createChatMessageController
);

export default chatRoutes;

