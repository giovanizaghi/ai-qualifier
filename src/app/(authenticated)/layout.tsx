import { Navbar } from "@/components/shared"

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      <Navbar />
      <main>{children}</main>
    </div>
  )
}
