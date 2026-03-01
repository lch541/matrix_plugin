import { exec } from "child_process";
import { config } from "../config.js";
import { logger } from "../utils/logger.js";
import { matrixClient } from "../matrix/client.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const reviveCommand = {
  execute: async (roomId: string, token: string) => {
    const storedToken = config.getReviveToken();
    
    if (!storedToken) {
      await matrixClient.sendMessage(roomId, "⚠️ Revoke 功能未启用，请先设置 Token: openclaw token set <你的密码>");
      return;
    }
    
    if (token !== storedToken) {
      await matrixClient.sendMessage(roomId, "❌ Token 验证失败");
      return;
    }
    
    await matrixClient.sendMessage(roomId, "✅ 验证通过，正在触发回滚...");
    await matrixClient.sendMessage(roomId, "🔄 正在执行回滚...");
    
    // 假设 revive.sh 在 OpenClaw 根目录，这里需要根据实际情况调整
    // 暂时假设它在项目根目录的上一级 (OpenClaw 目录)
    const scriptPath = path.join(__dirname, "../../../revive.sh");
    
    exec(`bash ${scriptPath}`, async (error, stdout, stderr) => {
      if (error) {
        logger.error(`执行 revive.sh 失败: ${error.message}`);
        await matrixClient.sendMessage(roomId, `❌ 回滚失败: ${error.message}`);
        return;
      }
      if (stderr) {
        logger.warn(`revive.sh 输出错误: ${stderr}`);
      }
      
      logger.info(`revive.sh 执行成功: ${stdout}`);
      await matrixClient.sendMessage(roomId, `✅ 回滚成功！\n${stdout}`);
    });
  }
};
