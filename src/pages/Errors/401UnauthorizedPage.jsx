import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <main className="grid min-h-screen place-items-center bg-background bg-(image:--error-401-surface) px-6 py-24 sm:py-32 lg:px-8">
      <div className="rounded-3xl border border-(--error-401-bg-color)/20 bg-card/80 px-6 py-10 text-center shadow-xl backdrop-blur-sm sm:px-12">
        <p className="text-3xl font-bold text-(--error-401-bg-color)">401</p>
        <h1 className="mt-4 text-5xl text-(--error-401-bg-color) sm:text-7xl font-bold tracking-tight">
          Chưa xác thực
        </h1>
        <p className="mt-6 text-lg sm:text-xl font-medium text-muted-foreground">
          Bạn cần đăng nhập để truy cập trang này.
        </p>
        <div className="mt-10 flex items-center justify-center">
          <Button
            variant="soft-warning"
            onClick={() => navigate("/login")}
          >
            Đăng nhập
          </Button>
        </div>
      </div>
    </main>
  );
}
