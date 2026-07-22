import { SearchEngine } from "./SearchEngine";
import { StyleChange } from "./StyleChange";
import { LayerSelection } from "./LayerSelection";
import { WeatherSelection } from "./WeatherSelection";

export function DataLayers() {
  return (
    <div className="flex flex-col h-full overflow-y-auto p-2 space-y-6 border-border">
      {/* Search Section */}
      <SearchEngine />

      <hr className="border-border" />

      {/* Weather Layer Section */}
      <WeatherSelection />

      <hr className="border-border" />

      {/* Data Layer Section */}
      <LayerSelection />

      <hr className="border-border" />

      {/* Style Change Section */}
      <StyleChange />
    </div>
  );
}
