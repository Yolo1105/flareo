"use client"
import DeveloperOverview from "./DeveloperOverview"
import UserOverview from "./UserOverview"

interface ProfileOverviewProps {
  role: "developer" | "user"
}

export default function ProfileOverview({ role }: ProfileOverviewProps) {
  return <div className="space-y-6">{role === "developer" ? <DeveloperOverview /> : <UserOverview />}</div>
}
