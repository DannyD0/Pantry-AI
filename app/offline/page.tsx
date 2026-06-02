"use client"

export default function OfflinePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-background text-center">
      <div className="space-y-4 max-w-sm">
        <div className="text-5xl">📦</div>
        <h1 className="text-2xl font-bold tracking-tight">You&apos;re offline</h1>
        <p className="text-sm text-muted-foreground">
          No internet connection. Connect to a network to sync your pantry.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
        >
          Try again
        </button>
      </div>
    </main>
  )
}
