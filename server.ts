import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import dotenv from "dotenv";
import { Server } from "socket.io";
import { createServer } from "http";
import fs from "fs";
import path from "path";
import { Bridge } from "./src/plugin/Bridge";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });
const bridge = new Bridge(io);

const PORT = 3000;
const CONFIG_FILE = path.join(process.cwd(), "matrix_config.md");

app.use(cors());
app.use(express.json());

// --- Config Helpers ---
function saveConfig(config: any) {
  const content = `# Matrix Configuration\n\n\`\`\`json\n${JSON.stringify(config, null, 2)}\n\`\`\``;
  fs.writeFileSync(CONFIG_FILE, content, "utf8");
}

function loadConfig() {
  if (!fs.existsSync(CONFIG_FILE)) return null;
  const match = fs.readFileSync(CONFIG_FILE, "utf8").match(/```json\n([\s\S]*?)\n```/);
  return match ? JSON.parse(match[1]) : null;
}

// --- API ---
app.get("/api/matrix/config", (req, res) => res.json(loadConfig() || {}));
app.get("/api/matrix/status", (req, res) => res.json({ connected: bridge.isMatrixConnected() }));
app.post("/api/matrix/connect", async (req, res) => {
  try {
    await bridge.connectMatrix(req.body);
    saveConfig(req.body);
    res.json({ status: "connected" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- Vite ---
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  httpServer.listen(PORT, "0.0.0.0", async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    const config = loadConfig();
    if (config?.accessToken) {
      console.log("Auto-connecting Matrix...");
      try { await bridge.connectMatrix(config); } catch (e) { console.error(e); }
    }
  });
}

setupVite();
