import { type RouteConfig, index, route } from "@react-router/dev/routes"

export default [
  index("routes/home.tsx"),
  route("/sign-in", "routes/sign-in.tsx"),
  route("/sign-up", "routes/sign-up.tsx"),
  route("/overview", "routes/overview.tsx"),
  // Catch-all for Chrome DevTools and other unmatched routes
  route("*", "routes/404.tsx"),
] satisfies RouteConfig
