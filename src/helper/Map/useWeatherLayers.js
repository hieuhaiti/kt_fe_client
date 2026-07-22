import { useEffect } from "react";
import { useWeatherLayerStore } from "@/stores/Map/Sidebar/useWeatherLayerStore";
import { buildWeatherTileUrl } from "@/services/weatherService";

export const useWeatherLayers = (mapRef) => {
  const weatherLayers = useWeatherLayerStore((s) => s.weatherLayers);

  useEffect(() => {
    const map = mapRef?.single || mapRef?.current;
    if (!map || typeof map.isStyleLoaded !== "function") return;

    const onStyleLoad = () => {
      weatherLayers
        .filter((layer) => layer.id !== "wind")
        .forEach((layer) => {
          const sourceId = `owm-${layer.id}`;
          const layerId = `owm-${layer.id}-layer`;

          if (!map.getSource(sourceId)) {
            map.addSource(sourceId, {
              type: "raster",
              tiles: [buildWeatherTileUrl(layer.weather_type || layer.id)],
              tileSize: 256,
            });
          }

          if (!map.getLayer(layerId)) {
            map.addLayer({
              id: layerId,
              type: "raster",
              source: sourceId,
              layout: {
                visibility: layer.enabled ? "visible" : "none",
              },
              paint: {
                "raster-opacity": 0.8,
              },
            });
          } else {
            map.setLayoutProperty(
              layerId,
              "visibility",
              layer.enabled ? "visible" : "none",
            );
          }
        });
    };

    if (map.isStyleLoaded()) {
      onStyleLoad();
    }

    map.on("style.load", onStyleLoad);

    return () => {
      map.off("style.load", onStyleLoad);
    };
  }, [weatherLayers, mapRef]);
};
