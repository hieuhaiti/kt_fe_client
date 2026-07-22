import { memo, useMemo } from "react";
import { Info, MapPin, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useModalMapLayerStore } from "@/stores/Map/useModalMapLayerStore";
import { praseLink } from "@/lib/utils";

function hexToRgba(hex, alpha = 0.12) {
  if (!hex || typeof hex !== "string") return `rgba(100,116,139,${alpha})`;
  let h = hex.trim().replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (h.length !== 6) return `rgba(100,116,139,${alpha})`;

  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function getDisplayName(data) {
  return data?.name || data?.name_vi || data?.name_en || data?.code || "Layer";
}

function getCategoryLabel(data) {
  return (
    data?.category ||
    data?.layer_group ||
    "Khong phan loai"
  );
}

function getPointCoordinateText(geometry) {
  const coordinates = geometry?.coordinates;
  if (
    Array.isArray(coordinates) &&
    coordinates.length === 2 &&
    typeof coordinates[0] === "number" &&
    typeof coordinates[1] === "number"
  ) {
    return `${coordinates[1].toFixed(6)}, ${coordinates[0].toFixed(6)}`;
  }
  return null;
}

function PropertyGrid({ properties, name }) {
  const entries = Object.entries(properties || {}).filter(
    ([key]) => !["id", "name", "category"].includes(key),
  );

  if (!entries.length) {
    return (
      <div className="py-6 text-center text-muted-foreground">
        <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Khong co thong tin chi tiet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {(properties.image || properties.image_url) && (
        <div className="w-full overflow-hidden rounded-lg">
          <img
            src={praseLink(properties.image || properties.image_url)}
            alt={name}
            className="object-cover w-full h-48"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {entries
          .filter(([key]) => !["image", "image_url"].includes(key))
          .map(([key, value]) => (
            <div key={key} className="p-2.5 rounded-lg bg-muted/50">
              <p className="text-xs font-medium text-muted-foreground mb-0.5 truncate">
                {key}
              </p>
              <p className="text-sm text-foreground truncate">
                {value != null ? String(value) : "-"}
              </p>
            </div>
          ))}
      </div>
    </div>
  );
}

export function MapLayerDetailModal() {
  const { isOpen, mapLayerData, closeModal } = useModalMapLayerStore();

  const categoryMeta = useMemo(() => {
    if (!mapLayerData) {
      return {
        label: "Khong phan loai",
        color: "#64748b",
        iconUrl: null,
      };
    }

    return {
      label: getCategoryLabel(mapLayerData),
      color: mapLayerData.color || "#64748b",
      iconUrl: mapLayerData.icon_url ? praseLink(mapLayerData.icon_url) : null,
    };
  }, [mapLayerData]);

  if (!mapLayerData) return null;

  const name = getDisplayName(mapLayerData);
  const properties = mapLayerData.properties || {};
  const coordText = getPointCoordinateText(
    mapLayerData.geometry_data || mapLayerData.geometry,
  );

  return (
    <Dialog open={isOpen} onOpenChange={closeModal}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto p-0">
        <div className="sticky top-0 z-10 px-6 pt-6 pb-4 bg-background border-b border-border">
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div
                className="flex items-center justify-center w-10 h-10 rounded-lg shrink-0"
                style={{ backgroundColor: hexToRgba(categoryMeta.color, 0.12) }}
              >
                {categoryMeta.iconUrl ? (
                  <img
                    src={categoryMeta.iconUrl}
                    alt={categoryMeta.label}
                    className="w-5 h-5 object-contain opacity-85"
                  />
                ) : (
                  <MapPin
                    className="w-5 h-5"
                    style={{ color: categoryMeta.color }}
                  />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <DialogTitle className="text-base font-semibold leading-tight">
                  {name}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-2 mt-1.5">
                  <Badge
                    variant="outline"
                    className="rounded-md"
                    style={{
                      color: categoryMeta.color,
                      borderColor: categoryMeta.color,
                      backgroundColor: hexToRgba(categoryMeta.color,1),
                    }}
                  >
                    {categoryMeta.label}
                  </Badge>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="px-6 py-4">
          <PropertyGrid properties={properties} name={name} />

          {coordText && (
            <div className="flex items-center gap-2 p-3 mt-4 rounded-lg bg-muted/50">
              <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground">{coordText}</span>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 px-6 py-3 bg-background border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={closeModal}
            className="w-full"
          >
            <X className="w-4 h-4 mr-1.5" />
            Dong
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default memo(MapLayerDetailModal);
