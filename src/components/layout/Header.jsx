import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  Book,
  ChevronDown,
  LogIn,
  LogOut,
  MessageSquare,
  Shield,
  ShieldUser,
  Smartphone,
  User,
} from "lucide-react";
import { toast } from "react-toastify";
import NotificationMenu from "@/components/common/NotificationMenu";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { praseLink } from "@/lib/utils";
import { useMapStore } from "@/stores/Map/useMapStore";
import useAuthStore from "@/stores/useAuthStore.jsx";

const categories = [
  {
    id: 1,
    name: "Bản đồ",
    shortname: "Bản đồ",
    fullname: "Bản đồ",
    slug: ["map", ""],
  },
  {
    id: 2,
    name: "Tin tức",
    shortname: "Tin tức",
    fullname: "Tin tức",
    slug: "news",
  },
  {
    id: 3,
    name: "Văn bản",
    shortname: "Văn bản",
    fullname: "Báo cáo và văn bản",
    slug: "documents",
  },
  {
    id: 4,
    name: "Bản đồ PDF",
    shortname: "Bản đồ PDF",
    fullname: "Bản đồ PDF",
    slug: "pdf-maps",
  },
];

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const isLaptopL = useMediaQuery("(min-width: 1440px)");
  const isLargeDesktop = useMediaQuery(
    "(min-width: 1025px) and (max-width: 1208px)",
  );
  const setCategory = useMapStore((state) => state.setCategory);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);

  const activeItem = useMemo(() => {
    const [firstSegment = ""] = location.pathname.replace(/^\//, "").split("/");
    return firstSegment;
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Đăng xuất thành công!");
      navigate("/login");
      setIsUserMenuOpen(false);
    } catch {
      toast.error("Không thể đăng xuất. Vui lòng thử lại.");
    }
  };

  const openExternalLink = (path) => {
    const url = praseLink(path);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  const navigateCategory = (category) => {
    const slugs = Array.isArray(category.slug) ? category.slug : [category.slug];
    const navigateSlug = slugs[0] || "";
    navigate(`/${navigateSlug}`);
    setCategory(category.id);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Button
            type="button"
            variant="ghost-transparent"
            onClick={() => navigate("/")}
            className="group h-auto gap-2 px-1"
          >
            <ShieldUser className="size-8 text-(--brand-lime) transition-transform group-hover:scale-110" />
            {!isLargeDesktop && (
              <span className="text-xl font-bold text-foreground transition-colors group-hover:text-(--brand-lime)">
                WebGIS Kon Tum
              </span>
            )}
          </Button>

          <nav
            className="hidden flex-1 justify-center gap-2 lg:flex"
            aria-label="Điều hướng chính"
          >
            {categories.map((category) => {
              const slugs = Array.isArray(category.slug)
                ? category.slug
                : [category.slug];
              const isActive = slugs.includes(activeItem);

              return (
                <Tooltip key={category.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isActive ? "gradient-primary" : "ghost"}
                      className="h-auto w-auto px-3 py-2 whitespace-nowrap"
                      onClick={() => navigateCategory(category)}
                    >
                      {isLaptopL ? category.name : category.shortname}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{category.fullname}</TooltipContent>
                </Tooltip>
              );
            })}
          </nav>

          <div className="relative flex flex-1 justify-center lg:hidden">
            <Button
              type="button"
              onClick={() => setIsOpen((value) => !value)}
              aria-expanded={isOpen}
              aria-label="Mở menu điều hướng"
            >
              Menu
              <ChevronDown
                className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </Button>

            {isOpen && (
              <div className="absolute top-full z-20 mt-2 min-w-44 rounded-lg border border-border bg-background p-1 shadow-lg">
                <ul className="grid gap-1">
                  {categories.map((category) => {
                    const slugs = Array.isArray(category.slug)
                      ? category.slug
                      : [category.slug];
                    const isActive = slugs.includes(activeItem);

                    return (
                      <li key={category.id}>
                        <Button
                          variant={isActive ? "gradient-primary" : "ghost"}
                          className="h-auto w-full justify-center p-2"
                          onClick={() => {
                            navigateCategory(category);
                            setIsOpen(false);
                          }}
                        >
                          {category.shortname}
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          <div className="relative ml-auto flex items-center gap-2">
            {isAuthenticated ? (
              loading ? (
                <div className="flex items-center gap-2">
                  <span className="hidden h-4 w-24 animate-pulse rounded bg-muted sm:block" />
                  <span className="size-10 animate-pulse rounded-full bg-muted" />
                </div>
              ) : user ? (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="hidden max-w-40 truncate text-sm font-medium text-foreground sm:block">
                        {user.full_name || user.email}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>{user.email}</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant={isUserMenuOpen ? "soft-primary" : "outline"}
                        size="icon-lg"
                        onClick={() => setIsUserMenuOpen((value) => !value)}
                        className="rounded-full"
                        aria-expanded={isUserMenuOpen}
                        aria-label="Mở menu người dùng"
                      >
                        <User />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Menu người dùng</TooltipContent>
                  </Tooltip>

                  <NotificationMenu enabled />

                  {isUserMenuOpen && (
                    <div className="absolute top-12 right-0 z-50 w-60 overflow-hidden rounded-lg border border-border bg-background shadow-lg">
                      <div className="border-b border-border bg-primary/10 p-4">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {user.full_name || user.email}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {user.email}
                        </p>
                        <span className="mt-2 inline-block rounded bg-primary px-2 py-1 text-xs text-primary-foreground">
                          {user?.role?.name || "Người dùng"}
                        </span>
                      </div>

                      <ul className="grid gap-1 p-1">
                        <li>
                          <Button
                            variant="ghost"
                            className="h-auto w-full justify-start px-4 py-2"
                            onClick={() => {
                              navigate("/profile");
                              setIsUserMenuOpen(false);
                            }}
                          >
                            <User />
                            Hồ sơ
                          </Button>
                        </li>
                        <li>
                          <Button
                            variant="ghost"
                            className="h-auto w-full justify-start px-4 py-2"
                            onClick={() => {
                              navigate("/feedback/mine");
                              setIsUserMenuOpen(false);
                            }}
                          >
                            <MessageSquare />
                            Phản ánh của tôi
                          </Button>
                        </li>
                        <li className="my-1 border-t border-border" />
                        <li>
                          <Button
                            variant="ghost"
                            className="h-auto w-full justify-start px-4 py-2"
                            onClick={() =>
                              openExternalLink("/uploads/KT_HDSD_Client.pdf")
                            }
                          >
                            <Book />
                            Hướng dẫn sử dụng
                          </Button>
                        </li>
                        <li>
                          <Button
                            variant="soft-info"
                            className="h-auto w-full justify-start px-4 py-2"
                            onClick={() =>
                              openExternalLink("/uploads/apk/gis-kon-tum.apk")
                            }
                          >
                            <Smartphone />
                            Tải ứng dụng
                          </Button>
                        </li>
                        <li>
                          <Button
                            variant="ghost"
                            className="h-auto w-full justify-start px-4 py-2"
                            onClick={() => {
                              navigate("/policy");
                              setIsUserMenuOpen(false);
                            }}
                          >
                            <Shield />
                            Chính sách riêng tư
                          </Button>
                        </li>
                        <li className="my-1 border-t border-border" />
                        <li>
                          <Button
                            variant="soft-destructive"
                            className="h-auto w-full justify-start px-4 py-2"
                            onClick={handleLogout}
                          >
                            <LogOut />
                            Đăng xuất
                          </Button>
                        </li>
                      </ul>
                    </div>
                  )}
                </>
              ) : null
            ) : (
              <>
                <div className="hidden items-center gap-2 sm:flex">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        className="rounded-full"
                        onClick={() =>
                          openExternalLink("/uploads/KT_HDSD_Client.pdf")
                        }
                        aria-label="Hướng dẫn sử dụng"
                      >
                        <Book />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Hướng dẫn sử dụng</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="soft-info"
                        size="icon-sm"
                        className="rounded-full"
                        onClick={() =>
                          openExternalLink("/uploads/apk/gis-kon-tum.apk")
                        }
                        aria-label="Tải ứng dụng"
                      >
                        <Smartphone />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Tải ứng dụng</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        className="rounded-full"
                        onClick={() => navigate("/policy")}
                        aria-label="Chính sách quyền riêng tư"
                      >
                        <Shield />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Chính sách quyền riêng tư</TooltipContent>
                  </Tooltip>
                </div>
                <Button
                  variant="gradient-primary"
                  size="sm"
                  onClick={() => navigate("/login")}
                >
                  <LogIn />
                  Đăng nhập
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
