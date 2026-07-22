import { useEffect } from "react";

export default function Policy() {
  useEffect(() => {
    window.scrollTo(0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <h1 className="text-4xl font-bold text-gray-900">
            Chính Sách Quyền Riêng Tư
          </h1>
          <p className="text-lg text-gray-600 mt-2">Cổng WebGIS tỉnh Kon Tum</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <main className="bg-white rounded-lg shadow-lg p-8 space-y-8">
          {/* 1. Giới thiệu */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-500">
              1. Giới thiệu
            </h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                Chào mừng bạn đến với <strong>Cổng WebGIS tỉnh Kon Tum</strong>.
              </p>
              <p>
                Chúng tôi tôn trọng quyền riêng tư của người dùng và cam kết bảo
                vệ thông tin cá nhân của bạn.
              </p>
              <p>
                Chính sách này giải thích cách chúng tôi thu thập, sử dụng và
                bảo vệ thông tin khi bạn sử dụng ứng dụng.
              </p>
            </div>
          </section>

          {/* 2. Thông tin chúng tôi thu thập */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-500">
              2. Thông tin chúng tôi thu thập
            </h2>

            <div className="space-y-6">
              {/* 2.1 */}
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  2.1 Thông tin cá nhân
                </h3>
                <p className="text-gray-700 mb-3">
                  Chúng tôi có thể thu thập các thông tin sau khi người dùng
                  đăng nhập hoặc cung cấp tự nguyện:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-2">
                  <li>Tên</li>
                  <li>Số điện thoại</li>
                  <li>Email</li>
                </ul>
              </div>

              {/* 2.2 */}
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  2.2 Thông tin không cá nhân
                </h3>
                <p className="text-gray-700">
                  Chúng tôi không thu thập bất kỳ thông tin không cá nhân nào từ
                  người dùng.
                </p>
              </div>
            </div>
          </section>

          {/* 3. Mục đích sử dụng thông tin */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-500">
              3. Mục đích sử dụng thông tin
            </h2>
            <div className="text-gray-700 leading-relaxed space-y-4">
              <p>Chúng tôi có thể sử dụng thông tin người dùng cung cấp để:</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>
                  Liên hệ trong trường hợp cần xác minh các vấn đề, phản ánh
                  hoặc nội dung do người dùng đăng tải
                </li>
                <li>Hỗ trợ xử lý sự việc</li>
                <li>Đảm bảo tính chính xác của thông tin</li>
                <li>Nâng cao chất lượng vận hành của ứng dụng</li>
              </ul>
            </div>
          </section>

          {/* 4. Chia sẻ thông tin */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-500">
              4. Chia sẻ thông tin
            </h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                <strong>
                  Chúng tôi không bán, trao đổi hoặc chia sẻ thông tin cá nhân
                  của người dùng cho bên thứ ba.
                </strong>
              </p>
              <p>
                Chúng tôi chỉ có thể cung cấp thông tin khi có yêu cầu từ cơ
                quan pháp luật.
              </p>
            </div>
          </section>

          {/* 5. Bảo mật dữ liệu */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-500">
              5. Bảo mật dữ liệu
            </h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                Chúng tôi áp dụng các biện pháp bảo mật hợp lý để bảo vệ thông
                tin của bạn.
              </p>
              <p className="italic text-gray-600">
                Tuy nhiên, không có phương thức truyền tải nào trên Internet là
                an toàn tuyệt đối.
              </p>
            </div>
          </section>

          {/* 6. Dịch vụ bên thứ ba */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-500">
              6. Dịch vụ bên thứ ba
            </h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>Ứng dụng có thể sử dụng các dịch vụ bên thứ ba như:</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Mapbox</li>
              </ul>
              <p>
                Các dịch vụ này có thể thu thập dữ liệu theo chính sách riêng
                của họ.
              </p>
            </div>
          </section>

          {/* 7. Quyền riêng tư của trẻ em */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-500">
              7. Quyền riêng tư của trẻ em
            </h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>Ứng dụng không dành cho trẻ em dưới 13 tuổi.</p>
              <p>Chúng tôi không cố ý thu thập thông tin từ trẻ em.</p>
            </div>
          </section>

          {/* 8. Thay đổi chính sách */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-500">
              8. Thay đổi chính sách
            </h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>Chúng tôi có thể cập nhật chính sách này theo thời gian.</p>
              <p>Mọi thay đổi sẽ được đăng tại trang này.</p>
            </div>
          </section>

          {/* 9. Liên hệ */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-500">
              9. Liên hệ
            </h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <p className="text-gray-700 mb-3">
                Nếu bạn có câu hỏi, vui lòng liên hệ:
              </p>
              <div className="flex items-center text-gray-800">
                <span className="text-2xl mr-3">📧</span>
                <div>
                  <p className="font-semibold">Email:</p>
                  <a
                    href="mailto:dinhbaongoc1612@gmail.com"
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    dinhbaongoc1612@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* Last Updated */}
          <div className="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
            <p>Cập nhật lần cuối: {new Date().toLocaleDateString("vi-VN")}</p>
          </div>
        </main>
      </div>
    </div>
  );
}
