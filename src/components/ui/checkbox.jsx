/* eslint-disable react-refresh/only-export-components */
import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon } from "lucide-react";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const checkboxVariants = cva(
  "peer size-4 shrink-0 rounded-[4px] border shadow-xs outline-none transition-[background-color,border-color,color,box-shadow] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20",
  {
    variants: {
      variant: {
        default:
          "border-primary data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
        secondary:
          "border-input data-[state=checked]:border-foreground data-[state=checked]:bg-foreground data-[state=checked]:text-background",
        success:
          "border-success data-[state=checked]:border-success data-[state=checked]:bg-success data-[state=checked]:text-success-foreground",
        warning:
          "border-warning data-[state=checked]:border-warning data-[state=checked]:bg-warning data-[state=checked]:text-warning-foreground",
        destructive:
          "border-destructive data-[state=checked]:border-destructive data-[state=checked]:bg-destructive data-[state=checked]:text-(--destructive-foreground) focus-visible:ring-destructive/20",
        info:
          "border-info data-[state=checked]:border-info data-[state=checked]:bg-info data-[state=checked]:text-info-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Checkbox({ className, variant = "default", ...props }) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      data-variant={variant}
      className={cn(checkboxVariants({ variant }), className)}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none"
      >
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox, checkboxVariants };
