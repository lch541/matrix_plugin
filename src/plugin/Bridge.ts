import { Server, Socket } from "socket.io";
import { MatrixClient, MatrixConfig } from "./MatrixClient";

export class Bridge {
  private matrix: MatrixClient | null = null;

  constructor(private io: Server) {
    this.setupSocket();
  }

  private setupSocket() {
    this.io.on("connection", (socket: Socket) => {
      console.log("Bridge: OpenClaw connected");

      socket.on("openclaw_update", (data: { update: string }) => {
        this.matrix?.sendMessage(`[OpenClaw Operation]: ${data.update}`, "m.notice");
      });

      socket.on("openclaw_typing", (data: { isTyping: boolean }) => {
        this.matrix?.sendTyping(data.isTyping);
      });

      socket.on("openclaw_response", (data: { response: string }) => {
        this.matrix?.sendMessage(data.response);
        this.matrix?.sendTyping(false);
      });
    });
  }

  async connectMatrix(config: MatrixConfig) {
    if (this.matrix) this.matrix.stop();
    
    this.matrix = new MatrixClient(config);
    await this.matrix.start((sender, body) => {
      if (body.startsWith("/")) {
        this.handleCommand(body);
      } else {
        this.io.emit("matrix_message", { sender, body });
      }
    });
  }

  private async handleCommand(body: string) {
    const [command, ...args] = body.slice(1).split(" ");
    
    switch (command.toLowerCase()) {
      case "help":
        await this.matrix?.sendMessage(
          "Available Commands:\n/help - Show this message\n/status - Check plugin status\n/ping - Test connectivity\n/about - About OpenClaw Matrix",
          "m.notice",
          "<h3>Available Commands</h3><ul><li><b>/help</b> - Show this message</li><li><b>/status</b> - Check plugin status</li><li><b>/ping</b> - Test connectivity</li><li><b>/about</b> - About OpenClaw Matrix</li></ul>"
        );
        break;
      case "status":
        const status = this.isMatrixConnected() ? "🟢 Connected" : "🔴 Disconnected";
        await this.matrix?.sendMessage(`Status: ${status}`, "m.notice");
        break;
      case "ping":
        await this.matrix?.sendMessage("🏓 Pong!", "m.notice");
        break;
      case "about":
        await this.matrix?.sendMessage(
          "OpenClaw Matrix Plugin v1.0.0\nA secure communication bridge for OpenClaw.",
          "m.notice",
          "<b>OpenClaw Matrix Plugin v1.0.0</b><br/>A secure communication bridge for OpenClaw."
        );
        break;
      default:
        await this.matrix?.sendMessage(`Unknown command: /${command}. Type /help for a list of commands.`, "m.notice");
    }
  }

  isMatrixConnected() {
    return !!this.matrix;
  }
}
