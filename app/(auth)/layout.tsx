import BrandLogo from '@/components/ui/BrandLogo'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <BrandLogo variant="full" />
        </div>
        {children}
      </div>
    </div>
  )
}
