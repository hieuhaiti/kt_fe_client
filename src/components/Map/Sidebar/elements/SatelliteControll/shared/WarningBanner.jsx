import { createElement } from "react";
import { AlertTriangle, Clock, Zap, RefreshCw } from "lucide-react";

const NOTES = [
  {
    icon: Clock,
    text: "Thời gian tải phụ thuộc kết nối và phạm vi dữ liệu.",
  },
  {
    icon: Zap,
    text: "Ảnh vệ tinh có thể hiển thị chậm.",
  },
  {
    icon: RefreshCw,
    text: "Ảnh chưa hiển thị. Hãy thử tải lại lớp ảnh.",
  },
];

/**
 * Warning banner shown above satellite config panels.
 * Always visible regardless of collapse state.
 */
export function WarningBanner() {
  return (
    <div className="relative w-full overflow-hidden border-y border-warning/40 bg-linear-to-br from-warning/10 via-warning/5 to-transparent">
      <div className="absolute left-0 top-0 h-full w-1 bg-warning/70" />
      <div className="flex gap-2.5 px-3 py-3 pl-4">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-warning/20">
          <AlertTriangle size={13} className="text-warning" />
        </div>
        <div className="flex-1 space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-warning">
            Lưu ý khi tải ảnh vệ tinh
          </p>
          <ul className="space-y-1.5">
            {NOTES.map(({ icon, text }, i) => (
              <li
                key={i}
                className="flex items-start gap-1.5 text-[11px] leading-relaxed text-foreground/80"
              >
                {createElement(icon, {
                  size: 11,
                  className: "mt-0.5 shrink-0 text-warning/80",
                })}
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
