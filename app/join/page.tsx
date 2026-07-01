import { Suspense } from "react"
import { JoinClient } from "./JoinClient"

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      }
    >
      <JoinClient />
    </Suspense>
  )
}
