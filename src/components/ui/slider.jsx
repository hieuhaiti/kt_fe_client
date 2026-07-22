/* eslint-disable react-refresh/only-export-components */
import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

const sliderRangeVariants = {
  default: "bg-primary",
  secondary: "bg-foreground",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
  info: "bg-info",
  "gradient-primary": "bg-(image:--gradient-primary)",
  "gradient-secondary": "bg-(image:--gradient-secondary)",
  "gradient-success": "bg-(image:--gradient-success)",
  "gradient-warning": "bg-(image:--gradient-warning)",
  "gradient-destructive": "bg-(image:--gradient-destructive)",
  "gradient-info": "bg-(image:--gradient-info)",
  "gradient-map": "bg-(image:--gradient-map)",
  "gradient-fire":
    "bg-destructive [background-image:var(--gradient-fire)]",
};

const sliderThumbVariants = {
  default: "border-primary",
  secondary: "border-foreground",
  success: "border-success",
  warning: "border-warning",
  destructive: "border-destructive focus-visible:ring-destructive/20",
  info: "border-info",
  "gradient-primary": "border-primary",
  "gradient-secondary": "border-secondary",
  "gradient-success": "border-success",
  "gradient-warning": "border-warning",
  "gradient-destructive":
    "border-destructive focus-visible:ring-destructive/20",
  "gradient-info": "border-info",
  "gradient-map": "border-primary",
  "gradient-fire":
    "border-destructive shadow-[0_0_0_3px_color-mix(in_srgb,var(--destructive)_20%,transparent)]",
};

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  variant = "default",
  ...props
}) {
  const values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min, max],
    [value, defaultValue, min, max],
  );

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      data-variant={variant}
      className={cn(
        "relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col",
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="relative grow overflow-hidden rounded-full bg-muted data-[orientation=horizontal]:h-1.5 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5"
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className={cn(
            "absolute data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full",
            sliderRangeVariants[variant] ?? sliderRangeVariants.default,
          )}
        />
      </SliderPrimitive.Track>
      {Array.from({ length: values.length }, (_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          className={cn(
            "block size-4 shrink-0 rounded-full border bg-background shadow-sm outline-none transition-[color,box-shadow] hover:ring-4 hover:ring-ring/50 focus-visible:ring-4 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
            sliderThumbVariants[variant] ?? sliderThumbVariants.default,
          )}
        />
      ))}
    </SliderPrimitive.Root>
  );
}

export { Slider, sliderRangeVariants, sliderThumbVariants };
