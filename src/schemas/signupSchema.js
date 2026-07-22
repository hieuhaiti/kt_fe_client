import { z } from "zod";

// Đồng bộ với server: registerSchema trong auth.validation.js
// password pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
export const signupFormSchema = z
  .object({
    username: z
      .string()
      .min(3, "Tên đăng nhập phải có ít nhất 3 ký tự")
      .max(50, "Tên đăng nhập không được quá 50 ký tự")
      .regex(
        /^[a-zA-Z0-9]+$/,
        "Tên đăng nhập chỉ được chứa chữ cái và số (không có ký tự đặc biệt)",
      ),
    email: z
      .string()
      .email("Email không hợp lệ")
      .max(100, "Email không được quá 100 ký tự"),
    password: z
      .string()
      .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
      .max(128, "Mật khẩu không được quá 128 ký tự")
      .regex(/[A-Z]/, "Mật khẩu phải chứa ít nhất 1 chữ hoa")
      .regex(/[a-z]/, "Mật khẩu phải chứa ít nhất 1 chữ thường")
      .regex(/[0-9]/, "Mật khẩu phải chứa ít nhất 1 chữ số")
      .regex(
        /[@$!%*?&]/,
        "Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt (@$!%*?&)",
      ),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });
