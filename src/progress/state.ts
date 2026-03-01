const VERBOSE_ENABLE_KEYWORDS = [
  '进度条模式已开启',
  'verbose mode enabled',
  'verbose on',
];

const VERBOSE_DISABLE_KEYWORDS = [
  '进度条模式已关闭',
  'verbose mode disabled',
  'verbose off',
];

export function detectVerboseState(message: string): 'enable' | 'disable' | null {
  const lowerMessage = message.toLowerCase();
  
  if (VERBOSE_ENABLE_KEYWORDS.some(k => lowerMessage.includes(k.toLowerCase()))) {
    return 'enable';
  }
  if (VERBOSE_DISABLE_KEYWORDS.some(k => lowerMessage.includes(k.toLowerCase()))) {
    return 'disable';
  }
  return null;
}

interface ProgressState {
  progressEnabled: boolean;
  currentMessageId: string | null;
  currentRoomId: string | null;
}

class ProgressStateManager {
  private state: ProgressState = {
    progressEnabled: false,
    currentMessageId: null,
    currentRoomId: null,
  };

  enable() { this.state.progressEnabled = true; }
  disable() { this.state.progressEnabled = false; }
  isEnabled() { return this.state.progressEnabled; }

  setCurrentMessage(roomId: string, messageId: string) {
    this.state.currentRoomId = roomId;
    this.state.currentMessageId = messageId;
  }

  clearCurrentMessage() {
    this.state.currentRoomId = null;
    this.state.currentMessageId = null;
  }

  getCurrentMessage() {
    return {
      roomId: this.state.currentRoomId,
      messageId: this.state.currentMessageId,
    };
  }
}

export const progressState = new ProgressStateManager();
