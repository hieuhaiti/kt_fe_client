import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function InternalServerErrorPage() {
  const navigate = useNavigate();

  return (
    <main className="grid min-h-screen place-items-center bg-background px-6 py-24 sm:py-32 lg:px-8">
      <div className="text-center">
        <p className="text-3xl text-(--error-500)">500</p>
        <h1 className="mt-4 text-5xl text-(--error-500) sm:text-7xl font-bold tracking-tight">
          Lỗi máy chủ
        </h1>
        <p className="mt-6 text-lg sm:text-xl font-medium text-muted-foreground">
          Đã xảy ra lỗi từ phía máy chủ. Vui lòng thử lại sau.
        </p>
        <div className="mt-10 flex items-center justify-center">
          <Button
            variant="soft-destructive"
            onClick={() => navigate("/")}
          >
            Về trang chủ
          </Button>
        </div>
      </div>
    </main>
  );
}
