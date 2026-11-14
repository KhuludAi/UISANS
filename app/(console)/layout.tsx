import { Sidebar } from '@/components/shell/sidebar'
import { Topbar } from '@/components/shell/topbar'

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-void">
      <Sidebar />
      <div className="relative flex min-w-0 flex-1 flex-col">
        <div aria-hidden className="sci-grid pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_60%)]" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(ellipse_at_top_right,rgb(18_60_101/0.45),transparent_60%)]"
        />
        <Topbar />
        <main id="main" className="relative mx-auto w-full max-w-[1600px] flex-1 px-4 py-8 md:px-6 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  )
}
