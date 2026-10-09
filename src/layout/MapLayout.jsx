import { lazy, Suspense } from "react";
import LoadingInline from "@/components/common/LoadingInline";
import Header from "@/components/layout/Header";
import SideBar from "@/components/Map/Sidebar/SideBar";
import IconTrack from "@/components/Map/Sidebar/IconTrack";
import FloatButton from "@/components/common/FloatButton";
import { useMapStore } from "@/stores/Map/useMapStore";

const MapComponent = lazy(() => import("@/components/Map/MapComponent"));

function MapLayout() {
  const activePanel = useMapStore((s) => s.activePanel);
  const setActivePanel = useMapStore((s) => s.setActivePanel);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />
      <div className="relative flex flex-1 overflow-hidden">
        {/* On desktop (lg:), sidebar is in-flow. On mobile (<lg:), sidebar is overlay drawer with backdrop */}
        {activePanel && (
          <>
            {/* Backdrop for mobile */}
            <div
              className="fixed inset-0 top-16 bg-black/40 z-20 lg:hidden cursor-pointer backdrop-blur-[1px]"
              onClick={() => setActivePanel(null)}
              aria-hidden="true"
            />
            {/* Sidebar container */}
            <div className="fixed inset-y-16 left-0 z-30 max-w-[85vw] sm:max-w-sm lg:static lg:inset-auto lg:z-auto lg:flex">
              <SideBar />
            </div>
          </>
        )}

        <div className="relative flex-1 w-full h-full">
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
