/* eslint-disable react-refresh/only-export-components */
import * as React from "react";
import { cva } from "class-variance-authority";

import LoadingInline from "@/components/common/LoadingInline";
import { cn } from "@/lib/utils";

const textareaVariants = cva(
  "placeholder:text-muted-foreground field-sizing-content flex min-h-16 w-full rounded-md border px-3 py-2 text-base shadow-xs outline-none transition-[background-color,border-color,color,box-shadow] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-[3px] aria-invalid:border-destructive aria-invalid:ring-destructive/20 md:text-sm",
  {
    variants: {
      variant: {
        default:
          "border-input bg-transparent focus-visible:border-ring focus-visible:ring-ring/50",
        filled:
          "border-transparent bg-muted focus-visible:border-ring focus-visible:bg-background focus-visible:ring-ring/50",
        primary:
          "border-primary bg-transparent focus-visible:ring-primary/20",
        success:
          "border-success bg-transparent focus-visible:ring-success/30",
        warning:
          "border-warning bg-transparent focus-visible:ring-warning/30",
        destructive:
          "border-destructive bg-transparent focus-visible:ring-destructive/20",
        info: "border-info bg-transparent focus-visible:ring-info/30",
        "soft-primary":
          "border-transparent bg-(--primary-subtle) text-(--primary-subtle-foreground) focus-visible:ring-primary/20",
        "soft-success":
          "border-transparent bg-(--success-subtle) text-(--success-subtle-foreground) focus-visible:ring-success/30",
        "soft-warning":
          "border-transparent bg-(--warning-subtle) text-(--warning-subtle-foreground) focus-visible:ring-warning/30",
        "soft-destructive":
          "border-transparent bg-(--destructive-subtle) text-(--destructive-subtle-foreground) focus-visible:ring-destructive/20",
        "soft-info":
          "border-transparent bg-(--info-subtle) text-(--info-subtle-foreground) focus-visible:ring-info/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Textarea({
  className,
  variant = "default",
  isLoading = false,
  disabled,
  ...props
}) {
  return (
    <span className="relative block w-full">
      <textarea
        data-slot="textarea"
        data-variant={variant}
        aria-busy={isLoading || undefined}
        disabled={disabled || isLoading}
        className={cn(
          textareaVariants({ variant }),
          isLoading && "pr-9",
          className,
        )}
        {...props}
      />
      {isLoading && (
        <span className="pointer-events-none absolute right-3 top-3">
          <LoadingInline position="inline" size="small" />
        </span>
      )}
    </span>
  );
}

export { Textarea, textareaVariants };
