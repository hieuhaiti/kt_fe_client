import { MapPin, Thermometer, Droplets, Wind } from "lucide-react";
import LoadingInline from "@/components/common/LoadingInline";
import { useWeatherAndAQI } from "@/features/weather/openWeatherMap/useWeather";
import {
  getIcon,
  useAQILevel,
  formatTemperature,
  formatWindSpeed,
  formatHumidity,
} from "@/features/weather/openWeatherMap/weatherHelpers.jsx";
import { defaultLatLong } from "@/constant/mapData";

export function WeatherInfo() {
  const { weather, aqi, isLoading, isError } = useWeatherAndAQI(
    defaultLatLong.lat,
    defaultLatLong.lng,
    "vi",
  );

  const currentWeather = weather?.data;
  const aqiData = aqi?.data?.list?.[0]?.main;
  const aqiLevel = useAQILevel(aqiData?.aqi);

  if (isLoading) {
    return (
      <div className="absolute top-2 right-2 z-10 px-3 py-2 rounded-lg bg-card/90 backdrop-blur-sm border border-border">
        <LoadingInline color="muted-foreground" />
      </div>
    );
  }

  if (isError || !currentWeather) {
    return null;
  }

  return (
    <div className="absolute top-2 right-2 z-10 px-3 py-2 rounded-lg bg-card/90 backdrop-blur-sm border border-border min-w-45">
      <div className="flex flex-col gap-1.5 text-xs">
        {/* Location */}
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="text-foreground font-medium truncate">
            {currentWeather?.name || "Kon Tum"}
          </span>
        </div>

        {/* AQI */}
        {aqiData && (
          <div className="flex items-center gap-2">
            <img
              src={aqiLevel.icon}
              className="w-3.5 h-3.5 object-cover rounded-full shrink-0"
              alt="AQI"
            />
            <span className={`font-medium ${aqiLevel.color}`}>
              AQI: {aqiLevel.label}
            </span>
          </div>
        )}

        {/* Weather Condition */}
        <div className="flex items-center gap-2">
          {getIcon(currentWeather?.weather?.[0]?.icon, "w-3.5 h-3.5 shrink-0")}
          <span className="text-foreground capitalize">
            {currentWeather?.weather?.[0]?.description || "N/A"}
          </span>
        </div>

        {/* Temperature */}
        <div className="flex items-center gap-2">
          <Thermometer className="w-3.5 h-3.5 text-orange-500 shrink-0" />
          <span className="text-foreground">
            {formatTemperature(currentWeather?.main?.temp || 0)}
          </span>
        </div>

        {/* Humidity */}
        <div className="flex items-center gap-2">
          <Droplets className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span className="text-foreground">
            {formatHumidity(currentWeather?.main?.humidity || 0)}
          </span>
        </div>

        {/* Wind */}
        <div className="flex items-center gap-2">
          <Wind className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
          <span className="text-foreground">
            {formatWindSpeed(currentWeather?.wind?.speed || 0)}
          </span>
        </div>
      </div>
    </div>
  );
}
