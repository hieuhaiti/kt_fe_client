import { memo } from "react";
import { Monitor, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { praseLink } from "@/lib/utils";
import Header from "@/components/common/Header";

function UnSupported() {
  const handleDownloadApp = () => {
    const url = praseLink("/uploads/apk/gis-kon-tum.apk");
    if (!url) return;
    window.location.href = url;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Monitor className="w-20 h-20 text-teal-500" />
          </div>

          <h2 className="mb-4 text-2xl font-semibold text-foreground">
            Thiết bị không được hỗ trợ
          </h2>
          <p className="max-w-md mx-auto mb-6 text-foreground/70">
            Hãy dùng màn hình rộng từ 1024 px để mở ứng dụng.
          </p>
          <p className="max-w-md mx-auto mb-6 text-sm text-foreground/70">
            Nếu dùng điện thoại Android, bạn có thể tải ứng dụng.
          </p>
          <Button onClick={handleDownloadApp} className="gap-2">
            <Smartphone className="w-4 h-4" />
            Tải ứng dụng
          </Button>
        </div>
      </main>
    </div>
  );
}

export default memo(UnSupported);
