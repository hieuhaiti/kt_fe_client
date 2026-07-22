/* eslint-disable react-refresh/only-export-components */
import * as React from "react";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const cardVariants = cva(
  "flex flex-col gap-6 rounded-xl border py-6 transition-[background-color,border-color,box-shadow,transform] duration-200",
  {
    variants: {
      variant: {
        default: "border-border bg-card text-card-foreground shadow-sm",
        outline: "border-border bg-card text-card-foreground shadow-none",
        elevated:
          "border-transparent bg-card text-card-foreground shadow-lg",
        interactive:
          "border-border bg-card text-card-foreground shadow-sm hover:-translate-y-0.5 hover:border-primary hover:shadow-lg",
        "soft-primary":
          "border-primary bg-(--primary-subtle) text-(--primary-subtle-foreground)",
        "gradient-panel":
          "border-(--gradient-surface-panel-border) bg-(image:--gradient-surface-panel) text-(--gradient-surface-panel-foreground) [box-shadow:var(--gradient-surface-card-shadow)]",
        "gradient-accent":
          "border-transparent bg-(image:--gradient-accent) text-white shadow-lg",
        "gradient-map":
          "border-(--gradient-surface-soft-border) bg-(image:--gradient-surface-map) text-card-foreground shadow-lg",
        "gradient-vibrant":
          "border-(--gradient-surface-soft-border) bg-(image:--gradient-surface-vibrant) text-card-foreground shadow-lg",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Card({ className, variant = "default", ...props }) {
  return (
    <div
      data-slot="card"
      data-variant={variant}
      className={cn(cardVariants({ variant }), className)}
      {...props} />
  );
}

function CardHeader({
  className,
  ...props
}) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props} />
  );
}

function CardTitle({
  className,
  ...props
}) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props} />
  );
}

function CardDescription({
  className,
  ...props
}) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props} />
  );
}

function CardAction({
  className,
  ...props
}) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props} />
  );
}

function CardContent({
  className,
  ...props
}) {
  return (<div data-slot="card-content" className={cn("px-6", className)} {...props} />);
}

function CardFooter({
  className,
  ...props
}) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props} />
  );
}

export {
  Card,
  cardVariants,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};
