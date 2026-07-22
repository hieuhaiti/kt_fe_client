import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { ArrowLeft, Mail, MailCheck, Send } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPassword } from "@/services/authService";
import AuthShell from "@/pages/Auth/AuthShell";

export default function ForgotPassword() {
  const [sentTo, setSentTo] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { email: "" } });

  const onSubmit = async ({ email }) => {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const response = await forgotPassword(normalizedEmail);
      setSentTo(normalizedEmail);
      toast.success(response?.message || "Đã gửi hướng dẫn khôi phục.");
    } catch (error) {
      toast.error(
        error?.data?.message ||
          error?.message ||
          "Không thể gửi yêu cầu khôi phục.",
      );
    }
  };

  return (
    <AuthShell
      compact
      eyebrow="Khôi phục quyền truy cập"
      title="Quên mật khẩu?"
      description="Nhập email đã đăng ký. Chúng tôi sẽ gửi cho bạn một liên kết đặt lại mật khẩu an toàn."
    >
      {sentTo ? (
        <div className="text-center">
          <span className="mx-auto grid size-20 place-items-center rounded-3xl border border-success/15 bg-(--success-subtle) text-success">
            <MailCheck className="size-9" />
          </span>
          <h2 className="mt-5 text-lg font-bold text-foreground">
            Kiểm tra hộp thư của bạn
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Hướng dẫn khôi phục đã được gửi tới{" "}
            <strong className="font-semibold text-foreground">{sentTo}</strong>.
            Vui lòng kiểm tra cả thư mục spam.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-6 h-11 w-full rounded-xl"
            onClick={() => setSentTo("")}
          >
            Gửi tới email khác
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <div className="space-y-2">
            <Label htmlFor="email">Địa chỉ email</Label>
            <div className="group relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                className="h-12 rounded-xl pl-10.5"
                placeholder="ban@example.com"
                aria-invalid={Boolean(errors.email)}
                {...register("email", {
                  required: "Vui lòng nhập email.",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Email chưa hợp lệ.",
                  },
                })}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>
          <Button
            type="submit"
            variant="gradient-primary"
            size="lg"
            isLoading={isSubmitting}
            className="h-12 w-full rounded-xl"
          >
            <Send />
            Gửi liên kết khôi phục
          </Button>
        </form>
      )}

      <Button asChild variant="ghost" className="mt-4 w-full">
        <Link to="/login">
          <ArrowLeft />
          Quay lại đăng nhập
        </Link>
      </Button>
    </AuthShell>
  );
}
