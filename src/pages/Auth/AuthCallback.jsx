import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { exchangeOAuthCode } from "@/services/authService";
import useAuthStore from "@/stores/useAuthStore.jsx";
import AuthShell from "@/pages/Auth/AuthShell";
import AuthStatus from "@/pages/Auth/AuthStatus";

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code");
  const [status, setStatus] = useState(code ? "loading" : "error");
  const [message, setMessage] = useState(
    code
      ? "Đang xác thực tài khoản Google và thiết lập phiên làm việc..."
      : "Liên kết xác thực không hợp lệ hoặc đã hết hạn.",
  );
  const navigate = useNavigate();
  const fetchProfile = useAuthStore((state) => state.fetchProfile);
  const exchangedRef = useRef(false);

  useEffect(() => {
    if (exchangedRef.current) return;
    exchangedRef.current = true;
    if (!code) return;

    exchangeOAuthCode(code)
      .then(() => fetchProfile())
      .then(() => {
        setStatus("success");
        setMessage("Xác thực thành công. Đang mở bản đồ cho bạn...");
        window.setTimeout(() => navigate("/map", { replace: true }), 1000);
      })
      .catch((error) => {
        setStatus("error");
        setMessage(
          error?.data?.message ||
            error?.message ||
            "Không thể hoàn tất đăng nhập Google.",
        );
      });
  }, [code, fetchProfile, navigate]);

  return (
    <AuthShell
      compact
      eyebrow="Xác thực an toàn"
      title="Đăng nhập Google"
      description="WebGIS Kon Tum đang kiểm tra thông tin đăng nhập của bạn."
    >
      <AuthStatus status={status} message={message}>
        {status === "error" && (
          <Button asChild variant="outline" className="mt-6 w-full rounded-xl">
            <Link to="/login">Quay lại đăng nhập</Link>
          </Button>
        )}
      </AuthStatus>
    </AuthShell>
  );
}
