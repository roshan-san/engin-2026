import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <div className="p-8 bg-blue-500 flex min-h-screen items-center justify-center">
      
    </div>
  )
}
