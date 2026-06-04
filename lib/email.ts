import { Resend } from 'resend'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY || 'dummy_key_for_build')
}
const FROM_EMAIL = process.env.FROM_EMAIL || 'Bếp Cô Hạ <no-reply@hacofood.vn>'

export async function sendGiftEmail(to: { name: string; email: string }) {
  const driveLink = process.env.DRIVE_LINK_GIFT || '#'

  return getResend().emails.send({
    from: FROM_EMAIL,
    to: [to.email],
    subject: '🎁 Quà tặng từ HaCo Food – Công thức Cà Muối Mắm Giòn 7 Ngày!',
    html: `
<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f0fff0;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

    <!-- HEADER -->
    <div style="background:linear-gradient(135deg,#003200,#006400);padding:36px 32px;text-align:center;">
      <p style="font-size:40px;margin:0 0 8px;">🥒</p>
      <h1 style="color:#fff;margin:0;font-size:26px;font-weight:800;">HaCo Food – Bếp Cô Hạ</h1>
      <p style="color:#90EE90;margin:6px 0 0;font-size:14px;">khoaduacamuoi.hacofood.vn</p>
    </div>

    <!-- BODY -->
    <div style="padding:36px 32px;">
      <h2 style="color:#006400;font-size:22px;margin-top:0;">Xin chào ${to.name}! 👋</h2>
      <p style="color:#374151;line-height:1.8;font-size:15px;">
        Cảm ơn bạn đã quan tâm! Đây là phần quà Cô Hạ dành riêng cho bạn:
      </p>

      <!-- QUÀ TẶNG -->
      <div style="background:#f0fff0;border-left:4px solid #006400;border-radius:8px;padding:20px 24px;margin:20px 0;">
        <h3 style="color:#006400;margin-top:0;font-size:17px;">🎁 Quà của bạn</h3>
        <p style="margin:0 0 12px;color:#374151;font-size:14px;">
          <strong>📹 Công thức Cà Muối Mắm Giòn 7 Ngày</strong> – video & tài liệu chi tiết từ Cô Hạ
        </p>
        <a href="${driveLink}"
          style="display:inline-block;background:#006400;color:#fff;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">
          📥 Nhận công thức ngay
        </a>
      </div>

      <!-- CỘNG ĐỒNG -->
      <div style="margin:20px 0;">
        <h3 style="color:#006400;font-size:16px;margin-bottom:12px;">&#128101; Tham gia cộng đồng <strong>MIỄN PHÍ</strong> của Cô Hạ:</h3>
        <table style="width:100%;border-collapse:collapse;">
          ${[
            { tag: 'FB', tagColor: '#1877F2', name: 'Nấu ăn cùng Cô Hạ',         desc: 'Group tổng – chia sẻ kinh nghiệm nấu ăn',  href: 'https://www.facebook.com/groups/nauancungcoha' },
            { tag: 'FB', tagColor: '#1877F2', name: 'Công thức nấu ăn miễn phí',  desc: 'Hàng trăm công thức từ Cô Hạ',            href: 'https://www.facebook.com/groups/congthuccoha' },
            { tag: 'FB', tagColor: '#1877F2', name: 'Nấu ăn kinh doanh',          desc: 'Bí quyết kinh doanh ẩm thực F&B',         href: 'https://www.facebook.com/groups/nauankinhdoanh' },
            { tag: 'FB', tagColor: '#1877F2', name: 'Khởi nghiệp F&B',            desc: 'Cộng đồng khởi nghiệp ẩm thực',          href: 'https://www.facebook.com/groups/fnbcoha' },
            { tag: 'YT', tagColor: '#FF0000', name: 'YouTube Cô Hạ Dạy Nấu Ăn',  desc: 'Video hướng dẫn chi tiết, dễ làm theo',  href: 'https://www.youtube.com/@Cohadaynauan8386/featured' },
            { tag: 'TT', tagColor: '#010101', name: 'TikTok Cô Hạ',               desc: 'Clip ngắn, mẹo nấu ăn hay mỗi ngày',     href: 'https://www.tiktok.com/@hacasau' },
          ].map(l => `
          <tr>
            <td style="padding:5px 0;">
              <a href="${l.href}" style="display:table;width:100%;background:#f8fffe;border:1px solid #d1fae5;border-radius:10px;padding:0;text-decoration:none;box-sizing:border-box;">
                <table style="width:100%;border-collapse:collapse;">
                  <tr>
                    <td style="width:44px;padding:12px 0 12px 14px;vertical-align:middle;">
                      <span style="display:inline-block;background:${l.tagColor};color:#fff;font-size:10px;font-weight:800;padding:3px 6px;border-radius:4px;letter-spacing:0.5px;">${l.tag}</span>
                    </td>
                    <td style="padding:12px 14px 12px 8px;vertical-align:middle;">
                      <strong style="display:block;color:#111827;font-size:13px;margin-bottom:2px;">${l.name}</strong>
                      <span style="color:#6b7280;font-size:12px;">${l.desc}</span>
                    </td>
                    <td style="padding:12px 14px 12px 0;vertical-align:middle;white-space:nowrap;">
                      <span style="background:#dcfce7;color:#166534;font-size:10px;font-weight:700;padding:3px 8px;border-radius:20px;">MIỄN PHÍ</span>
                    </td>
                  </tr>
                </table>
              </a>
            </td>
          </tr>`).join('')}
        </table>
      </div>

      <!-- UPSELL -->
      <div style="background:#fff8f0;border:2px solid #006400;border-radius:10px;padding:20px 24px;margin:20px 0;text-align:center;">
        <p style="color:#374151;margin:0 0 8px;font-size:14px;">💡 <strong>Muốn học chuyên sâu hơn?</strong></p>
        <p style="color:#374151;margin:0 0 12px;font-size:14px;">
          Khóa học <strong>Dưa Cà Muối Chuyên Sâu</strong> – chỉ
          <strong style="color:#dc2626;font-size:19px;">138.000đ</strong>
          <del style="color:#9ca3af;font-size:13px;">(gốc 999.000đ)</del>
        </p>
        <a href="https://khoaduacamuoi.hacofood.vn#khoa-hoc"
          style="display:inline-block;background:#dc2626;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">
          🎓 Xem khóa học ngay
        </a>
      </div>

      <p style="color:#6b7280;font-size:13px;line-height:1.7;margin-top:20px;">
        Có câu hỏi gì cứ nhắn vào group nhé! Cô Hạ luôn hỗ trợ bạn. 🌸
      </p>
    </div>

    <!-- FOOTER -->
    <div style="background:#f9fafb;padding:18px 32px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">
        © 2025 HaCo Food – Bếp Cô Hạ &nbsp;|&nbsp; <a href="https://khoaduacamuoi.hacofood.vn" style="color:#006400;">khoaduacamuoi.hacofood.vn</a><br>
        Bạn nhận email này vì đã đăng ký nhận quà tại website của chúng tôi.
      </p>
    </div>
  </div>
</body>
</html>
    `,
  })
}

export async function sendCourseConfirmEmail(to: { name: string; email: string }) {
  const courseGroupLink = process.env.COURSE_GROUP_LINK || '#'

  return getResend().emails.send({
    from: FROM_EMAIL,
    to: [to.email],
    subject: '✅ Đăng ký thành công – Khóa học Dưa Cà Muối Chuyên Sâu!',
    html: `
<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#fef9f0;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#16a34a,#166534);padding:40px 32px;text-align:center;">
      <div style="font-size:48px;margin-bottom:8px;">✅</div>
      <h1 style="color:#fff;margin:0;font-size:26px;font-weight:800;">Thanh toán thành công!</h1>
      <p style="color:#bbf7d0;margin:8px 0 0;font-size:16px;">Chào mừng bạn đến với Khóa học Dưa Cà Muối Chuyên Sâu</p>
    </div>
    <div style="padding:40px 32px;">
      <h2 style="color:#166534;font-size:22px;margin-top:0;">Xin chào ${to.name}! 🎉</h2>
      <p style="color:#4b5563;line-height:1.8;font-size:16px;">
        Cô Hạ rất vui khi bạn đã tham gia khóa học! Dưới đây là thông tin bước tiếp theo:
      </p>

      <div style="background:#f0fdf4;border:2px solid #16a34a;border-radius:12px;padding:24px;margin:24px 0;">
        <h3 style="color:#166534;margin-top:0;font-size:18px;">📚 Bước tiếp theo của bạn</h3>
        <ol style="color:#4b5563;line-height:2;padding-left:20px;margin:0;">
          <li>Nhấn vào nút bên dưới để <strong>tham gia Group học viên</strong></li>
          <li>Trong group sẽ có đầy đủ video bài giảng và tài liệu</li>
          <li>Cô Hạ và team sẽ hỗ trợ bạn trong suốt quá trình học</li>
        </ol>
        <a href="${courseGroupLink}" style="display:inline-block;background:#16a34a;color:#fff;padding:16px 32px;border-radius:10px;text-decoration:none;font-weight:800;font-size:18px;margin-top:16px;width:100%;text-align:center;box-sizing:border-box;">
          👥 Vào Group Học Viên Ngay
        </a>
      </div>

      <div style="background:#fef3c7;border-radius:8px;padding:20px 24px;margin:24px 0;">
        <h3 style="color:#92400e;margin-top:0;font-size:16px;">📋 Thông tin đơn hàng</h3>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="color:#6b7280;padding:6px 0;">Khóa học:</td>
            <td style="color:#1f2937;font-weight:600;text-align:right;">Dưa Cà Muối Chuyên Sâu</td>
          </tr>
          <tr>
            <td style="color:#6b7280;padding:6px 0;">Hình thức:</td>
            <td style="color:#1f2937;text-align:right;">Online – Group Facebook</td>
          </tr>
          <tr>
            <td style="color:#6b7280;padding:6px 0;">Giá trị:</td>
            <td style="color:#dc2626;font-weight:800;text-align:right;font-size:18px;">138.000đ</td>
          </tr>
        </table>
      </div>

      <p style="color:#6b7280;font-size:14px;line-height:1.7;">
        Nếu có bất kỳ câu hỏi nào, hãy nhắn tin trong group học viên hoặc liên hệ Cô Hạ nhé! 🌸
      </p>
    </div>
    <div style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="color:#9ca3af;font-size:13px;margin:0;">
        © 2024 Bếp Cô Hạ – Hacofood.vn
      </p>
    </div>
  </div>
</body>
</html>
    `,
  })
}
