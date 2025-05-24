"use client"

import { useRouter } from 'next/navigation'

export default function SignIn() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <a 
        href="/profile"
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Go to Profile
      </a>
    </div>
  )
} 