export function MapStatusBar({ lat, lng, zoom }) {
  const formatCoord = (value, isLat) => {
    if (value === null || value === undefined) return "--";
    const direction = isLat ? (value >= 0 ? "N" : "S") : value >= 0 ? "E" : "W";
    return `${Math.abs(value).toFixed(4)}° ${direction}`;
  };

  return (
    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10">
      <div className="flex items-center gap-6 px-4 py-2 rounded-lg bg-card/90 backdrop-blur-sm border border-border">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            LAT:
          </span>
          <span className="text-xs font-mono text-foreground">
            {formatCoord(lat, true)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            LONG:
          </span>
          <span className="text-xs font-mono text-foreground">
            {formatCoord(lng, false)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            ZOOM:
          </span>
          <span className="text-xs font-mono text-foreground">
            {zoom?.toFixed(1) || "--"}x
          </span>
        </div>
      </div>
    </div>
  );
}
