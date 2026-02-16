import { OverView } from "~/components/dashboard"
import type { Route } from "./+types/home"
import { PrivateGuard } from "~/components/route-guards"

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Overview" },
    { name: "description", content: "Welcome to overview Page" },
  ]
}

export default function Home() {
  return (
    <PrivateGuard>
      <OverView />
    </PrivateGuard>
  )
}
