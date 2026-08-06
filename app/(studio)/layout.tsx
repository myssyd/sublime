import { AuthGate } from "@/components/auth-gate"
import { StudioSidebar } from "@/components/studio-sidebar"

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <StudioSidebar />
      <main className="min-h-screen pb-16 md:ml-[84px] md:pb-0">{children}</main>
    </AuthGate>
  )
}
