import { LoginForm } from "@/components/auth/LoginForm"

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-background">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo / Wordmark */}
        <div className="text-center space-y-2">
          <div className="text-4xl">🛒</div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Remto
          </h1>
          <p className="text-sm text-muted-foreground">
            Smart pantry tracking
          </p>
        </div>

        <LoginForm />

        <p className="text-center text-xs text-muted-foreground/40">Semad Tech</p>
      </div>
    </main>
  )
}
