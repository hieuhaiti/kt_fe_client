import { lazy, Suspense } from "react";
import LoadingInline from "@/components/common/LoadingInline";
import Header from "@/components/layout/Header";
import SideBar from "@/components/Map/Sidebar/SideBar";
import IconTrack from "@/components/Map/Sidebar/IconTrack";
import UnSupported from "@/components/common/UnSupported";
import FloatButton from "@/components/common/FloatButton";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const MapComponent = lazy(() => import("@/components/Map/MapComponent"));

function MapLayout() {
  const isLaptop = useMediaQuery("(min-width: 1024px)");

  if (!isLaptop) {
    return <UnSupported />;
  }

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="relative flex flex-1 overflow-hidden">
        <div className="relative flex">
          <SideBar />
        </div>

        <div className="relative flex-1">
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
