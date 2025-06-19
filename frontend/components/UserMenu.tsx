"use client"

import { useAuth } from '@/hooks/useAuth'
import { User, LogOut } from 'lucide-react'

export function UserMenu() {
  const { user, signOut } = useAuth()

  if (!user) return null

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 text-sm text-gray-300">
        <User className="w-4 h-4" />
        <span>{user.email}</span>
      </div>
      <button
        onClick={signOut}
        className="flex items-center gap-1 px-2 py-1 text-sm text-gray-400 hover:text-white transition-colors"
        title="Sign out"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  )
}
