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
      ? "Đang xác minh email..."
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
            "Đã xác minh email. Bạn có thể đăng nhập.",
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
      description="Xác minh email để hoàn tất đăng ký."
    >
      <AuthStatus status={status} message={message}>
        {status !== "loading" && (
          <Button asChild variant="outline" className="mt-6 w-full rounded-xl">
            <Link to="/login">Đăng nhập</Link>
          </Button>
        )}
      </AuthStatus>
    </AuthShell>
  );
}
