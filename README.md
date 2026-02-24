# OpenClaw Matrix Plugin

This plugin allows **OpenClaw** to communicate over the Matrix protocol. It features end-to-end encryption (handled by the client), real-time typing indicators, and operation stream updates.

## 🚀 Installation

1. **Copy the Folder**: Copy this entire directory into your OpenClaw `extensions/` or `plugins/` folder.
   ```bash
   cp -r openclaw-matrix-plugin /path/to/openclaw/extensions/
   ```

2. **Install Dependencies**:
   Navigate to the plugin folder and install the required packages:
   ```bash
   cd /path/to/openclaw/extensions/openclaw-matrix-plugin
   npm install
   ```

3. **Onboarding**:
   - Restart OpenClaw.
   - Go to the **Extensions** settings in the OpenClaw dashboard.
   - Click **Enable** on the "Matrix Communication Bridge".
   - Follow the onboarding wizard to enter your Matrix credentials (Homeserver, User ID, Access Token, and Room ID).

## 🛠 Features

- **E2EE Support**: Uses `matrix-js-sdk` for secure communication.
- **Typing Status**: Automatically sends "typing..." status to Matrix while OpenClaw is processing.
- **Operation Updates**: Sends real-time "notices" to the Matrix room describing what OpenClaw is doing (e.g., "Analyzing context...", "Consulting knowledge base...").
- **Fresh Start**: Automatically discards any messages sent before the plugin was initialized to prevent processing old backlog.
- **Command System**: Supports Telegram-like bot commands (e.g., `/help`, `/status`, `/ping`, `/about`) for easy interaction and management directly from Matrix.
- **Persistent Config**: Stores configuration in `matrix_config.md`. The plugin will automatically reconnect using these credentials on startup, making it easy to recover from reboots or reinstalls.
- **WebSocket Bridge**: Uses Socket.io to bridge Matrix events to the OpenClaw frontend.

## 🔑 Requirements

- A Matrix account (bot account recommended).
- A Matrix Access Token (can be obtained from Element settings or via API).
- Node.js 18+ environment.
