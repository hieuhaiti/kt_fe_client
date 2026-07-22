import { useEffect, useRef, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export default function TruncatedTextWithTooltip({
  // eslint-disable-next-line no-unused-vars
  as: Component = "span",
  text,
  className,
  ...props
}) {
  const textRef = useRef(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const updateTruncateState = () => {
      const element = textRef.current;
      if (!element) return;

      const nextState =
        element.scrollWidth > element.clientWidth ||
        element.scrollHeight > element.clientHeight;

      setIsTruncated(nextState);
    };

    updateTruncateState();
    const rafId = window.requestAnimationFrame(updateTruncateState);

    window.addEventListener("resize", updateTruncateState);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", updateTruncateState);
    };
  }, [text]);

  const content = (
    <Component
      ref={textRef}
      className={cn("line-clamp-1", className)}
      {...props}
    >
      {text}
    </Component>
  );

  if (!text || !isTruncated) {
    return content;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent side="top" className="max-w-80 wrap-break-word">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}
