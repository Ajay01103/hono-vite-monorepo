import LoginPage from "~/components/login"
import { AuthGuard } from "~/components/route-guards"
import type { Route } from "./+types/sign-in"

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Sign In" },
    { name: "description", content: "Sign in to your account" },
  ]
}

export default function SignIn() {
  return (
    <AuthGuard>
      <LoginPage />
    </AuthGuard>
  )
}
