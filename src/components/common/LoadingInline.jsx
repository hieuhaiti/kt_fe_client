import { memo } from "react";
import { Loader2 } from "lucide-react";

// size small: w-4 h-4 (center mode: w-8 h-8)
// size large: w-8 h-8 (center mode: w-12 h-12)
// position: 'inline' | 'center'
function LoadingInline({
  position = "inline",
  size = "small",
  color,
}) {
  const colorClass = {
    primary: "text-primary",
    success: "text-success",
    warning: "text-warning",
    destructive: "text-destructive",
    info: "text-info",
    "muted-foreground": "text-muted-foreground",
  }[color] ?? "text-current";

  // inline mode (mặc định)
  if (position !== "center") {
    return (
      <span className="inline-flex items-center gap-2">
        <Loader2
          className={`${
            size === "small" ? "w-4 h-4" : "w-8 h-8"
          } animate-spin ${colorClass}`}
        />
      </span>
    );
  }

  // center mode (chiếm full width + height của container cha, không fixed)
  return (
    <div className="flex items-center justify-center w-full h-full py-10">
      <Loader2
        className={`${
          size === "small" ? "w-8 h-8" : "w-12 h-12"
        } animate-spin ${colorClass}`}
      />
    </div>
  );
}

export default memo(LoadingInline);
