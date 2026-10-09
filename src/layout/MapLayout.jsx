import { lazy, Suspense } from "react";
import LoadingInline from "@/components/common/LoadingInline";
import Header from "@/components/layout/Header";
import SideBar from "@/components/Map/Sidebar/SideBar";
import IconTrack from "@/components/Map/Sidebar/IconTrack";
import FloatButton from "@/components/common/FloatButton";

const MapComponent = lazy(() => import("@/components/Map/MapComponent"));

function MapLayout() {

  return (
    <div className="flex flex-col h-dvh overflow-hidden">
      <Header />
      <div className="relative flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
        {/* Keep the panel below the map on mobile and beside it on desktop. */}
        <div className="order-last lg:order-first h-2/5 lg:h-full w-full lg:w-80 shrink-0 min-h-0">
          <SideBar />
        </div>

        <div className="relative flex-1 min-w-0 min-h-0">
          <Suspense fallback={<LoadingInline position="center" />}>
            <MapComponent />
          </Suspense>
          <IconTrack />
          <FloatButton />
        </div>
      </div>
    </div>
  );
}

export default MapLayout;
