import { ChevronDown, LogOut } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Button } from "../ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"

export function UserNav({
  userName,
  profilePicture,
  onLogout,
}: {
  userName: string
  profilePicture: string
  onLogout: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="gap-1 relative h-auto rounded-full bg-transparent hover:bg-gray-100 px-2 py-1">
          <Avatar className="cursor-pointer h-9 w-9">
            <AvatarImage
              src={profilePicture || ""}
              className="cursor-pointer"
            />
            <AvatarFallback className="bg-primary text-primary-foreground border-0 font-semibold">
              {userName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <ChevronDown className="w-4 h-4 text-gray-600" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-64 border-border shadow-lg"
        align="end"
        forceMount>
        <DropdownMenuLabel className="flex flex-col items-start gap-1 py-3">
          <span className="font-semibold text-foreground">{userName}</span>
          <span className="font-normal text-xs text-muted-foreground">
            Free Trial (2 days left)
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            className="cursor-pointer hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive py-2.5"
            onClick={onLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
