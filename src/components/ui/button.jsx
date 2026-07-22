/* eslint-disable react-refresh/only-export-components */
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";

import LoadingInline from "@/components/common/LoadingInline";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium outline-none transition-all duration-200 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 disabled:pointer-events-none disabled:opacity-50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "bg-destructive text-(--destructive-foreground) hover:bg-destructive/90 focus-visible:ring-destructive/20",
        success:
          "bg-success text-success-foreground hover:bg-success/90 focus-visible:ring-success/30",
        warning:
          "bg-warning text-warning-foreground hover:bg-warning/90 focus-visible:ring-warning/30",
        info: "bg-info text-info-foreground hover:bg-info/90 focus-visible:ring-info/30",
        outline:
          "border border-border bg-background text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground",
        ghost: "text-foreground hover:bg-accent hover:text-accent-foreground",
        "ghost-transparent":
          "bg-transparent text-foreground hover:bg-transparent hover:text-foreground",
        link: "h-auto text-primary underline-offset-4 hover:underline",
        "soft-primary":
          "bg-(--primary-subtle) text-(--primary-subtle-foreground) hover:bg-primary/20",
        "soft-success":
          "bg-(--success-subtle) text-(--success-subtle-foreground) hover:bg-success/20",
        "soft-warning":
          "bg-(--warning-subtle) text-(--warning-subtle-foreground) hover:bg-warning/20",
        "soft-destructive":
          "bg-(--destructive-subtle) text-(--destructive-subtle-foreground) hover:bg-destructive/20 focus-visible:ring-destructive/20",
        "soft-info":
          "bg-(--info-subtle) text-(--info-subtle-foreground) hover:bg-info/20",
        "gradient-primary":
          "bg-(image:--gradient-primary) text-(--gradient-foreground) [box-shadow:var(--gradient-action-shadow)] hover:-translate-y-0.5 hover:[box-shadow:var(--gradient-action-shadow-hover)]",
        "gradient-secondary":
          "bg-(image:--gradient-secondary) text-(--gradient-foreground) [box-shadow:var(--gradient-action-shadow)] hover:-translate-y-0.5",
        "gradient-accent":
          "bg-(image:--gradient-accent) text-(--gradient-foreground) [box-shadow:var(--gradient-action-shadow)] hover:-translate-y-0.5",
        "gradient-success":
          "bg-(image:--gradient-success) text-(--gradient-foreground) [box-shadow:var(--gradient-action-shadow)] hover:-translate-y-0.5",
        "gradient-warning":
          "bg-(image:--gradient-warning) text-(--gradient-foreground) [box-shadow:var(--gradient-action-shadow)] hover:-translate-y-0.5",
        "gradient-destructive":
          "bg-(image:--gradient-destructive) text-(--gradient-foreground) [box-shadow:var(--gradient-action-shadow)] hover:-translate-y-0.5 focus-visible:ring-destructive/20",
        "gradient-info":
          "bg-(image:--gradient-info) text-(--gradient-foreground) [box-shadow:var(--gradient-action-shadow)] hover:-translate-y-0.5",
        "gradient-map":
          "bg-(image:--gradient-map) text-(--gradient-foreground) [box-shadow:var(--gradient-action-shadow)] hover:-translate-y-0.5",
        "gradient-fire":
          "bg-destructive [background-image:var(--gradient-fire)] text-(--gradient-fire-foreground) [box-shadow:var(--gradient-action-shadow)] hover:-translate-y-0.5 focus-visible:ring-destructive/20",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  isLoading = false,
  disabled,
  children,
  ...props
}) {
  if (asChild && !isLoading) {
    return (
      <Slot
        data-slot="button"
        data-variant={variant}
        data-size={size}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {children}
      </Slot>
    );
  }

  return (
    <button
      data-slot="button"
      data-variant={variant}
      data-size={size}
      aria-busy={isLoading || undefined}
      disabled={disabled || isLoading}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {isLoading && <LoadingInline position="inline" size="small" />}
      {children}
    </button>
  );
}

export { Button, buttonVariants };
