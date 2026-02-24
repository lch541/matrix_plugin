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
      // Forward all messages (including commands) to OpenClaw frontend without filtering
      this.io.emit("matrix_message", { sender, body });
    });
  }

  isMatrixConnected() {
    return !!this.matrix;
  }

  async createPrivateChat(userId: string) {
    if (!this.matrix) throw new Error("Matrix not connected");
    return await this.matrix.createPrivateRoom(userId);
  }
}
