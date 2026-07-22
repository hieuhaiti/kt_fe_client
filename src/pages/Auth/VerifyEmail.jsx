import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { verifyEmail } from "@/services/authService";
import AuthShell from "@/pages/Auth/AuthShell";
import AuthStatus from "@/pages/Auth/AuthStatus";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState(token ? "loading" : "error");
  const [message, setMessage] = useState(
    token
      ? "Đang xác minh địa chỉ email của bạn..."
      : "Liên kết xác minh không hợp lệ.",
  );
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    if (!token) return;

    verifyEmail(token)
      .then((response) => {
        setStatus("success");
        setMessage(
          response?.message ||
            "Email đã được xác minh. Bạn có thể đăng nhập ngay bây giờ.",
        );
      })
      .catch((error) => {
        setStatus("error");
        setMessage(
          error?.data?.message ||
            error?.message ||
            "Không thể xác minh email.",
        );
      });
  }, [token]);

  return (
    <AuthShell
      compact
      eyebrow="Xác minh tài khoản"
      title="Xác minh email"
      description="Bước này giúp bảo vệ tài khoản và bảo đảm cảnh báo được gửi đúng người."
    >
      <AuthStatus status={status} message={message}>
        {status !== "loading" && (
          <Button asChild variant="outline" className="mt-6 w-full rounded-xl">
            <Link to="/login">Tới trang đăng nhập</Link>
          </Button>
        )}
      </AuthStatus>
    </AuthShell>
  );
}
