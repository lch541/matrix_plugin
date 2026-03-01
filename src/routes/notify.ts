import { Router } from "express";
import { matrixClient } from "../matrix/client.js";
import { config } from "../config.js";
import { logger } from "../utils/logger.js";

const router = Router();

router.post("/notify", async (req, res) => {
  const { message, roomId } = req.body;

  if (!message) {
    return res.status(400).json({ success: false, error: "Invalid request: message is required" });
  }

  if (!matrixClient.isReady()) {
    return res.status(503).json({ success: false, error: "Matrix client not ready" });
  }

  try {
    const targetRoomId = roomId || config.roomId;
    if (!targetRoomId) {
      return res.status(400).json({ success: false, error: "Room ID not specified and no default configured" });
    }

    const response = await matrixClient.sendMessage(targetRoomId, message);
    res.json({ success: true, eventId: response.event_id });
  } catch (err: any) {
    logger.error("发送通知失败:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
