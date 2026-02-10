import RegisterPage from "~/components/register"
import { AuthGuard } from "~/components/route-guards"
import type { Route } from "./+types/sign-up"

export function meta({}: Route.MetaArgs) {
  return [{ title: "Sign Up" }, { name: "description", content: "Create a new account" }]
}

export default function SignUp() {
  return (
    <AuthGuard>
      <RegisterPage />
    </AuthGuard>
  )
}
