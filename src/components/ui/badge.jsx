/* eslint-disable react-refresh/only-export-components */
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-full border border-transparent px-2 py-0.5 text-xs font-medium outline-none transition-[color,background-color,border-color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "bg-destructive text-(--destructive-foreground) [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20",
        success:
          "bg-success text-success-foreground [a&]:hover:bg-success/90",
        warning:
          "bg-warning text-warning-foreground [a&]:hover:bg-warning/90",
        info: "bg-info text-info-foreground [a&]:hover:bg-info/90",
        outline:
          "border-border bg-transparent text-foreground [a&]:hover:bg-accent",
        ghost:
          "bg-transparent text-muted-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        "soft-primary":
          "bg-(--primary-subtle) text-(--primary-subtle-foreground)",
        "soft-success":
          "bg-(--success-subtle) text-(--success-subtle-foreground)",
        "soft-warning":
          "bg-(--warning-subtle) text-(--warning-subtle-foreground)",
        "soft-destructive":
          "bg-(--destructive-subtle) text-(--destructive-subtle-foreground) focus-visible:ring-destructive/20",
        "soft-info":
          "bg-(--info-subtle) text-(--info-subtle-foreground)",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({ className, variant = "default", asChild = false, ...props }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
