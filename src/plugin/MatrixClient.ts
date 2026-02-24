import * as sdk from "matrix-js-sdk";

export interface MatrixConfig {
  homeserver: string;
  accessToken: string;
  userId: string;
  roomId: string;
}

export class MatrixClient {
  private client: sdk.MatrixClient | null = null;
  private startTime: number = Date.now();

  constructor(private config: MatrixConfig) {}

  async start(onMessage: (sender: string, body: string) => void) {
    this.startTime = Date.now();
    this.client = sdk.createClient({
      baseUrl: this.config.homeserver,
      accessToken: this.config.accessToken,
      userId: this.config.userId,
    });

    this.client.on(sdk.RoomEvent.Timeline, (event, room, toStartOfTimeline) => {
      if (toStartOfTimeline) return;
      if (event.getType() !== "m.room.message") return;
      if (event.getRoomId() !== this.config.roomId) return;
      if (event.getSender() === this.config.userId) return;

      // Ignore old messages
      if (event.getTs() < this.startTime) return;

      const body = event.getContent().body;
      onMessage(event.getSender() || "unknown", body);
    });

    await this.client.startClient({ initialSyncLimit: 1 });
  }

  stop() {
    this.client?.stopClient();
  }

  async sendMessage(body: string, msgtype: string = "m.text", formattedBody?: string) {
    const content: any = {
      msgtype: msgtype as any,
      body,
    };
    if (formattedBody) {
      content.format = "org.matrix.custom.html";
      content.formatted_body = formattedBody;
    }
    return this.client?.sendMessage(this.config.roomId, content);
  }

  async sendTyping(isTyping: boolean) {
    return this.client?.sendTyping(this.config.roomId, isTyping, isTyping ? 30000 : 0);
  }

  async createPrivateRoom(userId: string) {
    if (!this.client) throw new Error("Matrix client not initialized");
    const response = await this.client.createRoom({
      invite: [userId],
      preset: "trusted_private_chat" as any,
      is_direct: true,
    });
    return response.room_id;
  }
}
