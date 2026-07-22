import { useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function PasswordField({
  id,
  autoComplete,
  error,
  className,
  ...props
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="group relative">
      <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
      <Input
        id={id}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        className={cn("h-12 rounded-xl pl-10.5 pr-12", className)}
        {...props}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg text-muted-foreground hover:text-foreground"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
      >
        {visible ? <EyeOff /> : <Eye />}
      </Button>
    </div>
  );
}
