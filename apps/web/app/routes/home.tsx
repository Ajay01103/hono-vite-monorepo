import type { Route } from "./+types/home"
import { PrivateGuard } from "~/components/route-guards"
import { Welcome } from "../welcome/welcome"

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Home" },
    { name: "description", content: "Welcome to your dashboard" },
  ]
}

export default function Home() {
  return (
    <PrivateGuard>
      <Welcome />
    </PrivateGuard>
  )
}
