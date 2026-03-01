import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG_DIR = path.join(__dirname, "../config");
const TOKEN_FILE = path.join(CONFIG_DIR, "revive_token");

if (!fs.existsSync(CONFIG_DIR)) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
}

export const config = {
  homeserver: process.env.REAL_HOMESERVER || "https://matrix.org",
  userId: process.env.USER_ID || "",
  accessToken: process.env.ACCESS_TOKEN || "",
  roomId: process.env.ROOM_ID || "",
  deviceId: process.env.DEVICE_ID || "OPENCLAW_PROXY",
  proxyPort: parseInt(process.env.PROXY_PORT || "3344", 10),
  storagePath: path.join(__dirname, "../.matrix_storage"),
  
  getReviveToken: (): string | null => {
    if (fs.existsSync(TOKEN_FILE)) {
      return fs.readFileSync(TOKEN_FILE, "utf8").trim();
    }
    return null;
  },
  
  setReviveToken: (token: string) => {
    fs.writeFileSync(TOKEN_FILE, token, "utf8");
  },
  
  removeReviveToken: () => {
    if (fs.existsSync(TOKEN_FILE)) {
      fs.unlinkSync(TOKEN_FILE);
    }
  }
};
