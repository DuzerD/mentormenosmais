import { Suspense } from "react";
import ResetPasswordPage from "@/components/brilho-original/reset-password";

function LoadingFallback() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#1a1814] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-[#c8b79e]/30 border-t-[#c8b79e] rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white/70">Carregando...</p>
      </div>
    </div>
  )
}

export default function ResetPassword() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResetPasswordPage />
    </Suspense>
  )
}
