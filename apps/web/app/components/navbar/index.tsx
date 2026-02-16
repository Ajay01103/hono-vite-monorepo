import { useState } from "react"
import { Menu } from "lucide-react"
import { NavLink, useLocation } from "react-router"
import { cn } from "~/lib/utils"
import Logo from "~/components/logo"
import { Button } from "../ui/button"
import { Sheet, SheetContent } from "../ui/sheet"
import { UserNav } from "./user-nav"
import LogoutDialog from "./logout-dialog"
import { useTypedSelector } from "~/hooks/useTypedSelector"

const Navbar = () => {
  const { pathname } = useLocation()
  const { user } = useTypedSelector((state) => state.auth)

  const [isOpen, setIsOpen] = useState(false)
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)

  const routes = [
    {
      href: "/overview",
      label: "Overview",
    },
    {
      href: "/transactions",
      label: "Transactions",
    },
    {
      href: "/reports",
      label: "Reports",
    },
    {
      href: "/settings",
      label: "Settings",
    },
  ]

  return (
    <>
      <header
        className={cn(
          "w-full px-4 py-3 lg:px-14 bg-white border-b border-border shadow-sm",
          pathname === "/overview" && "pb-3",
        )}>
        <div className="w-full flex h-14 max-w-[var(--max-width)] items-center mx-auto">
          <div className="w-full flex items-center justify-between">
            {/* Left side - Logo */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="inline-flex md:hidden cursor-pointer hover:bg-gray-100"
                onClick={() => setIsOpen(true)}>
                <Menu className="h-6 w-6 text-gray-700" />
              </Button>

              <Logo />
            </div>

            {/* Navigation*/}
            <nav className="hidden md:flex items-center gap-x-2 overflow-x-auto">
              {routes?.map((route) => (
                <Button
                  size="sm"
                  variant="ghost"
                  className={cn(
                    `w-full lg:w-auto font-normal py-4.5 px-4
                     hover:bg-gray-100 border-none
                     text-gray-600 hover:text-gray-900
                     transition bg-transparent text-[14.5px]
                     `,
                    pathname === route.href && "text-gray-900 font-medium bg-gray-50",
                  )}
                  asChild>
                  <NavLink
                    key={route.href}
                    to={route.href}>
                    {route.label}
                  </NavLink>
                </Button>
              ))}
            </nav>

            {/* Mobile Navigation */}
            <Sheet
              open={isOpen}
              onOpenChange={setIsOpen}>
              <SheetContent
                side="left"
                className="bg-white">
                <nav className="flex flex-col gap-y-2 pt-9">
                  {routes?.map((route) => (
                    <Button
                      size="sm"
                      variant="ghost"
                      className={cn(
                        `w-full font-normal py-4.5
                       hover:bg-gray-100 hover:text-gray-900 border-none
                       text-gray-600
                       transition bg-transparent justify-start`,
                        pathname === route.href &&
                          "bg-gray-100 text-gray-900 font-medium",
                      )}
                      asChild>
                      <NavLink
                        key={route.href}
                        to={route.href}>
                        {route.label}
                      </NavLink>
                    </Button>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>

            {/* {} */}
            {/* Right side - User actions */}
            <div className="flex items-center space-x-4">
              <UserNav
                userName={user?.name || ""}
                profilePicture={user?.profilePicture || ""}
                onLogout={() => setIsLogoutDialogOpen(true)}
              />
            </div>
          </div>
        </div>
      </header>

      <LogoutDialog
        isOpen={isLogoutDialogOpen}
        setIsOpen={setIsLogoutDialogOpen}
      />
    </>
  )
}

export default Navbar
