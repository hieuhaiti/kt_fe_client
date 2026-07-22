import { useCallback, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  markAllNotificationsAsRead,
  markNotificationAsRead,
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
} from "@/services/notificationService";
import { useNotificationWebSocket } from "@/hooks/useNotificationWebSocket";
import { cn, formatDateTime } from "@/lib/utils";

const params = { page: 1, limit: 10, onlyUnread: false };

export default function NotificationMenu({ enabled = true }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const query = useGetNotificationsQuery(params, {
    enabled,
    refetchOnWindowFocus: false,
    refetchInterval: enabled ? 30_000 : false,
  });
  const unreadQuery = useGetUnreadCountQuery({
    enabled,
    refetchOnWindowFocus: false,
    refetchInterval: enabled ? 30_000 : false,
  });

  const notifications = useMemo(
    () =>
      Array.isArray(query.data?.data?.items) ? query.data.data.items : [],
    [query.data],
  );
  const unreadCount = Number(
    unreadQuery.data?.data?.unread ??
      notifications.filter((item) => !item.isRead).length,
  );

  const refreshNotifications = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }, [queryClient]);

  const handleSocketMessage = useCallback(
    (message) => {
      if (message?.event !== "notification") return;
      refreshNotifications();
      if (!open) {
        toast.info(
          message.data?.title || message.data?.body || "Bạn có thông báo mới",
          { toastId: `notification-${message.data?.id || "new"}` },
        );
      }
    },
    [open, refreshNotifications],
  );

  useNotificationWebSocket({ enabled, onMessage: handleSocketMessage });

  const markOneMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: refreshNotifications,
  });
  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: refreshNotifications,
  });

  if (!enabled) return null;

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) refreshNotifications();
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant={unreadCount > 0 ? "soft-primary" : "outline"}
          size="icon"
          className="relative rounded-xl"
          aria-label={
            unreadCount
              ? `${unreadCount} thông báo chưa đọc`
              : "Mở thông báo"
          }
        >
          <Bell />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1.5 -top-1.5 h-5 min-w-5 justify-center px-1 text-[10px]"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[min(24rem,calc(100vw-1rem))] rounded-2xl p-2"
      >
        <div className="flex items-center justify-between gap-3 px-2 py-1">
          <DropdownMenuLabel className="px-0 text-base">
            Thông báo
          </DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              isLoading={markAllMutation.isPending}
              onClick={() => markAllMutation.mutate()}
              className="text-xs"
            >
              <CheckCheck />
              Đọc tất cả
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />

        {query.isFetching && notifications.length === 0 && (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">
            Đang tải thông báo...
          </p>
        )}

        {!query.isFetching && query.isError && (
          <p className="px-3 py-8 text-center text-sm text-destructive">
            Không thể tải thông báo.
          </p>
        )}

        {!query.isFetching && !query.isError && notifications.length === 0 && (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">
            Bạn chưa có thông báo nào.
          </p>
        )}

        <div className="max-h-96 overflow-y-auto">
          {notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className={cn(
                "mb-1 cursor-pointer flex-col items-start gap-1 rounded-xl p-3 whitespace-normal",
                !notification.isRead && "bg-(--primary-subtle)",
              )}
              onSelect={() => {
                if (!notification.isRead) {
                  markOneMutation.mutate(notification.id);
                }
              }}
            >
              <div className="flex w-full items-start justify-between gap-3">
                <p className="text-sm font-semibold text-foreground">
                  {notification.title || "Thông báo"}
                </p>
                {!notification.isRead && (
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                )}
              </div>
              {notification.body && (
                <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
                  {notification.body}
                </p>
              )}
              <time className="text-[11px] text-muted-foreground">
                {formatDateTime(notification.createdAt)}
              </time>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
