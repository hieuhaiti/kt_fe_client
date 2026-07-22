import { useMemo, useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import FeedbackForm from "@/components/feedback/FeedbackForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMapStore } from "@/stores/Map/useMapStore";

function getMapCenter(mapRefObj) {
  const map = mapRefObj?.current?.single || mapRefObj?.current;
  if (!map?.getCenter) return null;
  const center = map.getCenter();
  return { lng: center.lng, lat: center.lat };
}

export default function FloatButton() {
  const [open, setOpen] = useState(false);
  const clickedPoint = useMapStore((state) => state.clickedPoint);
  const mapRefObj = useMapStore((state) => state.mapRefObj);

  const initialCoordinates = useMemo(
    () => clickedPoint || getMapCenter(mapRefObj),
    [clickedPoint, mapRefObj],
  );

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="gradient-primary"
            size="icon-lg"
            className="fixed right-6 bottom-6 z-40 rounded-full shadow-lg"
            onClick={() => setOpen(true)}
            aria-label="Gửi phản ánh hiện trường"
          >
            <MessageSquarePlus className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">Gửi phản ánh hiện trường</TooltipContent>
      </Tooltip>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gửi phản ánh hiện trường</DialogTitle>
            <DialogDescription>
              Gửi thông tin kèm tọa độ và hình ảnh để cơ quan chức năng tiếp nhận
              xử lý.
            </DialogDescription>
          </DialogHeader>
          <FeedbackForm
            initialCoordinates={initialCoordinates}
            onSuccess={() => setOpen(false)}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
