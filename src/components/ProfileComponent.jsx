import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  LogOut,
  User,
  Mail,
  MapPin,
  Calendar,
  Shield,
  RotateCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import useAuthStore from "@/stores/useAuthStore.jsx";
import { updateProfile, changePassword } from "@/services/authService";
import LoadingOverlay from "@/components/common/LoadingOverlay.jsx";
import { formatDateTime } from "@/lib/utils";

export default function Profile() {
  const navigate = useNavigate();
  const { logout, user, fetchProfile } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("info");
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || "",
    phone: user?.phone || "",
  });

  useEffect(() => {
    setFormData({
      full_name: user?.full_name || "",
      phone: user?.phone || "",
    });
  }, [user]);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logout();
      toast.success("Đăng xuất thành công!", {
        autoClose: 2000,
      });
      setTimeout(() => {
        navigate("/login");
      }, 500);
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Lỗi khi đăng xuất", {
        autoClose: 2000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await updateProfile({
        fullName: formData.full_name,
        phone: formData.phone,
      });
      toast.success("Cập nhật thông tin thành công", {
        autoClose: 2000,
      });
      setEditMode(false);
      await fetchProfile();
    } catch (error) {
      toast.error(error?.message || "Cập nhật thất bại", {
        autoClose: 2000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Mật khẩu mới không khớp", {
        autoClose: 2000,
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error("Mật khẩu phải ít nhất 6 ký tự", {
        autoClose: 2000,
      });
      return;
    }

    setIsLoading(true);

    try {
      await changePassword({
        oldPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success("Đổi mật khẩu thành công", {
        autoClose: 2000,
      });
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast.error(error?.message || "Đổi mật khẩu thất bại", {
        autoClose: 2000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-foreground mb-4">Bạn chưa đăng nhập</p>
          <Button
            variant="gradient-primary"
            onClick={() => navigate("/login")}
          >
            Đăng nhập
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {isLoading && <LoadingOverlay />}

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Hồ sơ người dùng
          </h1>
          <p className="text-muted-foreground">
            Quản lý thông tin tài khoản của bạn
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg shadow-md p-6 border border-border">
              {/* Avatar */}
              <div className="text-center mb-4">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-10 h-10 text-primary-foreground" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">
                  {user?.full_name || user?.username}
                </h2>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>

              {/* Role Badge */}
              <div className="mb-6 p-3 bg-primary/10 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground capitalize">
                    {user?.role?.name || "User"}
                  </span>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant={activeTab === "info" ? "soft-primary" : "outline"}
                  onClick={() => setActiveTab("info")}
                  className="h-auto w-full justify-start p-3"
                >
                  Thông tin cơ bản
                </Button>
                <Button
                  type="button"
                  variant={activeTab === "password" ? "soft-primary" : "outline"}
                  onClick={() => setActiveTab("password")}
                  className="h-auto w-full justify-start p-3"
                >
                  Đổi mật khẩu
                </Button>
                <Button
                  type="button"
                  variant="soft-destructive"
                  onClick={handleLogout}
                  className="h-auto w-full justify-start p-3"
                >
                  <LogOut className="w-4 h-4" />
                  Đăng xuất
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-lg shadow-md p-6 border border-border">
              {/* Tab Content */}
              {activeTab === "info" && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-foreground">
                      Thông tin cơ bản
                    </h3>
                    <Button
                      variant={
                        editMode ? "soft-destructive" : "soft-info"
                      }
                      onClick={() => setEditMode(!editMode)}
                      className="text-sm"
                    >
                      {editMode ? "Hủy" : "Chỉnh sửa"}
                    </Button>
                  </div>

                  {editMode ? (
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-foreground">
                          Họ và tên
                        </label>
                        <input
                          type="text"
                          value={formData.full_name}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              full_name: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 text-foreground">
                          Địa chỉ
                        </label>
                        <textarea
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              phone: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                          rows="3"
                        />
                      </div>

                      <Button
                        type="submit"
                        variant="gradient-primary"
                        className="w-full"
                      >
                        Lưu thay đổi
                      </Button>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-muted rounded-lg border border-border/50">
                        <div className="flex items-center gap-3 mb-2">
                          <User className="w-4 h-4 text-primary" />
                          <p className="text-sm text-muted-foreground">
                            Họ và tên
                          </p>
                        </div>
                        <p className="text-foreground font-medium ml-7">
                          {user?.full_name || "Chưa cập nhật"}
                        </p>
                      </div>

                      <div className="p-4 bg-muted rounded-lg border border-border/50">
                        <div className="flex items-center gap-3 mb-2">
                          <Mail className="w-4 h-4 text-primary" />
                          <p className="text-sm text-muted-foreground">Email</p>
                        </div>
                        <p className="text-foreground font-medium ml-7">
                          {user?.email}
                        </p>
                      </div>

                      <div className="p-4 bg-muted rounded-lg border border-border/50">
                        <div className="flex items-center gap-3 mb-2">
                          <User className="w-4 h-4 text-primary" />
                          <p className="text-sm text-muted-foreground">
                            Tên đăng nhập
                          </p>
                        </div>
                        <p className="text-foreground font-medium ml-7">
                          {user?.username}
                        </p>
                      </div>

                      {user?.phone && (
                        <div className="p-4 bg-muted rounded-lg border border-border/50">
                          <div className="flex items-center gap-3 mb-2">
                            <MapPin className="w-4 h-4 text-primary" />
                            <p className="text-sm text-muted-foreground">
                              Địa chỉ
                            </p>
                          </div>
                          <p className="text-foreground font-medium ml-7">
                            {user?.phone}
                          </p>
                        </div>
                      )}

                      <div className="p-4 bg-muted rounded-lg border border-border/50">
                        <div className="flex items-center gap-3 mb-2">
                          <Calendar className="w-4 h-4 text-primary" />
                          <p className="text-sm text-muted-foreground">
                            Ngày tạo tài khoản
                          </p>
                        </div>
                        <p className="text-foreground font-medium ml-7">
                          {new Date(user?.created_at).toLocaleDateString(
                            "vi-VN",
                          )}
                        </p>
                      </div>

                      <div className="p-4 bg-muted rounded-lg border border-border/50">
                        <div className="flex items-center gap-3 mb-2">
                          <RotateCw className="w-4 h-4 text-primary" />
                          <p className="text-sm text-muted-foreground">
                            Lần đăng nhập cuối
                          </p>
                        </div>
                        <p className="text-foreground font-medium ml-7">
                          {formatDateTime(user?.last_login)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "password" && (
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-6">
                    Đổi mật khẩu
                  </h3>

                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-foreground">
                        Mật khẩu hiện tại
                      </label>
                      <input
                        type="password"
                        autoComplete="current-password"
                        value={passwordForm.currentPassword}
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,
                            currentPassword: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-foreground">
                        Mật khẩu mới
                      </label>
                      <input
                        type="password"
                        autoComplete="new-password"
                        value={passwordForm.newPassword}
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,
                            newPassword: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-foreground">
                        Xác nhận mật khẩu mới
                      </label>
                      <input
                        type="password"
                        autoComplete="new-password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,
                            confirmPassword: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                        required
                      />
                    </div>

                    <div className="bg-info/10 border border-info/20 rounded-lg p-3">
                      <p className="text-sm text-info">
                        💡 Mật khẩu phải ít nhất 6 ký tự và chứa chữ hoa, chữ
                        thường, số.
                      </p>
                    </div>

                    <Button
                      type="submit"
                      variant="gradient-info"
                      className="w-full"
                    >
                      Đổi mật khẩu
                    </Button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
