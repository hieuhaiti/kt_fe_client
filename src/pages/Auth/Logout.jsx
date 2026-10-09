import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "@/stores/useAuthStore.jsx";
import AuthShell from "@/pages/Auth/AuthShell";
import AuthStatus from "@/pages/Auth/AuthStatus";

export default function Logout() {
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    logout().finally(() => navigate("/login", { replace: true }));
  }, [logout, navigate]);

  return (
    <AuthShell
      compact
      eyebrow="Tài khoản"
      title="Đang đăng xuất"
      description="Đang kết thúc phiên đăng nhập trên thiết bị này."
    >
      <AuthStatus
        status="loading"
        message="Bạn sẽ trở về trang đăng nhập sau giây lát."
      />
    </AuthShell>
  );
}
