"use client"
import { useSearchParams } from "next/navigation"
import ProfileDetail from "./detail/ProfileDetail"

export default function ProfileContent() {
  const searchParams = useSearchParams()
  const role = searchParams.get("role") === "user" ? "user" : "developer"

  return (
    <div className="container mx-auto px-6 max-w-7xl">
      <div role="tabpanel" aria-labelledby={`${role}-tab`}>
        <ProfileDetail role={role} />
      </div>
    </div>
  )
}
