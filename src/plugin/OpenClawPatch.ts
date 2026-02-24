import { GoogleGenAI } from "@google/genai";
import { Socket } from "socket.io-client";

export class OpenClawPatch {
  private ai: GoogleGenAI;

  constructor(private socket: Socket, apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async processMessage(text: string, onLog: (msg: string, type: any) => void) {
    try {
      const model = "gemini-3-flash-preview";
      onLog(`OpenClaw: Processing "${text}"`, "ai");
      
      this.socket.emit("openclaw_typing", { isTyping: true });

      const operations = ["🔍 Analyzing context...", "🧠 Thinking...", "✅ Finalizing..."];
      for (const op of operations) {
        onLog(`Operation: ${op}`, "ai");
        this.socket.emit("openclaw_update", { update: op });
        await new Promise(r => setTimeout(r, 800));
      }

      const result = await this.ai.models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: `You are OpenClaw. Respond to: ${text}` }] }],
      });

      const response = result.text || "No response generated.";
      this.socket.emit("openclaw_response", { response });
      onLog("OpenClaw: Response sent", "success");
    } catch (err: any) {
      onLog(`OpenClaw Error: ${err.message}`, "error");
      this.socket.emit("openclaw_typing", { isTyping: false });
    }
  }
}
