import { lazy, Suspense, useEffect } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ToastContainer } from "react-toastify";
import { toast } from "react-toastify";
import LoadingOverlay from "@/components/common/LoadingOverlay.jsx";
import useAuthStore from "@/stores/useAuthStore.jsx";
import { onSessionExpired } from "@/lib/sessionEvents";

const Map = lazy(() => import("@/pages/Map"));
const News = lazy(() => import("@/pages/News/NewsPage"));
const NewsDetailPage = lazy(() => import("@/pages/News/NewsDetailPage"));
const DocumentsPage = lazy(() => import("@/pages/Documents/DocumentsPage"));
const DocumentDetailPage = lazy(
  () => import("@/pages/Documents/DocumentDetailPage"),
);
const PdfMapsPage = lazy(() => import("@/pages/PdfMaps/PdfMapsPage"));
const PdfMapDetailPage = lazy(
  () => import("@/pages/PdfMaps/PdfMapDetailPage"),
);
const MyFeedbackPage = lazy(() => import("@/pages/Feedback/MyFeedbackPage"));
const Profile = lazy(() => import("@/pages/Profile"));
const Policy = lazy(() => import("@/pages/Policy"));
const Login = lazy(() => import("@/pages/Auth/Login"));
const Register = lazy(() => import("@/pages/Auth/Register"));
const Logout = lazy(() => import("@/pages/Auth/Logout"));
const AuthCallback = lazy(() => import("@/pages/Auth/AuthCallback"));
const ForgotPassword = lazy(() => import("@/pages/Auth/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/Auth/ResetPassword"));
const VerifyEmail = lazy(() => import("@/pages/Auth/VerifyEmail"));

import BadRequestPage from "@/pages/Errors/400BadRequestPage";
import UnauthorizedPage from "@/pages/Errors/401UnauthorizedPage";
import ForbiddenPage from "@/pages/Errors/403ForbiddenPage";
import NotFoundPage from "@/pages/Errors/404NotFoundPage";
import InternalServerErrorPage from "@/pages/Errors/500InternalServerErrorPage";
import ServiceUnavailablePage from "@/pages/Errors/503ServiceUnavailablePage";

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const fetchProfile = useAuthStore((state) => state.fetchProfile);
  const expireSession = useAuthStore((state) => state.expireSession);

  useEffect(() => {
    if (isAuthenticated && !user) fetchProfile();
  }, [fetchProfile, isAuthenticated, user]);

  useEffect(
    () =>
      onSessionExpired(() => {
        expireSession();
        queryClient.clear();
        toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", {
          toastId: "session-expired",
        });

        const privatePaths = ["/profile", "/feedback/mine"];
        if (privatePaths.some((path) => location.pathname.startsWith(path))) {
          navigate("/login", { replace: true });
        }
      }),
    [expireSession, location.pathname, navigate, queryClient],
  );

  return (
    <>
      <Suspense key={location.pathname} fallback={<LoadingOverlay />}>
        <Routes location={location}>
          <Route path="/" element={<Map />} />
          <Route path="/map" element={<Map />} />
          <Route path="/news" element={<News />} />
          <Route path="/news/:slugOrId" element={<NewsDetailPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/documents/:id" element={<DocumentDetailPage />} />
          <Route path="/pdf-maps" element={<PdfMapsPage />} />
          <Route path="/pdf-maps/:id" element={<PdfMapDetailPage />} />
          <Route path="/feedback/mine" element={<MyFeedbackPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/policy" element={<Policy />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/signup" element={<Register />} />
          <Route path="/logout" element={<Logout />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          <Route path="/400" element={<BadRequestPage />} />
          <Route path="/401" element={<UnauthorizedPage />} />
          <Route path="/403" element={<ForbiddenPage />} />
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="/500" element={<InternalServerErrorPage />} />
          <Route path="/503" element={<ServiceUnavailablePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      <ToastContainer
        position="top-right"
        className="z-999"
        autoClose={3500}
        closeOnClick
        pauseOnHover
        draggable
      />
    </>
  );
}
