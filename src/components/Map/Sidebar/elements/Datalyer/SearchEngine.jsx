import { useState, useRef, useCallback, useEffect } from "react";
import { Search, X, MapPin, ArrowUpRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import LoadingInline from "@/components/common/LoadingInline";
import {
  getMapLayer,
  useGetMapLayersQuery,
} from "@/services/mapLayersService";
import { useMapStore } from "@/stores/Map/useMapStore";
import { useDataLayerStore } from "@/stores/Map/Sidebar/useDataLayerStore";
import { useDebounce } from "@/hooks/useDebounce";
import { flyToFeature } from "@/helper/Map/MapHelper";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function SearchEngine() {
  const [searchValue, setSearchValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [loadingId, setLoadingId] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const inputRef = useRef(null);
  const suggestionListRef = useRef(null);

  const debouncedKeyword = useDebounce(searchValue, 400);
  const searchText = debouncedKeyword?.trim();

  // Tim kiem layer trong catalog /map/layers.
  const { data, isLoading } = useGetMapLayersQuery(
    {
      page: 1,
      limit: 100,
      is_active: true,
      is_public: true,
      q: searchText,
    },
    { enabled: !!searchText },
  );

  useEffect(() => {
    setSearchResults(
      data?.data?.items ??
        data?.data?.layers ??
        data?.data?.mapLayers ??
        data?.items ??
        [],
    );
  }, [data]);

  // Xử lý nhập liệu
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);
    setShowSuggestions(value.length > 0);
  };

  const handleInputFocus = () => {
    setInputFocused(true);
    if (searchValue) setShowSuggestions(true);
  };

  const handleInputBlur = () => {
    // Delay để cho phép click vào suggestion trước khi đóng
    setTimeout(() => {
      setInputFocused(false);
    }, 200);
  };

  const handleSelectResult = useCallback(async (result) => {
    try {
      const layerCode = result.code || result.id;
      setLoadingId(layerCode);

      // 1. Lấy chi tiết map layer
      const response = await getMapLayer(layerCode);
      const mapLayer = response?.data?.mapLayer || response?.data || result;
      if (!mapLayer) return;

      // 2. Bật category layer tương ứng (nếu chưa bật)
      //    LayerItem sẽ tự fetch + sync data lên map qua React Query
      const layerStore = useDataLayerStore.getState();
      const ogcLayer = layerStore.ogcLayers.find(
        (layer) =>
          String(layer.code || layer.id) === String(mapLayer.code || layerCode),
      );
      if (ogcLayer && !ogcLayer.enabled) {
        layerStore.toggleOgcLayerEnabled(ogcLayer.id, true);
      }

      // 3. Fly-to bbox (không vẽ highlight, để LayerItem tự render dữ liệu thật)
      if (mapLayer.bbox) {
        const map = useMapStore.getState().getMap();
        if (map) {
          flyToFeature(map, {
            type: "Feature",
            properties: {},
            geometry: mapLayer.bbox,
          });
        }
      }

      setSearchValue("");
      setShowSuggestions(false);
    } catch (error) {
      console.warn("Lỗi khi lấy chi tiết map layer:", error.message);
    } finally {
      setLoadingId(null);
    }
  }, []);

  // Xóa ô tìm kiếm
  const handleClearSearch = () => {
    setSearchValue("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <div className="flex-1 flex flex-col gap-4">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
        <Search className="w-5 h-5" />
        Tìm kiếm
      </h2>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder="Tìm kiếm địa điểm..."
          value={searchValue}
          onChange={handleSearchChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          className="pl-9 pr-9"
        />
        {searchValue && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={handleClearSearch}
                className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full"
                aria-label="Xóa nội dung tìm kiếm"
              >
                <X className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Xóa nội dung tìm kiếm</TooltipContent>
          </Tooltip>
        )}

        {/* Search Results Overlay */}
        {showSuggestions && (inputFocused || searchResults.length > 0) && (
          <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-background border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center px-3 py-6">
                <LoadingInline size="small" />
              </div>
            ) : searchResults.length === 0 && debouncedKeyword ? (
              <div className="px-3 py-4 text-center text-muted-foreground">
                <MapPin className="w-6 h-6 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Không tìm thấy kết quả phù hợp</p>
              </div>
            ) : (
              <div ref={suggestionListRef} className="py-1.5">
                {searchResults.map((result) => (
                  <Button
                    type="button"
                    variant="outline"
                    key={result.id}
                    onClick={() => handleSelectResult(result)}
                    disabled={loadingId === (result.code || result.id)}
                    className="h-auto w-full justify-start gap-3 rounded-sm px-3 py-2 text-left"
                  >
                    <MapPin className="w-5 h-5 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate text-foreground">
                        {result.name_vi || result.name_en || result.name || result.code}
                      </div>
                      <div className="text-xs truncate text-muted-foreground opacity-75">
                        {result.geometry_type || result.layer_group || result.category}
                      </div>
                    </div>
                    {loadingId === (result.code || result.id) ? (
                      <LoadingInline size="small" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
