import { MapPin, ArrowUpRight } from "lucide-react";
import LoadingInline from "@/components/common/LoadingInline";
import { Button } from "@/components/ui/button";

export function SearchResultsOverlay({ results, isLoading = false, onSelect }) {
  // Show loading state
  if (isLoading) {
    return (
      <div className="absolute left-0 right-0 z-50 mt-2 overflow-y-auto border rounded-lg shadow-lg top-full bg-background border-border max-h-64">
        <div className="flex items-center justify-center px-3 py-6">
          <LoadingInline size="large" />
        </div>
      </div>
    );
  }

  // Show no results state
  if (!results || results.length === 0) {
    return (
      <div className="absolute left-0 right-0 z-50 mt-2 overflow-y-auto border rounded-lg shadow-lg top-full bg-background border-border max-h-64">
        <div className="px-3 py-4 text-center text-muted-foreground">
          <div className="mb-2">
            <MapPin className="w-6 h-6 mx-auto opacity-50" />
          </div>
          <p className="text-sm">Không tìm thấy kết quả phù hợp</p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute left-0 right-0 z-50 mt-2 overflow-y-auto border rounded-lg shadow-lg top-full bg-background border-border max-h-64">
      <div className="py-1.5">
        {results.map((result, index) => (
          <Button
            type="button"
            variant="outline"
            key={result.id || index}
            onClick={() => onSelect(result)}
            className="h-auto w-full justify-start gap-3 rounded-sm px-3 py-2 text-left"
          >
            <MapPin className="w-5 h-5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate text-foreground">
                {result.name || result.properties?.name || "Không có tên"}
              </div>
              {result.geometry?.coordinates?.length === 2 && (
                <div className="text-xs truncate opacity-75 text-muted-foreground">
                  {result.geometry.coordinates[1].toFixed(4)},{" "}
                  {result.geometry.coordinates[0].toFixed(4)}
                </div>
              )}
            </div>
            <ArrowUpRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </Button>
        ))}
      </div>
    </div>
  );
}
