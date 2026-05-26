import { Navigation } from '@/components/navigation'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Navigation />
      <main className="md:pl-72 min-h-screen pb-20 md:pb-0">
        {children}
      </main>
    </>
  )
}