import { tokenManager } from "@/lib/tokenManager";

const DEFAULT_CHANNELS = ["all"];

function normalizeChannels(channels = []) {
  const list = Array.isArray(channels) ? channels : [channels];
  return list.map((channel) => String(channel).trim()).filter(Boolean);
}

function createSocketUrl() {
  const baseUrl = (import.meta.env.VITE_WS_URL || "").trim();
  if (!baseUrl) return "";

  const normalizedUrl = baseUrl.replace(/^http/i, "ws").replace(/\/$/, "");
  const url = new URL(
    normalizedUrl.toLowerCase().endsWith("/ws")
      ? normalizedUrl
      : `${normalizedUrl}/ws`,
  );
  const token = tokenManager.getAccessToken();
  if (token) url.searchParams.set("token", token);
  return url.toString();
}

class RealtimeNotificationService {
  socket = null;
  reconnectTimer = null;
  reconnectAttempt = 0;
  listeners = new Set();
  channels = new Set(DEFAULT_CHANNELS);
  manuallyClosed = false;
  activeConsumers = 0;

  connect({ roleCode, channels = [], trackConsumer = true } = {}) {
    if (typeof WebSocket === "undefined") return;
    if (trackConsumer) this.activeConsumers += 1;

    const nextChannels = [
      ...(roleCode ? [`role_${roleCode}`] : []),
      ...normalizeChannels(channels),
    ];
    nextChannels.forEach((channel) => this.channels.add(channel));

    if (
      this.socket?.readyState === WebSocket.OPEN ||
      this.socket?.readyState === WebSocket.CONNECTING
    ) {
      if (this.socket.readyState === WebSocket.OPEN) {
        this.subscribe(nextChannels);
      }
      return;
    }

    const url = createSocketUrl();
    if (!url) return;

    this.manuallyClosed = false;
    this.socket = new WebSocket(url);

    this.socket.addEventListener("open", () => {
      this.reconnectAttempt = 0;
      this.subscribe([...this.channels]);
    });

    this.socket.addEventListener("message", (event) => {
      try {
        const message = JSON.parse(event.data);
        this.listeners.forEach((listener) => listener(message));
      } catch {
        // Bỏ qua payload không phải JSON từ bên ngoài giao thức.
      }
    });

    this.socket.addEventListener("close", () => {
      this.socket = null;
      if (!this.manuallyClosed) this.scheduleReconnect({ roleCode });
    });

    this.socket.addEventListener("error", () => {
      this.socket?.close();
    });
  }

  scheduleReconnect(options) {
    window.clearTimeout(this.reconnectTimer);
    const delay = Math.min(30_000, 1_000 * 2 ** this.reconnectAttempt);
    this.reconnectAttempt += 1;
    this.reconnectTimer = window.setTimeout(
      () => this.connect({ ...options, trackConsumer: false }),
      delay,
    );
  }

  subscribe(channels = []) {
    normalizeChannels(channels).forEach((channel) => this.channels.add(channel));
    if (this.socket?.readyState !== WebSocket.OPEN) return;

    this.socket.send(
      JSON.stringify({
        action: "subscribe",
        channels: [...this.channels],
      }),
    );
  }

  onMessage(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  disconnect() {
    this.activeConsumers = Math.max(0, this.activeConsumers - 1);
    if (this.activeConsumers > 0) return;

    this.manuallyClosed = true;
    window.clearTimeout(this.reconnectTimer);
    this.socket?.close(1000, "Client disconnected");
    this.socket = null;
    this.channels = new Set(DEFAULT_CHANNELS);
  }
}

export const realtimeNotificationService = new RealtimeNotificationService();
