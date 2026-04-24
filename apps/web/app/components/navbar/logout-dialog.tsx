import { Loader } from "lucide-react"
import { useTransition } from "react"
import { useNavigate } from "react-router"
import { useAppDispatch } from "~/hooks/useTypedSelector"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import { logout } from "~/store/slices/authSlice"
import { persistor } from "~/store/store"
import { Button } from "../ui/button"

interface LogoutDialogProps {
  isOpen: boolean
  setIsOpen: (value: boolean) => void
}

const LogoutDialog = ({ isOpen, setIsOpen }: LogoutDialogProps) => {
  const [isPending, startTransition] = useTransition()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const handleLogout = async () => {
    startTransition(async () => {
      setIsOpen(false)

      // Dispatch logout action to reset Redux state
      dispatch(logout())

      // Purge persisted state from storage
      await persistor.purge()

      // Clear any additional auth-related items from localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken")
      }

      // Navigate to sign-in page
      navigate("/sign-in", { replace: true })
    })
  }
  return (
    <Dialog
      open={isOpen}
      onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you sure you want to log out?</DialogTitle>
          <DialogDescription>
            This will end your current session and you will need to log in again to access
            your account.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="destructive"
            disabled={isPending}
            type="button"
            onClick={handleLogout}>
            {isPending && <Loader className="animate-spin" />}
            Yes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default LogoutDialog
