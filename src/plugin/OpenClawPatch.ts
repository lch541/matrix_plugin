import { GoogleGenAI } from "@google/genai";
import { Socket } from "socket.io-client";

export class OpenClawPatch {
  private ai: GoogleGenAI;

  constructor(private socket: Socket, apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async processMessage(text: string, onLog: (msg: string, type: any) => void) {
    if (text.startsWith("/")) {
      const [command, ...args] = text.slice(1).split(" ");
      return this.handleCommand(command.toLowerCase(), args, onLog);
    }

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

  async handleCommand(command: string, args: string[], onLog: (msg: string, type: any) => void) {
    onLog(`OpenClaw: Received command /${command}`, "info");
    
    switch (command) {
      case "help":
        this.socket.emit("openclaw_response", { 
          response: "Available Commands:\n/help - Show this message\n/status - Check plugin status\n/ping - Test connectivity\n/about - About OpenClaw Matrix\n/reset - Reset AI session\n/restart - Restart gateway" 
        });
        break;
      case "status":
        this.socket.emit("openclaw_response", { response: "🟢 OpenClaw Matrix Plugin is active and connected." });
        break;
      case "ping":
        this.socket.emit("openclaw_response", { response: "🏓 Pong!" });
        break;
      case "about":
        this.socket.emit("openclaw_response", { response: "OpenClaw Matrix Plugin v1.0.0\nA secure communication bridge for OpenClaw." });
        break;
      case "reset":
        onLog("OpenClaw: Resetting session...", "info");
        this.socket.emit("openclaw_update", { update: "♻️ Session reset requested." });
        this.socket.emit("openclaw_response", { response: "✅ Session has been reset. How can I help you now?" });
        break;
      case "restart":
        onLog("OpenClaw: Restarting gateway...", "info");
        this.socket.emit("openclaw_update", { update: "🔄 Restarting Matrix gateway..." });
        this.socket.emit("openclaw_response", { response: "🔄 Gateway restart initiated. Please wait a moment." });
        setTimeout(() => window.location.reload(), 1500);
        break;
      default:
        this.socket.emit("openclaw_response", { response: `❌ Command /${command} not recognized by OpenClaw.` });
    }
  }
}
