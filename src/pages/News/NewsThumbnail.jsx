import { useEffect, useRef, useState } from "react";
import { FileImage } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function NewsThumbnail({ src, alt }) {
  const frameRef = useRef(null);
  const [shouldLoad, setShouldLoad] = useState(
    () => typeof IntersectionObserver !== "function",
  );
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    if (shouldLoad) return;

    let active = true;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!active || !entries.some((entry) => entry.isIntersecting)) return;

        setShouldLoad(true);
        observer.disconnect();
      },
      { root: null, rootMargin: "0px", threshold: 0 },
    );

    observer.observe(frameRef.current);

    return () => {
      active = false;
      observer.disconnect();
    };
  }, [shouldLoad]);

  return (
    <div
      ref={frameRef}
      className="relative h-full w-full"
      aria-busy={shouldLoad && status === "loading"}
    >
      {shouldLoad && status === "loading" && (
        <Skeleton
          aria-hidden="true"
          className="absolute inset-0 h-full w-full rounded-none motion-reduce:animate-none"
        />
      )}
      {shouldLoad && status !== "error" && (
        <img
          src={src}
          alt={alt}
          loading="eager"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("error")}
        />
      )}
      {status === "error" && (
        <div className="flex h-full items-center justify-center text-muted-foreground">
          <div className="text-center">
            <FileImage aria-hidden="true" className="mx-auto mb-2 h-10 w-10" />
            <span className="text-sm font-medium">Không tải được ảnh</span>
          </div>
        </div>
      )}
    </div>
  );
}
