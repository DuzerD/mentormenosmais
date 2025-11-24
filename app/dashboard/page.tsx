import Dashboard from "@/components/brilho-original/dashboard"
import { ProtectedRoute } from "@/components/ProtectedRoute"

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  )
}
