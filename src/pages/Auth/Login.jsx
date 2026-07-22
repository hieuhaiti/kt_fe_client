import { createElement, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Check,
  Crown,
  Mail,
  ShieldCheck,
  Trees,
  UserRound,
  UsersRound,
} from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getGoogleLoginUrl, login } from "@/services/authService";
import useAuthStore from "@/stores/useAuthStore.jsx";
import AuthShell from "@/pages/Auth/AuthShell";
import PasswordField from "@/pages/Auth/PasswordField";
import { cn } from "@/lib/utils";

const DEMO_PASSWORD = "Kontum@2026";
const demoAccounts = [
  {
    email: "admin@kontum.gov.vn",
    label: "Quản trị hệ thống",
    shortLabel: "Quản trị",
    role: "system_admin",
    icon: Crown,
    badge: "Toàn quyền",
  },
  {
    email: "ubnd@kontum.gov.vn",
    label: "UBND tỉnh Kon Tum",
    shortLabel: "UBND tỉnh",
    role: "ubnd_tinh",
    icon: Building2,
    badge: "Điều hành",
  },
  {
    email: "sonn@kontum.gov.vn",
    label: "Sở NN&MT",
    shortLabel: "Sở NN&MT",
    role: "so_nnmt",
    icon: Trees,
    badge: "Nghiệp vụ",
  },
  {
    email: "citizen@kontum.gov.vn",
    label: "Tài khoản người dân",
    shortLabel: "Người dân",
    role: "citizen",
    icon: UserRound,
    badge: "Công khai",
  },
];

const schema = z.object({
  email: z.string().trim().email("Vui lòng nhập đúng địa chỉ email."),
  password: z.string().min(1, "Vui lòng nhập mật khẩu."),
});

export default function Login() {
  const [serverError, setServerError] = useState("");
  const [selectedDemoEmail, setSelectedDemoEmail] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const fetchProfile = useAuthStore((state) => state.fetchProfile);
  const {
    register,
    handleSubmit,
    setValue,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (isAuthenticated) navigate("/map", { replace: true });
  }, [isAuthenticated, navigate]);

  const selectDemoAccount = (account) => {
    setValue("email", account.email, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue("password", DEMO_PASSWORD, {
      shouldDirty: true,
      shouldValidate: true,
    });
    clearErrors();
    setServerError("");
    setSelectedDemoEmail(account.email);
  };

  const onSubmit = async (values) => {
    setServerError("");
    try {
      await login({
        email: values.email.trim().toLowerCase(),
        password: values.password,
      });
      await fetchProfile();
      toast.success("Đăng nhập thành công.");
      navigate(location.state?.from || "/map", { replace: true });
    } catch (error) {
      setServerError(
        error?.data?.message ||
          error?.message ||
          "Không thể đăng nhập. Vui lòng kiểm tra lại thông tin.",
      );
    }
  };

  return (
    <AuthShell
      compact
      eyebrow="Chào mừng trở lại"
      title="Đăng nhập WebGIS"
      description="Truy cập tài khoản để nhận cảnh báo, quản lý hồ sơ và sử dụng các tiện ích cá nhân."
    >
      {import.meta.env.DEV && (
        <section className="mb-3 rounded-xl border border-info/20 bg-(--info-subtle) p-2.5">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-xs font-bold text-(--info-subtle-foreground)">
                <UsersRound className="size-4" />
                Truy cập nhanh
              </p>
              <p className="mt-0.5 hidden text-[11px] leading-4 text-muted-foreground sm:block">
                Tài khoản mẫu dành cho môi trường phát triển.
              </p>
            </div>
            <Badge variant="soft-info">DEV</Badge>
          </div>

          <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-2 sm:gap-2">
            {demoAccounts.map((account) => {
              const isSelected = selectedDemoEmail === account.email;

              return (
                <Button
                  key={account.role}
                  type="button"
                  variant={isSelected ? "soft-info" : "outline"}
                  onClick={() => selectDemoAccount(account)}
                  className={cn(
                    "relative h-auto min-h-10 flex-col justify-center gap-1 rounded-lg px-1.5 py-1.5 text-center whitespace-normal sm:min-h-11 sm:flex-row sm:justify-start sm:px-2.5 sm:py-2 sm:text-left",
                    isSelected && "border-info/40 ring-2 ring-info/15",
                  )}
                  aria-pressed={isSelected}
                  aria-label={`Điền tài khoản ${account.label}`}
                >
                  <span
                    className={cn(
                      "grid size-6 shrink-0 place-items-center rounded-md sm:size-7",
                      isSelected
                        ? "bg-info text-info-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {createElement(account.icon, { className: "size-3.5" })}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[10px] font-bold leading-3.5 text-foreground sm:text-xs sm:leading-4">
                      {account.shortLabel}
                    </span>
                    <span className="mt-0.5 hidden truncate text-[10px] font-normal text-muted-foreground sm:block">
                      {account.email}
                    </span>
                  </span>
                  {isSelected && (
                    <span className="absolute top-1.5 right-1.5 grid size-4 place-items-center rounded-full bg-info text-info-foreground">
                      <Check className="size-2.5" />
                    </span>
                  )}
                </Button>
              );
            })}
          </div>
        </section>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">Địa chỉ email</Label>
          <div className="group relative">
            <Mail className="pointer-events-none absolute top-1/2 left-3.5 z-10 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="ban@kontum.gov.vn"
              aria-invalid={Boolean(errors.email)}
              className="h-11 rounded-xl pl-10.5"
              {...register("email", {
                onChange: () => setSelectedDemoEmail(""),
              })}
            />
          </div>
          {errors.email && (
            <p className="flex items-center gap-1.5 text-xs text-destructive">
              <AlertCircle className="size-3.5" />
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="password">Mật khẩu</Label>
            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Quên mật khẩu?
            </Link>
          </div>
          <PasswordField
            id="password"
            autoComplete="current-password"
            placeholder="Nhập mật khẩu"
            error={errors.password}
            className="h-11"
            {...register("password")}
          />
          {errors.password && (
            <p className="flex items-center gap-1.5 text-xs text-destructive">
              <AlertCircle className="size-3.5" />
              {errors.password.message}
            </p>
          )}
        </div>

        {serverError && (
          <div
            role="alert"
            className="flex gap-3 rounded-xl border border-destructive/20 bg-(--destructive-subtle) p-3 text-sm leading-5 text-(--destructive-subtle-foreground)"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <Button
          type="submit"
          variant="gradient-primary"
          size="lg"
          isLoading={isSubmitting}
          className="h-11 w-full rounded-xl"
        >
          Đăng nhập
          {!isSubmitting && <ArrowRight />}
        </Button>

        <div className="relative py-1">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/80" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-card px-3 text-xs text-muted-foreground">
              hoặc đăng nhập bằng
            </span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-11 w-full rounded-xl"
          onClick={() => window.location.assign(getGoogleLoginUrl())}
        >
          <span className="grid size-6 place-items-center rounded-full border bg-card text-xs font-bold text-foreground shadow-sm">
            G
          </span>
          Tài khoản Google
        </Button>

        <div className="hidden items-start gap-2 rounded-xl bg-muted/70 px-3 py-2.5 text-xs leading-5 text-muted-foreground sm:flex">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
          Hệ thống chỉ sử dụng thông tin đăng nhập để xác thực và bảo vệ phiên
          làm việc của bạn.
        </div>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Chưa có tài khoản?{" "}
        <Link to="/register" className="font-bold text-primary hover:underline">
          Đăng ký ngay
        </Link>
      </p>
    </AuthShell>
  );
}
