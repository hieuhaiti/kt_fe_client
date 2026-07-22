import { useCallback, useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import MapboxCompare from "mapbox-gl-compare";
import {
  defaultLatLong,
  defaultStyle,
  defaultZoom,
  mapDelta,
} from "@/constant/mapData";
import { useMapStore } from "@/stores/Map/useMapStore";
import { useMapStyleStore } from "@/stores/Map/Sidebar/useMapStyleStore";
import { useSatelliteStore } from "@/stores/Map/Sidebar/useSatelliteStore";

import {
  resetViewPort,
  initializeDraw,
  update3DTerrain,
  update3DBuildings,
  addSatelliteLayerToMap,
  updateSatelliteLayerOpacity,
  toggleSatelliteLayerVisibility,
  addOrUpdateCategoryLayer,
  addOrUpdateGeoServerLayer,
  buildOgcFeatureInfoUrl,
  buildOgcPointLayerIds,
  buildOgcSourceId,
  isOgcPointGeometry,
  removeCategoryLayer,
  removeGeoServerLayer,
  highlightFeatureOnMap,
  clearHighlightFromMap,
} from "@/helper/Map/MapHelper";
import {
  MapToolbar,
  MapStatusBar,
  WeatherInfo,
  AQIPopup,
  SatelliteLegend,
} from "@/components/Map/FloatTool";
import { useMeasurementOverlay } from "@/helper/Map/useMeasurementOverlay";
import { useWeatherOverlay } from "@/helper/Map/useWeatherOverlay";
import { useModalMapLayerStore } from "@/stores/Map/useModalMapLayerStore";
import MapLayerDetailModal from "@/components/Map/MapLayerDetailModal";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const getOgcIdentifyPriority = (geometryType) => {
  const type = String(geometryType || "").toLowerCase();
  if (type.includes("point")) return 2;
  if (type.includes("line")) return 1;
  return 0;
};

const getFeatureDisplayName = (feature, layer) => {
  const props = feature?.properties || {};
  return (
    props.name ||
    props.name_vi ||
    props.ten ||
    props.ten_vung ||
    props.label ||
    layer?.name ||
    layer?.name_vi ||
    layer?.code ||
    "Đối tượng bản đồ"
  );
};

const mapOgcFeatureToModalData = (feature, layer) => ({
  id: feature?.id || feature?.properties?.id || feature?.properties?.objectid,
  code: layer?.code,
  name: getFeatureDisplayName(feature, layer),
  category: layer?.category,
  layer_group: layer?.layer_group,
  geometry_type: layer?.geometry_type || feature?.geometry?.type,
  geometry_data: feature?.geometry,
  properties: {
    ...(feature?.properties || {}),
    layer_code: layer?.code,
    geoserver_layer: layer?.geoserver_layer,
  },
});

export default function MapComponent() {
  // Map state for status bar
  const mapContainer = useRef(null);
  const singleMapContainerRef = useRef(null);
  const splitMapContainerRef = useRef(null);
  const compareInitTimerRef = useRef(null);
  const { setMapRef, setClickedPoint } = useMapStore();
  const mapRef = useRef({
    single: null, // map đơn
    split: null, // map phải
    compare: null, // instance compare
  });
  const mapStyleRef = {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: "100%",
  };

  const [mapState, setMapState] = useState({
    lat: defaultLatLong.lat,
    lng: defaultLatLong.lng,
    zoom: defaultZoom,
  });

  // Map style
  const mapStyle = useMapStyleStore((s) => s.mapStyle);
  const terrainState = useMapStyleStore((s) => s.terrainState);
  const setTerrainLoading = useMapStyleStore((s) => s.setTerrainLoading);
  const terrainStateRef = useRef(terrainState);
  const [mapsReady, setMapsReady] = useState({
    single: false,
    split: false,
  });
  const pending3DApplyRef = useRef({
    single: false,
    split: false,
  });
  const pitchReconcileTimerRef = useRef({
    single: null,
    split: null,
  });

  useEffect(() => {
    terrainStateRef.current = terrainState;
  }, [terrainState]);

  const finalizeTerrainLoading = useCallback(() => {
    const singleMap = mapRef.current.single;
    const splitMap = mapRef.current.split;

    const singlePending =
      !!singleMap &&
      pending3DApplyRef.current.single &&
      !singleMap.isStyleLoaded();
    const splitPending =
      !!splitMap &&
      pending3DApplyRef.current.split &&
      !splitMap.isStyleLoaded();

    if (!singlePending && !splitPending) {
      setTerrainLoading(false);
    }
  }, [setTerrainLoading]);

  //  mode
  const clickedPointMode = useMapStyleStore((s) => s.clickedPointMode);
  const isSplitMode = useMapStore((s) => s.isSplitMode);

  // satellite state
  const satelliteLayers = useSatelliteStore((s) => s.satelliteLayers);

  // Category layers & highlight - MUST declare before used in effects
  const categoryLayersData = useMapStore((s) => s.categoryLayersData);
  const ogcLayersData = useMapStore((s) => s.ogcLayersData);
  const categoryLayersDataRef = useRef(categoryLayersData);
  const ogcLayersDataRef = useRef(ogcLayersData);
  useEffect(() => {
    categoryLayersDataRef.current = categoryLayersData;
  }, [categoryLayersData]);
  useEffect(() => {
    ogcLayersDataRef.current = ogcLayersData;
  }, [ogcLayersData]);
  const highlightedFeature = useMapStore((s) => s.highlightedFeature);

  // draw state
  const drawRef = useRef(null);
  const canvasRef = useRef(null);
  const { updateMeasurements } = useMeasurementOverlay(mapRef);
  const handleDrawCreate = useCallback(() => {
    const draw = drawRef.current;
    if (!draw) return;

    const data = draw.getAll();
    if (data.features.length > 0) {
      updateMeasurements(data.features);
    }
  }, [updateMeasurements]);

  const handleDrawUpdate = useCallback(() => {
    const draw = drawRef.current;
    if (!draw) return;

    const data = draw.getAll();
    updateMeasurements(data.features);
  }, [updateMeasurements]);

  const handleDrawDelete = useCallback(() => {
    const draw = drawRef.current;
    if (!draw) return;

    const data = draw.getAll();
    updateMeasurements(data.features);
  }, [updateMeasurements]);

  const { enabledLayers } = useWeatherOverlay(mapRef, canvasRef);
  const hasActiveWeatherLayers = enabledLayers.length > 0;

  // Initialize map
  useEffect(() => {
    if (mapRef.current.single || !singleMapContainerRef.current) return;

    // Lấy terrainState hiện tại để khởi tạo pitch đúng
    const initialTerrain = useMapStyleStore.getState().terrainState;

    mapRef.current.single = new mapboxgl.Map({
      container: singleMapContainerRef.current,
      style: mapStyle || defaultStyle,
      center: [defaultLatLong.lng, defaultLatLong.lat],
      zoom: defaultZoom,
      pitch: initialTerrain ? 75 : 0,
      bearing: 0,
      antialias: true,
      preserveDrawingBuffer: true,
    });

    mapRef.current.split = new mapboxgl.Map({
      container: splitMapContainerRef.current,
      style: mapStyle || defaultStyle,
      center: [defaultLatLong.lng, defaultLatLong.lat],
      zoom: defaultZoom,
      pitch: initialTerrain ? 75 : 0,
      bearing: 0,
      antialias: true,
      preserveDrawingBuffer: true,
    });

    // Ẩn split map ban đầu
    mapRef.current.split.getContainer().style.display = "none";

    // Use single map as main reference
    const map = mapRef.current.single;

    const handleSingleLoad = () => {
      setMapRef(map);
      // Store full mapRef so satellite store can access single/split maps without prop drilling
      useMapStore.getState().setMapRefObj(mapRef);

      drawRef.current = initializeDraw(
        map,
        handleDrawCreate,
        handleDrawUpdate,
        handleDrawDelete,
      );

      const center = map.getCenter();
      const mapBounds = [
        [center.lng - mapDelta, center.lat - mapDelta],
        [center.lng + mapDelta, center.lat + mapDelta],
      ];
      map.setMaxBounds(mapBounds);

      // Add Map Controls (only to single map)
      map.addControl(new mapboxgl.FullscreenControl(), "bottom-right");
      map.addControl(
        new ResetControl(() => useMapStyleStore.getState().terrainState),
        "bottom-right",
      );
      map.addControl(
        new mapboxgl.NavigationControl({
          showCompass: true,
          showZoom: true,
          visualizePitch: true,
        }),
        "bottom-right",
      );

      setMapsReady((prev) => ({ ...prev, single: true }));
    };

    const handleSplitLoad = () => {
      setMapsReady((prev) => ({ ...prev, split: true }));
    };

    map.on("load", handleSingleLoad);
    mapRef.current.split.on("load", handleSplitLoad);

    map.on("move", () => {
      const center = map.getCenter();
      setMapState({
        lat: center.lat,
        lng: center.lng,
        zoom: map.getZoom(),
      });

      // Sync split map when in compare mode
      if (
        isSplitMode &&
        mapRef.current.split &&
        mapRef.current.split.isStyleLoaded()
      ) {
        mapRef.current.split.jumpTo({
          center: map.getCenter(),
          zoom: map.getZoom(),
          pitch: map.getPitch(),
          bearing: map.getBearing(),
        });
      }
    });

    return () => {
      if (mapRef.current.single) {
        mapRef.current.single.remove();
        mapRef.current.single = null;
      }
      if (mapRef.current.split) {
        mapRef.current.split.remove();
        mapRef.current.split = null;
      }
      mapRef.current.compare = null;
      setMapsReady({ single: false, split: false });
    };
  }, []);

  // Handle MapboxCompare toggle for Compare Mode
  useEffect(() => {
    if (!mapsReady.single || !mapsReady.split) return;

    const { single, split } = mapRef.current;
    if (!single || !split) return;

    if (isSplitMode) {
      // Show split map
      split.getContainer().style.display = "block";

      // Wait a bit for DOM to update, then resize
      if (compareInitTimerRef.current) {
        window.clearTimeout(compareInitTimerRef.current);
      }

      compareInitTimerRef.current = window.setTimeout(() => {
        split.resize();

        // Sync camera with single map
        const camera = {
          center: single.getCenter(),
          zoom: single.getZoom(),
          pitch: single.getPitch(),
          bearing: single.getBearing(),
        };
        split.jumpTo(camera);

        // Create Compare slider if not exists
        if (!mapRef.current.compare) {
          try {
            mapRef.current.compare = new MapboxCompare(
              single,
              split,
              mapContainer.current,
            );
          } catch (error) {
            console.error("[MapComponent] Failed to initialize map compare:", error);
          }
        }
      }, 100);
    } else {
      if (compareInitTimerRef.current) {
        window.clearTimeout(compareInitTimerRef.current);
        compareInitTimerRef.current = null;
      }

      // Hide split map and remove compare
      split.getContainer().style.display = "none";

      if (mapRef.current.compare) {
        try {
          mapRef.current.compare.remove();
        } catch (error) {
          console.error("[MapComponent] Failed to remove map compare:", error);
        }
        mapRef.current.compare = null;
      }
    }

    return () => {
      if (compareInitTimerRef.current) {
        window.clearTimeout(compareInitTimerRef.current);
        compareInitTimerRef.current = null;
      }
    };
  }, [isSplitMode, mapsReady.single, mapsReady.split]);

  // Handle satellite layers
  useEffect(() => {
    if (!mapsReady.single || !mapsReady.split || satelliteLayers.length === 0)
      return;

    const { single, split } = mapRef.current;
    if (!single || !split) return;

    // Xử lý từng layer
    satelliteLayers.forEach((layer) => {
      const targetMap =
        layer.splitSide === "right" || layer.splitSide === "change"
          ? split
          : single;

      const layerId = layer.id; // layer.id is already in format 'satellite-{id}'
      const layerExists = targetMap.getLayer(layerId);

      if (layerExists) return;

      if (!targetMap.isStyleLoaded()) return;

      if (!layer.layerData || !layer.layerData.tileUrl) return;

      try {
        addSatelliteLayerToMap(targetMap, layer.layerData, layer.id);
      } catch {
        // ignore
      }
    });
  }, [satelliteLayers, mapsReady.single, mapsReady.split]);

  // Handle satellite layer opacity & visibility updates
  useEffect(() => {
    if (!mapRef.current.single || !mapsReady.single) return;
    if (!satelliteLayers || satelliteLayers.length === 0) return;

    const { single, split } = mapRef.current;

    // Update each layer's opacity and visibility
    satelliteLayers.forEach((layer) => {
      const layerId = layer.id; // layer.id is already in format 'satellite-{id}'
      const opacity = layer.layerOpacity ?? 1;
      const visible = layer.visible !== false; // Default to visible

      // Update based on splitSide
      if (layer.splitSide === "right" || layer.splitSide === "change") {
        // Update on split map only
        if (split && split.getLayer(layerId)) {
          updateSatelliteLayerOpacity(split, layerId, opacity);
          toggleSatelliteLayerVisibility(split, layerId, visible);
        }
      } else if (layer.splitSide === "left") {
        // Update on single map only
        if (single && single.getLayer(layerId)) {
          updateSatelliteLayerOpacity(single, layerId, opacity);
          toggleSatelliteLayerVisibility(single, layerId, visible);
        }
      } else {
        // Update on both maps (default behavior)
        if (single && single.getLayer(layerId)) {
          updateSatelliteLayerOpacity(single, layerId, opacity);
          toggleSatelliteLayerVisibility(single, layerId, visible);
        }
        if (split && split.getLayer(layerId)) {
          updateSatelliteLayerOpacity(split, layerId, opacity);
          toggleSatelliteLayerVisibility(split, layerId, visible);
        }
      }
    });
  }, [
    satelliteLayers
      .map((l) => `${l.id}-${l.layerOpacity}-${l.visible}`)
      .join("|"),
    mapsReady.single,
  ]);

  // Handle click on map for AQI mode
  useEffect(() => {
    if (!mapRef.current.single) return;

    const handleClick = (e) => {
      if (clickedPointMode) {
        setClickedPoint({
          lat: e.lngLat.lat,
          lng: e.lngLat.lng,
        });
      }
    };

    mapRef.current.single.on("click", handleClick);

    // Update cursor based on mode
    if (clickedPointMode) {
      mapRef.current.single.getCanvas().style.cursor = "crosshair";
    } else {
      mapRef.current.single.getCanvas().style.cursor = "";
    }

    return () => {
      if (mapRef.current.single) {
        mapRef.current.single.off("click", handleClick);
      }
    };
  }, [clickedPointMode, setClickedPoint]);

  // Update map style - dùng transformStyle để giữ lại custom sources & layers
  useEffect(() => {
    if (!mapRef.current.single) return;

    const transformStyle = (previousStyle, nextStyle) => {
      if (!previousStyle) return nextStyle;

      // Lọc custom sources (không phải built-in của style)
      const builtinSourceIds = new Set(Object.keys(nextStyle.sources || {}));
      const customSources = Object.entries(previousStyle.sources || {}).reduce(
        (acc, [id, source]) => {
          if (!builtinSourceIds.has(id)) acc[id] = source;
          return acc;
        },
        {},
      );

      // Lọc custom layers (có source là custom hoặc id bắt đầu bằng cat-/satellite-/highlight-/buffer-)
      const builtinLayerIds = new Set(
        (nextStyle.layers || []).map((l) => l.id),
      );
      const customLayers = (previousStyle.layers || []).filter((l) => {
        const isBuiltin = builtinLayerIds.has(l.id);
        const hasCustomSource = customSources[l.source];
        const isCustomPrefix = /^(cat-|ogc-|satellite-|highlight-|buffer-)/.test(
          l.id,
        );
        const isSpecial = ["mapbox-dem", "sky", "3d-buildings"].includes(l.id);
        return !isBuiltin && (hasCustomSource || isCustomPrefix || isSpecial);
      });

      return {
        ...nextStyle,
        sources: { ...nextStyle.sources, ...customSources },
        layers: [...(nextStyle.layers || []), ...customLayers],
      };
    };

    // Restore category layers sau khi style load xong
    // Dùng ref để không re-run effect khi categoryLayersData thay đổi
    const onStyleLoad = () => {
      const latestData = categoryLayersDataRef.current;
      const map = mapRef.current.single;
      Object.entries(latestData || {}).forEach(
        ([sourceId, { geojson, geometryType, color, icon }]) => {
          addOrUpdateCategoryLayer(
            map,
            sourceId,
            geojson,
            geometryType,
            color,
            true,
            icon,
          );
        },
      );

      Object.entries(ogcLayersDataRef.current || {}).forEach(
        ([sourceId, layer]) => {
          addOrUpdateGeoServerLayer(map, sourceId, layer, true);
        },
      );
    };

    // SETUP LISTENER BEFORE calling setStyle!
    mapRef.current.single.once("style.load", onStyleLoad);
    mapRef.current.single.setStyle(mapStyle || defaultStyle, {
      transformStyle,
    });

    if (mapRef.current.split) {
      const onSplitStyleLoad = () => {
        const latestData = categoryLayersDataRef.current;
        const splitMap = mapRef.current.split;
        Object.entries(latestData || {}).forEach(
          ([sourceId, { geojson, geometryType, color, icon }]) => {
            addOrUpdateCategoryLayer(
              splitMap,
              sourceId,
              geojson,
              geometryType,
              color,
              true,
              icon,
            );
          },
        );

        Object.entries(ogcLayersDataRef.current || {}).forEach(
          ([sourceId, layer]) => {
            addOrUpdateGeoServerLayer(splitMap, sourceId, layer, true);
          },
        );
      };
      mapRef.current.split.once("style.load", onSplitStyleLoad);
      mapRef.current.split.setStyle(mapStyle || defaultStyle, {
        transformStyle,
      });
    }
  }, [mapStyle]); // ONLY re-run when mapStyle changes, NOT on categoryLayersData changes

  // 3D Buildings & Terrain Effect
  const apply3DToMap = useCallback(
    (target) => {
      const map = mapRef.current[target];
      const nextTerrainState = terrainStateRef.current;

      if (!map) {
        pending3DApplyRef.current[target] = false;
        return false;
      }

      if (!map.isStyleLoaded()) {
        pending3DApplyRef.current[target] = true;
        setTerrainLoading(true);
        return false;
      }

      pending3DApplyRef.current[target] = false;

      update3DTerrain(map, nextTerrainState);
      update3DBuildings(map, nextTerrainState);

      const targetPitch = nextTerrainState ? 75 : 0;

      if (pitchReconcileTimerRef.current[target]) {
        window.clearTimeout(pitchReconcileTimerRef.current[target]);
      }

      pitchReconcileTimerRef.current[target] = window.setTimeout(() => {
        const currentMap = mapRef.current[target];
        if (!currentMap || !currentMap.isStyleLoaded()) return;

        const currentPitch = currentMap.getPitch();
        const pitchDiff = Math.abs(currentPitch - targetPitch);

        if (pitchDiff > 1) {
          currentMap.stop();
          currentMap.easeTo({
            pitch: targetPitch,
            bearing: currentMap.getBearing(),
            duration: 350,
            essential: true,
          });
        }

        finalizeTerrainLoading();
      }, 1400);

      finalizeTerrainLoading();

      return true;
    },
    [finalizeTerrainLoading, setTerrainLoading],
  );

  useEffect(() => {
    const single = mapRef.current.single;
    const split = mapRef.current.split;

    if (!single && !split) return;

    const handleSingleStyleLoad = () => {
      apply3DToMap("single", "style.load");
      finalizeTerrainLoading();
    };

    const handleSplitStyleLoad = () => {
      apply3DToMap("split", "style.load");
      finalizeTerrainLoading();
    };

    if (single) {
      single.on("style.load", handleSingleStyleLoad);
    }
    if (split) {
      split.on("style.load", handleSplitStyleLoad);
    }

    return () => {
      if (single) {
        single.off("style.load", handleSingleStyleLoad);
      }
      if (split) {
        split.off("style.load", handleSplitStyleLoad);
      }
    };
  }, [apply3DToMap, finalizeTerrainLoading, mapsReady.single, mapsReady.split]);

  useEffect(() => {
    return () => {
      if (pitchReconcileTimerRef.current.single) {
        window.clearTimeout(pitchReconcileTimerRef.current.single);
      }
      if (pitchReconcileTimerRef.current.split) {
        window.clearTimeout(pitchReconcileTimerRef.current.split);
      }
      setTerrainLoading(false);
    };
  }, [setTerrainLoading]);

  useEffect(() => {
    const single = mapRef.current.single;
    const split = mapRef.current.split;

    if (!single && !split) return;

    const flushPending = (target, sourceEvent) => {
      const map = mapRef.current[target];
      if (!map) return;

      if (!pending3DApplyRef.current[target]) return;
      if (!map.isStyleLoaded()) return;

      apply3DToMap(target, `pending-flush:${sourceEvent}`);
      finalizeTerrainLoading();
    };

    const handleSingleStyleData = () => flushPending("single", "styledata");
    const handleSplitStyleData = () => flushPending("split", "styledata");
    const handleSingleIdle = () => flushPending("single", "idle");
    const handleSplitIdle = () => flushPending("split", "idle");

    if (single) {
      single.on("styledata", handleSingleStyleData);
      single.on("idle", handleSingleIdle);
    }
    if (split) {
      split.on("styledata", handleSplitStyleData);
      split.on("idle", handleSplitIdle);
    }

    return () => {
      if (single) {
        single.off("styledata", handleSingleStyleData);
        single.off("idle", handleSingleIdle);
      }
      if (split) {
        split.off("styledata", handleSplitStyleData);
        split.off("idle", handleSplitIdle);
      }
    };
  }, [apply3DToMap, finalizeTerrainLoading, mapsReady.single, mapsReady.split]);

  useEffect(() => {
    setTerrainLoading(true);
    apply3DToMap("single", "terrain-change");
    apply3DToMap("split", "terrain-change");
    finalizeTerrainLoading();
  }, [terrainState, apply3DToMap, finalizeTerrainLoading, setTerrainLoading]);

  // ─── Category Layers Effect ─────────────────────────────────────────
  // Đồng bộ categoryLayersData từ useMapStore lên map
  const prevCategoryKeysRef = useRef(new Set());

  useEffect(() => {
    const map = mapRef.current.single;
    if (!map || !mapsReady.single) return;

    const currentKeys = new Set(Object.keys(categoryLayersData));
    const prevKeys = prevCategoryKeysRef.current;

    // Thêm/cập nhật các layers mới hoặc thay đổi trên single map
    currentKeys.forEach((sourceId) => {
      const { geojson, geometryType, color, icon } =
        categoryLayersData[sourceId];
      addOrUpdateCategoryLayer(
        map,
        sourceId,
        geojson,
        geometryType,
        color,
        true,
        icon,
      );
    });

    // Xóa các layers đã bị remove khỏi store trên single map
    prevKeys.forEach((sourceId) => {
      if (!currentKeys.has(sourceId)) removeCategoryLayer(map, sourceId);
    });

    // Đồng bộ lên split map (luôn luôn, không phụ thuộc vào isSplitMode)
    const splitMap = mapRef.current.split;
    if (splitMap) {
      const applyToSplit = () => {
        currentKeys.forEach((sourceId) => {
          const { geojson, geometryType, color, icon } =
            categoryLayersData[sourceId];
          addOrUpdateCategoryLayer(
            splitMap,
            sourceId,
            geojson,
            geometryType,
            color,
            true,
            icon,
          );
        });
        prevKeys.forEach((sourceId) => {
          if (!currentKeys.has(sourceId))
            removeCategoryLayer(splitMap, sourceId);
        });
      };

      if (splitMap.isStyleLoaded()) {
        applyToSplit();
      } else {
        splitMap.once("style.load", applyToSplit);
      }
    }

    prevCategoryKeysRef.current = currentKeys;
  }, [categoryLayersData, mapsReady.single]);

  const prevOgcKeysRef = useRef(new Set());

  useEffect(() => {
    const map = mapRef.current.single;
    if (!map || !mapsReady.single) return;

    const currentKeys = new Set(Object.keys(ogcLayersData));
    const prevKeys = prevOgcKeysRef.current;

    currentKeys.forEach((sourceId) => {
      addOrUpdateGeoServerLayer(map, sourceId, ogcLayersData[sourceId], true);
    });

    prevKeys.forEach((sourceId) => {
      if (!currentKeys.has(sourceId)) {
        removeGeoServerLayer(map, sourceId);
      }
    });

    const splitMap = mapRef.current.split;
    if (splitMap) {
      const applyToSplit = () => {
        currentKeys.forEach((sourceId) => {
          addOrUpdateGeoServerLayer(
            splitMap,
            sourceId,
            ogcLayersData[sourceId],
            true,
          );
        });
        prevKeys.forEach((sourceId) => {
          if (!currentKeys.has(sourceId)) {
            removeGeoServerLayer(splitMap, sourceId);
          }
        });
      };

      if (splitMap.isStyleLoaded()) {
        applyToSplit();
      } else {
        splitMap.once("style.load", applyToSplit);
      }
    }

    prevOgcKeysRef.current = currentKeys;
  }, [ogcLayersData, mapsReady.single]);

  useEffect(() => {
    const map = mapRef.current.single;
    if (!map || !mapsReady.single) return;

    let disposed = false;

    const handleOgcLayerClick = async (event) => {
      if (clickedPointMode) return;

      const styleLayers = map.getStyle()?.layers || [];
      const categoryLayerIds = styleLayers
        .map((layer) => layer.id)
        .filter((id) => id.startsWith("cat-"));
      const categoryFeatures = categoryLayerIds.length
        ? map.queryRenderedFeatures(event.point, { layers: categoryLayerIds })
        : [];

      if (categoryFeatures.length > 0) return;

      const pointLayerEntries = Object.values(ogcLayersData || {})
        .filter(
          (layer) =>
            layer?.geoserver_layer && isOgcPointGeometry(layer.geometry_type),
        )
        .map((layer) => {
          const sourceId = buildOgcSourceId(layer);
          return {
            sourceId,
            layer,
            ids: buildOgcPointLayerIds(sourceId),
          };
        });

      const pointRenderedLayerIds = pointLayerEntries
        .flatMap(({ ids }) => [ids.cluster, ids.point])
        .filter((layerId) => map.getLayer(layerId));
      const pointFeatures = pointRenderedLayerIds.length
        ? map.queryRenderedFeatures(event.point, {
            layers: pointRenderedLayerIds,
          })
        : [];
      const pointFeature = pointFeatures[0];

      if (pointFeature) {
        const entry = pointLayerEntries.find(
          ({ sourceId }) => sourceId === pointFeature.source,
        );
        if (!entry) return;

        if (pointFeature.properties?.cluster) {
          const clusterId = pointFeature.properties.cluster_id;
          const source = map.getSource(entry.sourceId);
          source?.getClusterExpansionZoom(clusterId, (error, zoom) => {
            if (error || disposed) return;
            map.easeTo({
              center: pointFeature.geometry.coordinates,
              zoom,
              duration: 350,
            });
          });
          return;
        }

        useModalMapLayerStore
          .getState()
          .openModal(mapOgcFeatureToModalData(pointFeature, entry.layer));
        return;
      }

      const activeLayers = Object.values(ogcLayersData || {})
        .filter(
          (layer) =>
            layer?.geoserver_layer && !isOgcPointGeometry(layer.geometry_type),
        )
        .sort((a, b) => {
          const priorityDiff =
            getOgcIdentifyPriority(b.geometry_type) -
            getOgcIdentifyPriority(a.geometry_type);
          if (priorityDiff !== 0) return priorityDiff;
          return (b.sort_order || 0) - (a.sort_order || 0);
        });

      if (!activeLayers.length) return;

      for (const layer of activeLayers) {
        const url = buildOgcFeatureInfoUrl(map, layer, event.point);
        if (!url) continue;

        try {
          const response = await fetch(url);
          if (!response.ok) {
            continue;
          }

          const data = await response.json();
          const feature = data?.features?.[0];
          if (!feature) continue;

          if (disposed) return;

          useModalMapLayerStore
            .getState()
            .openModal(mapOgcFeatureToModalData(feature, layer));
          return;
        } catch {
          // Ignore a failed identify request and continue with lower layers.
        }
      }
    };

    map.on("click", handleOgcLayerClick);

    return () => {
      disposed = true;
      map.off("click", handleOgcLayerClick);
    };
  }, [clickedPointMode, ogcLayersData, mapsReady.single]);

  // ─── Re-apply Category Layers sau khi đổi style ──────────────────────
  // Listener đã được setup trong setStyle effect bên trên, không cần setup lại

  // ─── Click on Category Point Layers → Open Modal ────────────────────
  useEffect(() => {
    const map = mapRef.current.single;
    if (!map || !mapsReady.single) return;

    const handlePointClick = (e) => {
      const feature = e.features?.[0];
      if (!feature?.properties) return;

      // Reconstruct mapLayer data từ GeoJSON feature properties
      const props = { ...feature.properties };

      // Parse lại các property là JSON string (Mapbox flatten nested objects)
      Object.keys(props).forEach((key) => {
        if (
          typeof props[key] === "string" &&
          (props[key].startsWith("{") || props[key].startsWith("["))
        ) {
          try {
            props[key] = JSON.parse(props[key]);
          } catch {
            // giữ nguyên string
          }
        }
      });

      const mapLayerData = {
        id: props.id,
        category: props.category,
        name: props.name || "Không có tên",
        geometry_type: "point",
        geometry_data: feature.geometry,
        properties: props,
      };

      useModalMapLayerStore.getState().openModal(mapLayerData);
    };

    // Track registered layers để cleanup
    const registeredLayers = [];

    const registerClickHandlers = () => {
      // Tìm tất cả category point layers hiện tại
      const style = map.getStyle();
      if (!style?.layers) return;

      style.layers.forEach((layer) => {
        if (
          layer.id.startsWith("cat-") &&
          layer.id.endsWith("-point") &&
          !registeredLayers.includes(layer.id)
        ) {
          map.on("click", layer.id, handlePointClick);
          map.on("mouseenter", layer.id, () => {
            map.getCanvas().style.cursor = "pointer";
          });
          map.on("mouseleave", layer.id, () => {
            map.getCanvas().style.cursor = "";
          });
          registeredLayers.push(layer.id);
        }
      });
    };

    // Register ngay và mỗi khi style thay đổi
    registerClickHandlers();
    map.on("styledata", registerClickHandlers);

    return () => {
      try {
        registeredLayers.forEach((layerId) => {
          map.off("click", layerId, handlePointClick);
          map.off("mouseenter", layerId, () => {});
          map.off("mouseleave", layerId, () => {});
        });
        map.off("styledata", registerClickHandlers);
      } catch {
        // Map may already be removed during navigation — safe to ignore
      }
    };
  }, [categoryLayersData, mapsReady.single]);

  // ─── Highlight Feature Effect ───────────────────────────────────────
  // Highlight đối tượng từ search hoặc click

  useEffect(() => {
    const map = mapRef.current.single;
    if (!map || !mapsReady.single) return;

    if (highlightedFeature) {
      highlightFeatureOnMap(map, highlightedFeature);
    } else {
      clearHighlightFromMap(map);
    }
  }, [highlightedFeature, mapsReady.single]);

  return (
    <div className="relative size-full">
      <div ref={mapContainer} className="relative size-full">
        <div ref={splitMapContainerRef} style={mapStyleRef} />
        <div ref={singleMapContainerRef} style={mapStyleRef} />
      </div>

      {/* Canvas streamlines gió */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 2,
        }}
      />
      <WeatherInfo />
      {/* Float UI controls – ẩn khi có lớp thời tiết đang hiển thị */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 10,
          visibility: hasActiveWeatherLayers ? "hidden" : "visible",
          transition: "visibility 200ms ease",
        }}
      >
        <MapToolbar mapRef={mapRef} />
        <MapStatusBar
          lat={mapState.lat}
          lng={mapState.lng}
          zoom={mapState.zoom}
        />
        {/* Legend stack – bottom-left corner */}
        <div className="absolute bottom-2 left-2 flex flex-col-reverse gap-2 items-start pointer-events-none">
          <div className="pointer-events-auto">
            <SatelliteLegend />
          </div>
        </div>
        <AQIPopup />
        <MapLayerDetailModal />
      </div>
    </div>
  );
}

class ResetControl {
  constructor(getTerrainState) {
    this._getTerrainState = getTerrainState;
  }

  onAdd(map) {
    this._map = map;

    // Create button
    this._btn = document.createElement("button");
    this._btn.className = "mapboxgl-ctrl-icon";
    this._btn.title = "Reset về vị trí mặc định";
    Object.assign(this._btn.style, {
      width: "29px",
      height: "29px",
      background: "white",
      border: "none",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    });

    this._btn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 2v6h-6"/>
        <path d="M3 12a9 9 0 0 1 9-9c2.5 0 4.8 1 6.5 2.7L21 8"/>
        <path d="M3 22v-6h6"/>
        <path d="M21 12a9 9 0 0 1-9 9c-2.5 0 4.8-1-6.5-2.7L3 16"/>
      </svg>
    `;

    this._btn.onclick = () => {
      // Get current terrain state when button is clicked
      const currentTerrainState =
        typeof this._getTerrainState === "function"
          ? this._getTerrainState()
          : this._getTerrainState;

      resetViewPort(this._map, currentTerrainState);
    };

    // Create container control
    this._container = document.createElement("div");
    this._container.className = "mapboxgl-ctrl-group mapboxgl-ctrl";
    this._container.appendChild(this._btn);
    return this._container;
  }

  onRemove() {
    if (this._container && this._container.parentNode) {
      this._container.parentNode.removeChild(this._container);
    }
    this._map = undefined;
    this._btn = undefined;
    this._container = undefined;
    this._getTerrainState = undefined;
  }
}
