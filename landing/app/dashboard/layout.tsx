import { queryClient } from '@/lib/queryClient'
import { QueryClientProvider } from '@tanstack/react-query'
import { Navbar } from '../_ui/Navbar'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <Navbar />
      <main className="container mx-auto p-6">{children}</main>
    </QueryClientProvider>
  )
}
