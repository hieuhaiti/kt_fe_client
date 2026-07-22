import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function ServiceUnavailablePage() {
  const navigate = useNavigate();

  return (
    <main className="grid min-h-screen place-items-center bg-background px-6 py-24 sm:py-32 lg:px-8">
      <div className="text-center">
        <p className="text-3xl text-(--error-503)">503</p>
        <h1 className="mt-4 text-5xl text-(--error-503) sm:text-7xl font-bold tracking-tight">
          Dịch vụ không khả dụng
        </h1>
        <p className="mt-6 text-lg sm:text-xl font-medium text-muted-foreground">
          Hệ thống đang bảo trì. Vui lòng quay lại sau.
        </p>
        <div className="mt-10 flex items-center justify-center">
          <Button
            variant="soft-info"
            onClick={() => navigate("/")}
          >
            Về trang chủ
          </Button>
        </div>
      </div>
    </main>
  );
}
