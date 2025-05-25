"use client"
import { useSearchParams } from "next/navigation"
import RoleSwitcher from "./RoleSwitcher"
import EarningsTasksCard from "./EarningsTasksCard"
import FavoritesFollowingCard from "./FavoritesFollowingCard"

export default function ProfileClient() {
  const searchParams = useSearchParams()
  const role = searchParams.get("role") === "user" ? "user" : "developer"

  return (
    <div className="space-y-6">
      <RoleSwitcher />
      {role === "developer" ? <EarningsTasksCard /> : <FavoritesFollowingCard />}
    </div>
  )
}
