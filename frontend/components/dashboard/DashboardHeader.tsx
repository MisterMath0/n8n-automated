"use client"

import { useAuth } from '@/hooks/useAuth'
import { UserMenu } from '@/components/UserMenu'

export function DashboardHeader() {
  const { user } = useAuth()

  return (
    <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">
            N8N AI Workflow Generator
          </h1>
          <p className="text-gray-400 text-sm">
            Welcome back, {user?.email}
          </p>
        </div>
        <UserMenu />
      </div>
    </div>
  )
}
