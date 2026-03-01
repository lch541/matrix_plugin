import { config } from "../config.js";
import { logger } from "../utils/logger.js";
import { matrixClient } from "../matrix/client.js";

export const tokenCommand = {
  set: async (roomId: string, token: string) => {
    config.setReviveToken(token);
    logger.info(`Token 已设置: ${token.slice(0, 2)}...`);
    await matrixClient.sendMessage(roomId, "✅ Token 设置成功！");
  },
  
  show: async (roomId: string) => {
    const token = config.getReviveToken();
    if (token) {
      const masked = `${token.slice(0, 2)}****${token.slice(-2)}`;
      await matrixClient.sendMessage(roomId, `🔑 当前 Token: ${masked}`);
    } else {
      await matrixClient.sendMessage(roomId, "⚠️ 未设置 Token。");
    }
  },
  
  remove: async (roomId: string) => {
    config.removeReviveToken();
    logger.info("Token 已删除");
    await matrixClient.sendMessage(roomId, "✅ Token 已删除。");
  }
};
