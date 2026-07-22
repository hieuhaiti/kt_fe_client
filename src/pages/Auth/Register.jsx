import { createElement } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AlertCircle,
  ArrowRight,
  Check,
  Mail,
  Phone,
  UserRound,
} from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { register as registerAccount } from "@/services/authService";
import AuthShell from "@/pages/Auth/AuthShell";
import PasswordField from "@/pages/Auth/PasswordField";

const schema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Họ và tên cần ít nhất 2 ký tự.")
      .max(255, "Họ và tên quá dài."),
    email: z.string().trim().email("Vui lòng nhập đúng địa chỉ email."),
    phone: z
      .string()
      .trim()
      .regex(/^[0-9+\-\s()]{8,20}$/, "Số điện thoại chưa hợp lệ.")
      .or(z.literal("")),
    password: z
      .string()
      .min(8, "Mật khẩu cần ít nhất 8 ký tự.")
      .max(128, "Mật khẩu không được quá 128 ký tự."),
    confirmPassword: z.string().min(1, "Vui lòng nhập lại mật khẩu."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Mật khẩu xác nhận không khớp.",
  });

const fields = [
  {
    name: "fullName",
    label: "Họ và tên",
    placeholder: "Nguyễn Văn A",
    icon: UserRound,
    autoComplete: "name",
  },
  {
    name: "email",
    label: "Địa chỉ email",
    placeholder: "ban@example.com",
    icon: Mail,
    autoComplete: "email",
    type: "email",
  },
  {
    name: "phone",
    label: "Số điện thoại",
    placeholder: "0905 123 456",
    icon: Phone,
    autoComplete: "tel",
    type: "tel",
  },
];

export default function Register() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values) => {
    try {
      const response = await registerAccount({
        fullName: values.fullName.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
        phone: values.phone.trim() || undefined,
      });
      toast.success(
        response?.message ||
          "Đăng ký thành công. Vui lòng kiểm tra email để xác minh tài khoản.",
      );
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(
        error?.data?.message ||
          error?.message ||
          "Không thể đăng ký tài khoản.",
      );
    }
  };

  return (
    <AuthShell
      eyebrow="Tham gia WebGIS Kon Tum"
      title="Tạo tài khoản"
      description="Nhận cảnh báo theo vị trí, lưu thông tin cá nhân và sử dụng các tiện ích dành cho người dân."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map(
            ({ name, label, icon, type = "text", ...field }, index) => (
              <div
                key={name}
                className={`space-y-2 ${index === 1 ? "" : index === 0 ? "sm:col-span-2" : ""}`}
              >
                <Label htmlFor={name}>
                  {label}
                  {name === "phone" && (
                    <span className="font-normal text-muted-foreground">
                      (tùy chọn)
                    </span>
                  )}
                </Label>
                <div className="group relative">
                  {createElement(icon, {
                    className:
                      "pointer-events-none absolute left-3.5 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary",
                  })}
                  <Input
                    id={name}
                    type={type}
                    className="h-12 rounded-xl pl-10.5"
                    aria-invalid={Boolean(errors[name])}
                    {...field}
                    {...register(name)}
                  />
                </div>
                {errors[name] && (
                  <p className="flex items-center gap-1.5 text-xs text-destructive">
                    <AlertCircle className="size-3.5" />
                    {errors[name].message}
                  </p>
                )}
              </div>
            ),
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu</Label>
            <PasswordField
              id="password"
              autoComplete="new-password"
              placeholder="Tối thiểu 8 ký tự"
              error={errors.password}
              {...register("password")}
            />
            {errors.password && (
              <p className="flex items-center gap-1.5 text-xs text-destructive">
                <AlertCircle className="size-3.5" />
                {errors.password.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Nhập lại mật khẩu</Label>
            <PasswordField
              id="confirmPassword"
              autoComplete="new-password"
              placeholder="Xác nhận mật khẩu"
              error={errors.confirmPassword}
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="flex items-center gap-1.5 text-xs text-destructive">
                <AlertCircle className="size-3.5" />
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-1.5 rounded-xl bg-muted/65 p-3.5 text-xs text-muted-foreground sm:grid-cols-2">
          {["Ít nhất 8 ký tự", "Không chia sẻ mật khẩu"].map((item) => (
            <span key={item} className="flex items-center gap-2">
              <span className="grid size-4 place-items-center rounded-full bg-(--success-subtle) text-success">
                <Check className="size-2.5" />
              </span>
              {item}
            </span>
          ))}
        </div>

        <p className="text-xs leading-5 text-muted-foreground">
          Bằng việc đăng ký, bạn đồng ý với{" "}
          <Link to="/policy" className="font-semibold text-primary">
            chính sách quyền riêng tư
          </Link>{" "}
          của hệ thống.
        </p>

        <Button
          type="submit"
          variant="gradient-primary"
          size="lg"
          isLoading={isSubmitting}
          className="h-12 w-full rounded-xl"
        >
          Tạo tài khoản
          {!isSubmitting && <ArrowRight />}
        </Button>
      </form>

      <p className="mt-7 text-center text-sm text-muted-foreground">
        Đã có tài khoản?{" "}
        <Link to="/login" className="font-bold text-primary hover:underline">
          Đăng nhập
        </Link>
      </p>
    </AuthShell>
  );
}
