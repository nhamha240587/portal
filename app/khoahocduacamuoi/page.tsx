import { redirect } from 'next/navigation'

// Redirect cũ → trang chủ mới
export default function OldLandingPage() {
  redirect('/')
}
