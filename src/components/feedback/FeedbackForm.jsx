import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LocateFixed, Upload } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createFeedback } from "@/services/feedbackService";

const DEFAULT_COORDINATES = {
  lng: "107.95",
  lat: "14.35",
};

const initialForm = {
  category: "hien_trang",
  priority: "normal",
  title: "",
  description: "",
  lng: DEFAULT_COORDINATES.lng,
  lat: DEFAULT_COORDINATES.lat,
  media: [],
};

function formatCoordinate(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "";
  return number.toFixed(6);
}

function createClientUuid() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `kontum-feedback-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function FeedbackForm({
  initialCoordinates,
  onSuccess,
  onCancel,
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(() => ({
    ...initialForm,
    lng: initialCoordinates?.lng
      ? formatCoordinate(initialCoordinates.lng)
      : initialForm.lng,
    lat: initialCoordinates?.lat
      ? formatCoordinate(initialCoordinates.lat)
      : initialForm.lat,
  }));
  const [locationLoading, setLocationLoading] = useState(false);

  const selectedFilesLabel = useMemo(() => {
    if (!form.media.length) return "Chưa chọn tệp";
    if (form.media.length === 1) return form.media[0].name;
    return `${form.media.length} tệp đã chọn`;
  }, [form.media]);

  const mutation = useMutation({
    mutationFn: (payload) => createFeedback(payload),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["feedback", "mine"] });
      toast.success(
        response?.data?.duplicated
          ? "Phản ánh đã được ghi nhận trước đó."
          : "Đã gửi phản ánh hiện trường.",
      );
      setForm({
        ...initialForm,
        lng: initialCoordinates?.lng
          ? formatCoordinate(initialCoordinates.lng)
          : initialForm.lng,
        lat: initialCoordinates?.lat
          ? formatCoordinate(initialCoordinates.lat)
          : initialForm.lat,
      });
      onSuccess?.(response);
    },
    onError: (error) => {
      toast.error(error?.message || "Không thể gửi phản ánh. Vui lòng thử lại.");
    },
  });

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.warning("Trình duyệt không hỗ trợ lấy vị trí hiện tại.");
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationLoading(false);
        setForm((prev) => ({
          ...prev,
          lng: formatCoordinate(position.coords.longitude),
          lat: formatCoordinate(position.coords.latitude),
        }));
      },
      () => {
        setLocationLoading(false);
        toast.error("Không thể lấy vị trí hiện tại.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const title = form.title.trim();
    if (title.length < 5) {
      toast.warning("Tiêu đề phản ánh cần ít nhất 5 ký tự.");
      return;
    }

    const lng = Number(form.lng);
    const lat = Number(form.lat);
    if (!Number.isFinite(lng) || lng < 106 || lng > 109) {
      toast.warning("Kinh độ phải nằm trong khoảng 106 đến 109.");
      return;
    }
    if (!Number.isFinite(lat) || lat < 13 || lat > 16.5) {
      toast.warning("Vĩ độ phải nằm trong khoảng 13 đến 16.5.");
      return;
    }

    mutation.mutate({
      category: form.category,
      priority: form.priority,
      title,
      description: form.description.trim(),
      lng,
      lat,
      clientUuid: createClientUuid(),
      media: form.media,
    });
  };

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="feedback-category">Loại phản ánh</Label>
          <Select
            value={form.category}
            onValueChange={(value) => updateField("category", value)}
          >
            <SelectTrigger id="feedback-category" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="chay_rung">Cháy rừng</SelectItem>
              <SelectItem value="vi_pham">Vi phạm</SelectItem>
              <SelectItem value="hien_trang">Hiện trạng</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="feedback-priority">Mức ưu tiên</Label>
          <Select
            value={form.priority}
            onValueChange={(value) => updateField("priority", value)}
          >
            <SelectTrigger id="feedback-priority" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Thấp</SelectItem>
              <SelectItem value="normal">Bình thường</SelectItem>
              <SelectItem value="high">Cao</SelectItem>
              <SelectItem value="urgent">Khẩn cấp</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="feedback-title">Tiêu đề</Label>
        <Input
          id="feedback-title"
          value={form.title}
          maxLength={255}
          placeholder="Ví dụ: Phát hiện khói gần bìa rừng"
          onChange={(event) => updateField("title", event.target.value)}
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="feedback-description">Mô tả</Label>
        <Textarea
          id="feedback-description"
          value={form.description}
          maxLength={2000}
          placeholder="Mô tả ngắn gọn hiện trạng, dấu hiệu, thời điểm phát hiện..."
          className="min-h-28"
          onChange={(event) => updateField("description", event.target.value)}
        />
      </div>

      <div className="grid gap-3 rounded-lg border border-border bg-muted/30 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label>Vị trí phản ánh</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            isLoading={locationLoading}
            onClick={handleUseCurrentLocation}
          >
            <LocateFixed />
            Lấy vị trí hiện tại
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="feedback-lng">Kinh độ</Label>
            <Input
              id="feedback-lng"
              inputMode="decimal"
              value={form.lng}
              onChange={(event) => updateField("lng", event.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="feedback-lat">Vĩ độ</Label>
            <Input
              id="feedback-lat"
              inputMode="decimal"
              value={form.lat}
              onChange={(event) => updateField("lat", event.target.value)}
              required
            />
          </div>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="feedback-media">Ảnh/video hiện trường</Label>
        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-dashed border-border bg-card px-3 py-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground">
          <span className="inline-flex min-w-0 items-center gap-2">
            <Upload className="h-4 w-4 shrink-0" />
            <span className="truncate">{selectedFilesLabel}</span>
          </span>
          <span className="shrink-0 text-xs">Chọn tệp</span>
          <input
            id="feedback-media"
            type="file"
            accept="image/*,video/*"
            multiple
            className="sr-only"
            onChange={(event) =>
              updateField("media", Array.from(event.target.files || []))
            }
          />
        </label>
      </div>

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            disabled={mutation.isPending}
            onClick={onCancel}
          >
            Hủy
          </Button>
        )}
        <Button type="submit" isLoading={mutation.isPending}>
          Gửi phản ánh
        </Button>
      </div>
    </form>
  );
}
