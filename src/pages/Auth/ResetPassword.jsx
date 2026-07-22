import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { ArrowRight, Check, KeyRound } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/services/authService";
import AuthShell from "@/pages/Auth/AuthShell";
import AuthStatus from "@/pages/Auth/AuthStatus";
import PasswordField from "@/pages/Auth/PasswordField";

export default function ResetPassword() {
  const [completed, setCompleted] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { password: "", confirmPassword: "" } });

  const onSubmit = async ({ password }) => {
    if (!token) return;
    try {
      await resetPassword({ token, newPassword: password });
      setCompleted(true);
      window.setTimeout(() => navigate("/login", { replace: true }), 1500);
    } catch (error) {
      toast.error(
        error?.data?.message ||
          error?.message ||
          "Không thể cập nhật mật khẩu.",
      );
    }
  };

  return (
    <AuthShell
      compact
      eyebrow="Bảo mật tài khoản"
      title="Tạo mật khẩu mới"
      description="Mật khẩu mới nên dễ nhớ với bạn nhưng khó đoán với người khác."
    >
      {!token ? (
        <AuthStatus
          status="error"
          message="Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn."
        >
          <Button asChild variant="outline" className="mt-6 w-full rounded-xl">
            <Link to="/forgot-password">Yêu cầu liên kết mới</Link>
          </Button>
        </AuthStatus>
      ) : completed ? (
        <AuthStatus
          status="success"
          message="Mật khẩu đã được cập nhật. Đang chuyển bạn tới trang đăng nhập..."
        />
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu mới</Label>
            <PasswordField
              id="password"
              autoComplete="new-password"
              placeholder="Tối thiểu 8 ký tự"
              error={errors.password}
              {...register("password", {
                required: "Vui lòng nhập mật khẩu mới.",
                minLength: { value: 8, message: "Cần ít nhất 8 ký tự." },
              })}
            />
            {errors.password && (
              <p className="text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Nhập lại mật khẩu</Label>
            <PasswordField
              id="confirmPassword"
              autoComplete="new-password"
              placeholder="Xác nhận mật khẩu mới"
              error={errors.confirmPassword}
              {...register("confirmPassword", {
                validate: (value) =>
                  value === getValues("password") ||
                  "Mật khẩu xác nhận không khớp.",
              })}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <div className="rounded-xl border border-border/70 bg-muted/60 p-3.5">
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-foreground">
              <KeyRound className="size-3.5 text-primary" />
              Gợi ý mật khẩu an toàn
            </p>
            <div className="grid gap-1.5 text-xs text-muted-foreground">
              {["Ít nhất 8 ký tự", "Không dùng lại mật khẩu cũ"].map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <Check className="size-3.5 text-success" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            variant="gradient-primary"
            size="lg"
            isLoading={isSubmitting}
            className="h-12 w-full rounded-xl"
          >
            Cập nhật mật khẩu
            {!isSubmitting && <ArrowRight />}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
