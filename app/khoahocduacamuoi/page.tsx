'use client'

import { useState, useEffect, useRef } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface FormData { name: string; email: string; phone: string }
interface QRData {
  qrUrl: string; bankAccount: string; bankCode: string
  accountName: string; amount: number; content: string; paymentRef: string
}
type Step = 'idle' | 'loading' | 'success' | 'error'

function formatPrice(n: number) { return n.toLocaleString('vi-VN') + 'đ' }

// ─── Brand colors ─────────────────────────────────────────────────────────────
// Dark forest green: #1B4332  /  Mid: #2D6A4F  /  Light: #52B788
const C = {
  hero: 'from-[#0D2B1A] via-[#1B4332] to-[#0D2B1A]',
  btn:  'from-[#1B4332] to-[#2D6A4F] hover:from-[#2D6A4F] hover:to-[#1B4332]',
  badge: 'bg-[#52B788] text-[#0D2B1A]',
}

// ─── Countdown ────────────────────────────────────────────────────────────────
function useCountdown(hours = 24) {
  const [time, setTime] = useState({ h: hours, m: 0, s: 0 })
  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('haco_cd') : null
    let end = stored ? parseInt(stored) : Date.now() + hours * 3600000
    if (!stored) localStorage.setItem('haco_cd', String(end))
    const tick = () => {
      const d = Math.max(0, end - Date.now())
      setTime({ h: Math.floor(d / 3600000), m: Math.floor((d % 3600000) / 60000), s: Math.floor((d % 60000) / 1000) })
    }
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [hours])
  return time
}

// ─── YouTube Short embed ──────────────────────────────────────────────────────
function YTShort({ id, title }: { id: string; title: string }) {
  return (
    <div className="relative w-full max-w-[280px] mx-auto" style={{ aspectRatio: '9/16' }}>
      {/* Phone frame */}
      <div className="absolute inset-0 rounded-[2rem] border-[6px] border-gray-800 shadow-2xl overflow-hidden bg-black z-10 pointer-events-none" />
      <iframe
        src={`https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`}
        title={title}
        className="absolute inset-0 w-full h-full rounded-[1.6rem]"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}

// ─── Lead Form ────────────────────────────────────────────────────────────────
function LeadForm({ ctaText, ctaColor, onSuccess }: {
  ctaText: string
  ctaColor: 'green' | 'red'
  onSuccess: (data: FormData & Record<string, unknown>) => void
}) {
  const [form, setForm] = useState<FormData>({ name: '', email: '', phone: '' })
  const [step, setStep] = useState<Step>('idle')
  const [error, setError] = useState('')
  const endpoint = ctaColor === 'red' ? '/api/course-form' : '/api/gift-form'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) { setError('Vui lòng điền đầy đủ 3 thông tin'); return }
    setStep('loading')
    try {
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Lỗi')
      setStep('success'); onSuccess({ ...form, ...data })
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Có lỗi xảy ra'); setStep('error') }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {(['name', 'email', 'phone'] as const).map(f => (
        <input key={f} name={f}
          type={f === 'email' ? 'email' : f === 'phone' ? 'tel' : 'text'}
          placeholder={f === 'name' ? '👤 Họ và tên *' : f === 'email' ? '📧 Email *' : '📞 Số điện thoại *'}
          value={form[f]}
          onChange={e => { setForm(v => ({ ...v, [e.target.name]: e.target.value })); setError('') }}
          required
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 text-base focus:border-[#2D6A4F] focus:outline-none transition-colors placeholder-gray-400 bg-white"
        />
      ))}
      {error && <p className="text-red-500 text-sm text-center bg-red-50 rounded-lg py-2 px-3">{error}</p>}
      <button type="submit" disabled={step === 'loading'}
        className={`w-full py-4 rounded-xl font-bold text-white text-lg transition-all active:scale-95 disabled:opacity-60 shadow-lg ${
          ctaColor === 'red'
            ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-red-200'
            : `bg-gradient-to-r ${C.btn} shadow-green-200`
        }`}>
        {step === 'loading'
          ? <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>Đang xử lý...
            </span>
          : ctaText}
      </button>
      <p className="text-xs text-gray-400 text-center">🔒 Thông tin được bảo mật tuyệt đối</p>
    </form>
  )
}

// ─── Payment Modal ────────────────────────────────────────────────────────────
function PaymentModal({ qr, onClose, onPaid }: { qr: QRData; onClose: () => void; onPaid: () => void }) {
  const [checking, setChecking] = useState(false)
  const [timeLeft, setTimeLeft] = useState(900)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => { const t = setInterval(() => setTimeLeft(v => Math.max(0, v - 1)), 1000); return () => clearInterval(t) }, [])
  useEffect(() => {
    pollRef.current = setInterval(async () => {
      try { const r = await fetch(`/api/check-payment?ref=${qr.paymentRef}`); if (r.ok && (await r.json()).paid) { clearInterval(pollRef.current!); onPaid() } } catch { /* silent */ }
    }, 5000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [qr.paymentRef, onPaid])

  const mm = Math.floor(timeLeft / 60).toString().padStart(2, '0')
  const ss = (timeLeft % 60).toString().padStart(2, '0')

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] px-6 py-4 flex items-center justify-between">
          <div><h3 className="text-white font-bold text-lg">Thanh toán chuyển khoản</h3>
            <p className="text-green-200 text-sm">Quét mã QR hoặc chuyển khoản thủ công</p></div>
          <button onClick={onClose} className="text-white/80 hover:text-white text-2xl">&times;</button>
        </div>
        <div className="p-5">
          <div className="text-center mb-4">
            <span className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-1.5 text-sm">
              <span className="text-amber-600">⏱ Hết hạn sau:</span>
              <span className="font-mono font-bold text-amber-700 text-lg">{mm}:{ss}</span>
            </span>
          </div>
          <div className="flex justify-center mb-4">
            <div className="p-2 rounded-xl border-2 border-gray-100 shadow-md bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr.qrUrl} alt="QR" className="w-44 h-44 object-contain"
                onError={e => { e.currentTarget.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`STK:${qr.bankAccount} NH:${qr.bankCode} ${formatPrice(qr.amount)} ND:${qr.content}`)}` }} />
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
            {[['Ngân hàng', qr.bankCode, false], ['Số tài khoản', qr.bankAccount, true], ['Chủ TK', qr.accountName.toUpperCase(), false], ['Số tiền', formatPrice(qr.amount), false]].map(([l, v, copy]) => (
              <div key={String(l)} className="flex justify-between">
                <span className="text-gray-500">{l}</span>
                {copy ? <button className="font-mono font-bold text-blue-600" onClick={() => navigator.clipboard?.writeText(String(v))}>{v} 📋</button>
                  : <span className="font-semibold text-gray-800">{v}</span>}
              </div>
            ))}
            <div className="flex justify-between items-center border-t pt-2">
              <span className="text-gray-500">Nội dung CK</span>
              <button className="font-mono font-bold text-red-600" onClick={() => navigator.clipboard?.writeText(qr.content)}>{qr.content} 📋</button>
            </div>
          </div>
          <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-800 text-center">
            ⚠️ <strong>Nhập đúng nội dung CK</strong> để hệ thống tự xác nhận
          </div>
          <button onClick={() => { setChecking(true); setTimeout(onPaid, 1000) }} disabled={checking}
            className="mt-4 w-full bg-[#1B4332] hover:bg-[#2D6A4F] text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-60">
            {checking ? 'Đang kiểm tra...' : '✅ Tôi đã chuyển khoản xong'}
          </button>
          <p className="text-xs text-gray-400 text-center mt-2">Hệ thống tự xác nhận và gửi thông tin qua email trong vài phút</p>
        </div>
      </div>
    </div>
  )
}

// ─── Success Screen ───────────────────────────────────────────────────────────
function SuccessScreen({ type, name, onClose }: { type: 'gift' | 'course'; name: string; onClose: () => void }) {
  const courseGroupLink = process.env.NEXT_PUBLIC_COURSE_GROUP_LINK || '#'
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl text-center">
        <div className={`px-6 py-8 bg-gradient-to-br ${type === 'course' ? 'from-[#1B4332] to-[#2D6A4F]' : 'from-[#2D6A4F] to-[#52B788]'}`}>
          <div className="text-6xl mb-3">{type === 'course' ? '🎉' : '🎁'}</div>
          <h2 className="text-white text-2xl font-bold">{type === 'course' ? 'Thanh toán thành công!' : 'Đã gửi cho bạn!'}</h2>
          <p className="text-white/90 mt-1 text-sm">Xin chào {name} 👋</p>
        </div>
        <div className="p-6">
          {type === 'course' ? (
            <>
              <p className="text-gray-600 mb-5 leading-relaxed text-sm">Chúc mừng bạn đã tham gia <strong>Khóa học Dưa Cà Muối!</strong><br />Cô Hạ đã gửi thông tin chi tiết qua email.</p>
              <a href={courseGroupLink} target="_blank" rel="noopener noreferrer"
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-colors">
                👥 Vào Group Học Viên Ngay
              </a>
              <p className="text-xs text-gray-400 mt-2">Video bài giảng đầy đủ trong group Facebook</p>
            </>
          ) : (
            <>
              <p className="text-gray-600 mb-5 leading-relaxed text-sm">Cô Hạ đã gửi <strong>video Cà Muối Mắm</strong> vào email bạn.<br />Kiểm tra hộp thư nhé (cả spam)! 📬</p>
              <div className="bg-green-50 text-green-800 rounded-xl p-3 text-sm">🎬 Video hướng dẫn đã được gửi – xem ngay để bắt đầu!</div>
            </>
          )}
          <button onClick={onClose} className="mt-4 text-gray-400 text-sm hover:text-gray-600 underline">Đóng</button>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function KhoaHocDuaCaMuoi() {
  const countdown = useCountdown(24)
  const [giftSuccess, setGiftSuccess] = useState(false)
  const [giftName, setGiftName] = useState('')
  const [qrData, setQrData] = useState<QRData | null>(null)
  const [courseSuccess, setCourseSuccess] = useState(false)
  const [courseName, setCourseName] = useState('')
  const courseRef = useRef<HTMLDivElement>(null)
  const scrollToCourse = () => courseRef.current?.scrollIntoView({ behavior: 'smooth' })

  return (
    <div className="min-h-screen bg-[#F4FAF6] font-sans">

      {/* ══ HERO ══ */}
      <section className={`relative overflow-hidden bg-gradient-to-b ${C.hero} text-white`}>
        {/* subtle texture */}
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 25% 50%, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-14">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-2xl px-5 py-3 shadow-xl inline-flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Bếp Cô Hạ" className="h-14 w-auto object-contain"
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
              <span className="text-[#1B4332] font-extrabold text-xl tracking-tight">Bếp Cô Hạ</span>
            </div>
          </div>

          {/* Badge */}
          <div className="flex justify-center mb-5">
            <span className="bg-red-500 text-white text-sm font-bold px-5 py-1.5 rounded-full animate-bounce shadow">
              🔥 Ưu đãi đặc biệt – Chỉ hôm nay!
            </span>
          </div>

          {/* Headline */}
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight">
              Bí Quyết Làm<br />
              <span className="text-[#52B788]">Dưa Cà Muối Ngon</span><br />
              Chuẩn Vị Từ Cô Hạ
            </h1>
            <p className="mt-4 text-green-200 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Từ dưa cải bẹ, dưa góp, cà muối mắm đến sung cà –<br className="hidden sm:block" />
              học một lần, làm ngon mãi mãi. Dùng cho gia đình hoặc kinh doanh!
            </p>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {[
              { icon: '👩‍🍳', text: '149+ học viên' },
              { icon: '⭐', text: '5.0 đánh giá' },
              { icon: '📹', text: '20+ video' },
              { icon: '🔄', text: 'Học trọn đời' },
            ].map(s => (
              <div key={s.text} className="flex items-center gap-2 bg-white/10 backdrop-blur rounded-full px-4 py-2 text-sm border border-white/10">
                <span>{s.icon}</span><span className="font-medium">{s.text}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <button onClick={scrollToCourse}
              className="bg-white text-[#1B4332] font-bold text-lg px-8 py-4 rounded-2xl shadow-lg hover:bg-green-50 transition-colors">
              Xem khóa học ngay →
            </button>
          </div>
        </div>
      </section>

      {/* ══ FLOW 1: GIFT FORM ══ */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <span className="text-3xl">🎁</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-800 mt-2 mb-3">
              Nhận Ngay Quà Tặng <span className="text-[#1B4332]">MIỄN PHÍ</span> Từ Cô Hạ
            </h2>
            <p className="text-gray-500 text-base max-w-xl mx-auto">
              Điền thông tin để nhận <strong>video làm Cà Muối Mắm</strong> – gửi vào email ngay lập tức!
            </p>
          </div>

          {/* 2-column on desktop, stacked on mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left: Video preview */}
            <div className="flex flex-col items-center gap-4">
              <YTShort id="hv52ihJTWKU" title="Video Cà Muối Mắm miễn phí" />
              <p className="text-sm text-gray-500 text-center italic">
                🎬 Preview video quà tặng – nhận full video qua email!
              </p>
            </div>

            {/* Right: Form */}
            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-green-100">
              {/* Benefits */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { icon: '🎬', title: 'Video hướng dẫn', desc: 'Cà muối mắm A-Z' },
                  { icon: '📋', title: 'Công thức chi tiết', desc: 'Tỷ lệ chuẩn, dễ làm' },
                  { icon: '📧', title: 'Gửi vào email ngay', desc: 'Nhận trong vài giây' },
                  { icon: '🆓', title: 'Miễn phí 100%', desc: 'Không điều kiện' },
                ].map(b => (
                  <div key={b.title} className="flex items-start gap-2.5 bg-green-50 rounded-xl p-3">
                    <span className="text-xl">{b.icon}</span>
                    <div>
                      <p className="font-semibold text-gray-800 text-xs">{b.title}</p>
                      <p className="text-gray-400 text-xs">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <LeadForm ctaText="🎁 Gửi video cho tôi ngay!" ctaColor="green"
                onSuccess={d => { setGiftName(d.name); setGiftSuccess(true) }} />
            </div>
          </div>
        </div>
      </section>

      {/* ══ DIVIDER ══ */}
      <div className="max-w-4xl mx-auto px-4 py-2 flex items-center gap-4">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#52B788]" />
        <span className="text-xl">🌿</span>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[#52B788]" />
      </div>

      {/* ══ FLOW 2: COURSE ══ */}
      <section ref={courseRef} id="khoa-hoc" className="py-16 px-4 sm:px-6 scroll-mt-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <span className="inline-block bg-[#1B4332] text-[#52B788] font-bold text-xs px-4 py-1.5 rounded-full mb-4 tracking-widest uppercase">
              Khóa học chuyên sâu
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-800 mb-4">
              Dưa Cà Muối Chuyên Sâu –<br />
              <span className="text-[#1B4332]">Từ Gia Đình Đến Kinh Doanh</span>
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-base leading-relaxed">
              Khóa học bài bản nhất về dưa cà muối. Cô Hạ dạy từng bước, từng công thức –
              bạn học xong là làm được ngay, ngon như hàng bán.
            </p>
          </div>

          {/* Video intro + course content side by side on desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10 items-center">
            {/* Video */}
            <div className="flex flex-col items-center gap-3">
              <YTShort id="tF_SRl4Ue3U" title="Giới thiệu khóa học Dưa Cà Muối" />
              <p className="text-sm text-gray-500 italic text-center">📹 Xem trước nội dung khóa học</p>
            </div>

            {/* Course content */}
            <div className="space-y-5">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="font-bold text-gray-800 text-lg mb-4">📚 Bạn sẽ học được gì?</h3>
                <ul className="space-y-3">
                  {[
                    ['🥬', 'Dưa cải bẹ muối chua', 'Đúng chuẩn, không bị nhớt, ăn giòn'],
                    ['🥒', 'Dưa góp', 'Màu đẹp, chua ngọt vừa miệng'],
                    ['🍅', 'Sung cà muối chua ngọt', 'Bí quyết giữ được lâu không hỏng'],
                    ['🥕', 'Dưa củ cải cà rốt', 'Đủ màu sắc, làm quà biếu rất sang'],
                    ['🌶️', 'Cà muối mắm', 'Thơm đậm đà, chuẩn vị Nam Bộ'],
                  ].map(([icon, title, desc]) => (
                    <li key={String(title)} className="flex items-start gap-3">
                      <span className="text-xl flex-shrink-0">{icon}</span>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{title}</p>
                        <p className="text-gray-400 text-xs">{desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-[#f0faf4] rounded-2xl p-5 border border-[#b7e4c7]">
                <h3 className="font-bold text-[#1B4332] text-base mb-3">🎁 Bonus đi kèm</h3>
                <ul className="space-y-2">
                  {['Công thức nước ngâm chuẩn tỷ lệ', 'Hướng dẫn chọn nguyên liệu tươi', 'Bí quyết bảo quản giữ lâu', 'Group hỗ trợ học viên 24/7', 'Cập nhật công thức mới miễn phí'].map(i => (
                    <li key={i} className="flex items-center gap-2 text-sm text-[#1B4332]">
                      <span className="text-[#2D6A4F] font-bold text-base">✓</span>{i}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Pricing + Form full width below */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Testimonials */}
            <div className="space-y-4">
              <h3 className="font-bold text-gray-700 text-base">💬 Học viên nói gì?</h3>
              {[
                { name: 'Chị Lan – Hà Nội', text: 'Học xong là làm được ngay, cả nhà khen nức nở! Mấy hũ dưa cải của tôi giờ không đủ bán 😄', av: '👩' },
                { name: 'Chị Mai – TP.HCM', text: 'Công thức chi tiết lắm, Cô Hạ giải thích rõ ràng từng bước. Đáng tiền lắm chị em ơi!', av: '👩‍🦱' },
                { name: 'Chị Hương – Đà Nẵng', text: 'Tôi mở hàng bán dưa cà sau khi học khóa này, khách phản hồi rất tốt 🙏', av: '👩‍🦳' },
              ].map(t => (
                <div key={t.name} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{t.av}</span>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{t.name}</p>
                      <span className="text-amber-400 text-xs">★★★★★</span>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm italic">"{t.text}"</p>
                </div>
              ))}
            </div>

            {/* Pricing card */}
            <div>
              {/* Countdown */}
              <div className="bg-red-600 text-white rounded-2xl p-4 mb-4 text-center">
                <p className="text-sm text-red-100 mb-2">⏰ Giá ưu đãi kết thúc sau:</p>
                <div className="flex justify-center gap-3">
                  {[{ v: countdown.h.toString().padStart(2, '0'), l: 'Giờ' }, { v: countdown.m.toString().padStart(2, '0'), l: 'Phút' }, { v: countdown.s.toString().padStart(2, '0'), l: 'Giây' }].map(({ v, l }) => (
                    <div key={l} className="bg-white/20 rounded-lg px-3 py-2 min-w-[52px]">
                      <div className="font-mono text-2xl font-bold">{v}</div>
                      <div className="text-xs text-red-200">{l}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-2xl border-2 border-[#b7e4c7] overflow-hidden">
                <div className="bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] px-6 py-5 text-center">
                  <p className="text-white/70 text-sm line-through mb-1">Giá gốc: 999.000đ</p>
                  <span className="text-white text-5xl font-extrabold">138.000đ</span>
                  <div className="mt-2">
                    <span className="inline-block bg-yellow-400 text-yellow-900 text-sm font-bold px-3 py-1 rounded-full">
                      Tiết kiệm 861.000đ – Giảm 86%!
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <LeadForm ctaText="🎓 Đăng ký học – 138.000đ" ctaColor="red"
                    onSuccess={(d: FormData & { qr?: QRData; paymentRef?: string }) => {
                      setCourseName(d.name)
                      if (d.qr) setQrData({ ...d.qr, paymentRef: d.paymentRef || '' })
                    }} />
                  <div className="mt-5 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3">
                    {[{ icon: '🔒', text: 'Thanh toán an toàn' }, { icon: '📱', text: 'Học online mọi lúc' }, { icon: '🔄', text: 'Xem lại không giới hạn' }, { icon: '💬', text: 'Hỗ trợ 24/7' }].map(i => (
                      <div key={i.text} className="flex items-center gap-1.5 text-xs text-gray-500">
                        <span>{i.icon}</span><span>{i.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cam kết */}
              <div className="mt-4 bg-[#f0faf4] border border-[#b7e4c7] rounded-xl p-4 text-center">
                <div className="text-2xl mb-1">🌟</div>
                <p className="font-bold text-[#1B4332] text-sm">Cam kết học trọn đời</p>
                <p className="text-[#2D6A4F] text-xs mt-1">Truy cập video & tài liệu mãi mãi, cập nhật công thức mới miễn phí</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FAQ ══ */}
      <section className="py-12 px-4 sm:px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">❓ Câu hỏi thường gặp</h2>
          <div className="space-y-3">
            {[
              { q: 'Khóa học này học ở đâu?', a: 'Sau khi thanh toán, bạn được mời vào nhóm Facebook riêng của học viên. Toàn bộ video bài giảng có trong group, xem được trên điện thoại hoặc máy tính bất cứ lúc nào.' },
              { q: 'Tôi không biết nấu ăn có học được không?', a: 'Hoàn toàn được! Cô Hạ dạy từng bước từ cơ bản. Chưa biết nấu ăn vẫn làm được ngay sau khi xem video.' },
              { q: 'Thanh toán như thế nào?', a: 'Chuyển khoản qua QR code hoặc chuyển khoản thủ công. Sau khi chuyển, hệ thống tự xác nhận và gửi link group qua email trong vài phút.' },
              { q: 'Tôi có thể học lại nhiều lần không?', a: 'Có! Xem video không giới hạn số lần và thời gian. Group học viên luôn mở, Cô Hạ tiếp tục cập nhật công thức mới miễn phí.' },
            ].map(item => (
              <details key={item.q} className="bg-gray-50 rounded-xl border border-gray-200 group">
                <summary className="px-5 py-4 font-semibold text-gray-800 cursor-pointer flex justify-between items-center hover:text-[#1B4332] transition-colors text-sm sm:text-base">
                  {item.q}
                  <span className="text-gray-400 group-open:rotate-180 transition-transform text-xs ml-2 flex-shrink-0">▼</span>
                </summary>
                <p className="px-5 pb-4 text-gray-600 text-sm leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA ══ */}
      <section className={`py-16 px-4 bg-gradient-to-b ${C.hero} text-white text-center`}>
        <div className="max-w-2xl mx-auto">
          <div className="text-5xl mb-4">🥒</div>
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-4">
            Bắt đầu hành trình làm dưa cà ngon<br />cùng Cô Hạ ngay hôm nay!
          </h2>
          <p className="text-green-200 mb-8 text-lg">
            Chỉ <strong className="text-yellow-300 text-2xl">138.000đ</strong> – ít hơn một bữa ăn ngoài –<br />
            bạn có cả kho bí quyết làm dưa cà cho cả đời!
          </p>
          <button onClick={scrollToCourse}
            className="bg-white text-[#1B4332] font-extrabold text-xl px-10 py-5 rounded-2xl shadow-xl hover:bg-green-50 transition-colors">
            🎓 Đăng ký ngay – 138.000đ
          </button>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="bg-[#0D2B1A] text-green-400/60 text-center py-6 px-4 text-sm">
        <p>© 2025 Bếp Cô Hạ – <a href="https://hacofood.vn" className="text-[#52B788] hover:underline">Hacofood.vn</a></p>
        <p className="mt-1">Chuyên đào tạo dưa cà muối & ẩm thực truyền thống Việt Nam</p>
      </footer>

      {/* ══ MODALS ══ */}
      {qrData && !courseSuccess && (
        <PaymentModal qr={qrData} onClose={() => setQrData(null)} onPaid={() => { setQrData(null); setCourseSuccess(true) }} />
      )}
      {courseSuccess && <SuccessScreen type="course" name={courseName} onClose={() => setCourseSuccess(false)} />}
      {giftSuccess && <SuccessScreen type="gift" name={giftName} onClose={() => setGiftSuccess(false)} />}
    </div>
  )
}
