import { AlertTriangle, CheckCircle2, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const icons = {
  loading: LoaderCircle,
  success: CheckCircle2,
  error: AlertTriangle,
};

export default function AuthStatus({ status, message, children }) {
  const Icon = icons[status] || icons.loading;

  return (
    <div className="text-center">
      <span
        className={cn(
          "mx-auto grid size-20 place-items-center rounded-3xl border",
          status === "error" &&
            "border-destructive/15 bg-(--destructive-subtle) text-destructive",
          status === "success" &&
            "border-success/15 bg-(--success-subtle) text-success",
          status === "loading" &&
            "border-primary/15 bg-(--primary-subtle) text-primary",
        )}
      >
        <Icon
          className={cn("size-9", status === "loading" && "animate-spin")}
        />
      </span>
      <p className="mx-auto mt-5 max-w-sm text-sm leading-6 text-muted-foreground">
        {message}
      </p>
      {children}
    </div>
  );
}
