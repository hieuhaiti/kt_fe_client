import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <main className="grid min-h-screen place-items-center bg-background px-6 py-24 sm:py-32 lg:px-8">
      <div className="text-center">
        <p className="text-3xl text-(--error-401)">401</p>
        <h1 className="mt-4 text-5xl text-(--error-401) sm:text-7xl font-bold tracking-tight">
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
