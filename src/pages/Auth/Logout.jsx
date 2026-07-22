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
      eyebrow="Bảo vệ phiên làm việc"
      title="Đang đăng xuất"
      description="Hệ thống đang đóng phiên và xóa thông tin xác thực trên thiết bị này."
    >
      <AuthStatus
        status="loading"
        message="Vui lòng chờ trong giây lát. Bạn sẽ được chuyển về trang đăng nhập."
      />
    </AuthShell>
  );
}
