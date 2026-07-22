import { createElement } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BellRing,
  ChevronLeft,
  CloudSun,
  Flame,
  Layers3,
  MapPinned,
  ShieldCheck,
  ShieldUser,
  Trees,
} from "lucide-react";
import { Button } from "../../components/ui/button";

const capabilities = [
  { icon: Trees, label: "Tài nguyên rừng", value: "11 lớp phủ" },
  { icon: Flame, label: "Cảnh báo cháy", value: "5 cấp độ" },
  { icon: CloudSun, label: "Thời tiết", value: "Theo thời gian" },
  { icon: BellRing, label: "Thông báo", value: "Trực tiếp" },
];

export default function AuthShell({
  eyebrow,
  title,
  description,
  children,
  compact = false,
}) {
  const navigate = useNavigate();

  return (
    <main className="relative h-dvh overflow-hidden bg-(image:--gradient-surface-page)">
      <div className="auth-topography pointer-events-none absolute inset-0" />
      <div
        className="auth-orb auth-orb-primary pointer-events-none absolute"
        aria-hidden="true"
      />
      <div
        className="auth-orb auth-orb-secondary pointer-events-none absolute"
        aria-hidden="true"
      />

      <div className="relative mx-auto grid h-dvh w-full max-w-[1440px] lg:grid-cols-[minmax(0,1.04fr)_minmax(420px,0.96fr)]">
        <section className="hidden h-dvh flex-col justify-between px-10 py-[clamp(1.25rem,3vh,3rem)] lg:flex xl:px-16">
          <Button
            type="button"
            variant="ghost-transparent"
            onClick={() => navigate("/")}
            className="group h-auto gap-2 px-1"
          >
            <ShieldUser className="size-8 text-(--brand-lime) transition-transform group-hover:scale-110" />
            <span className="text-xl font-bold text-foreground transition-colors group-hover:text-(--brand-lime)">
              WebGIS Kon Tum
            </span>
          </Button>

          <div className="max-w-2xl py-[clamp(1rem,3vh,2.5rem)]">
            <span className="mb-[clamp(1rem,2.4vh,1.5rem)] inline-flex items-center gap-2 rounded-full border border-primary/15 bg-card/70 px-3.5 py-2 text-sm font-semibold text-primary shadow-sm backdrop-blur-xl">
              <ShieldCheck className="size-4" />
              Dữ liệu tin cậy · Tra cứu thuận tiện
            </span>

            <h2 className="max-w-xl text-balance text-[clamp(2.5rem,4.2vw,3.75rem)] font-bold leading-[1.08] tracking-tight text-foreground">
              Một bản đồ,
              <span className="block bg-(image:--gradient-primary-secondary) bg-clip-text text-transparent">
                nhiều góc nhìn về Kon Tum.
              </span>
            </h2>
            <p className="mt-[clamp(1rem,2.4vh,1.5rem)] max-w-xl text-base leading-7 text-muted-foreground xl:text-lg xl:leading-8">
              Tiếp cận dữ liệu rừng, môi trường, ảnh vệ tinh, thời tiết và cảnh
              báo cháy trên cùng một không gian bản đồ trực quan.
            </p>

            <div className="mt-[clamp(1.25rem,3vh,2.25rem)] grid max-w-xl grid-cols-2 gap-3">
              {capabilities.map(({ icon, label, value }) => (
                <div
                  key={label}
                  className="group rounded-xl border border-border/70 bg-card/72 p-3.5 shadow-sm backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md motion-reduce:transform-none"
                >
                  <div className="flex items-start gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-(--primary-subtle) text-primary">
                      {createElement(icon, { className: "size-4.5" })}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs text-muted-foreground">
                        {label}
                      </span>
                      <span className="mt-0.5 block text-sm font-bold text-foreground">
                        {value}
                      </span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
            <span>© 2026 WebGIS/MobileGIS Kon Tum</span>
            <span className="inline-flex items-center gap-1.5">
              <Layers3 className="size-3.5" />
              Nền tảng GIS phục vụ cộng đồng
            </span>
          </div>
        </section>

        <section className="flex h-dvh items-center justify-center p-[clamp(0.75rem,2vh,2rem)] lg:border-l lg:border-white/50 lg:bg-card/45 lg:p-[clamp(1.25rem,3vh,2.5rem)] lg:backdrop-blur-sm">
          <div className={`w-full ${compact ? "max-w-md" : "max-w-lg"}`}>
            <div className="mb-[clamp(0.5rem,1.6vh,1.5rem)] flex items-center justify-between lg:hidden">
              <Link
                to="/map"
                className="inline-flex items-center gap-2.5 font-bold text-foreground"
              >
                <span className="grid size-9 place-items-center rounded-xl bg-(image:--gradient-primary) text-(--gradient-foreground)">
                  <MapPinned className="size-5" />
                </span>
                WebGIS Kon Tum
              </Link>
              <Link
                to="/map"
                className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground"
              >
                <ChevronLeft className="size-3.5" />
                Bản đồ
              </Link>
            </div>

            <div className="rounded-2xl border border-(--gradient-surface-soft-border) bg-card/92 p-[clamp(0.875rem,2.2vh,2rem)] [box-shadow:var(--gradient-surface-card-shadow)] backdrop-blur-2xl">
              <div className="mb-[clamp(0.75rem,2vh,1.75rem)]">
                <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                  {eyebrow}
                </p>
                <h1 className="text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {title}
                </h1>
                <p className="mt-2 hidden max-w-md text-sm leading-5 text-muted-foreground sm:block">
                  {description}
                </p>
              </div>
              {children}
            </div>

            <p className="mt-[clamp(0.35rem,1vh,1.25rem)] hidden text-center text-xs leading-5 text-muted-foreground sm:block">
              Thông tin của bạn được bảo vệ theo{" "}
              <Link to="/policy" className="font-semibold text-primary">
                chính sách quyền riêng tư
              </Link>
              .
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
