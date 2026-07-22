import { useEffect, useMemo } from "react";
import { realtimeNotificationService } from "@/services/realtimeNotificationService";
import useAuthStore from "@/stores/useAuthStore.jsx";

function createChannelKey(channels) {
  const list = Array.isArray(channels) ? channels : [channels];
  return list.map((channel) => String(channel || "").trim()).filter(Boolean).join("|");
}

export function useNotificationWebSocket({
  enabled = true,
  onMessage,
  channels = [],
}) {
  const roleCode = useAuthStore(
    (state) => state.user?.role?.code || state.user?.role_code,
  );
  const channelKey = createChannelKey(channels);
  const socketChannels = useMemo(
    () => (channelKey ? channelKey.split("|") : []),
    [channelKey],
  );

  useEffect(() => {
    if (!enabled || typeof onMessage !== "function") return undefined;

    const removeListener = realtimeNotificationService.onMessage(onMessage);
    realtimeNotificationService.connect({ roleCode, channels: socketChannels });

    return () => {
      removeListener();
      realtimeNotificationService.disconnect();
    };
  }, [enabled, onMessage, roleCode, socketChannels]);
}
