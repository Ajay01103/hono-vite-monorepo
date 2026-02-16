import { PlusIcon, XIcon } from "lucide-react"
import { useState } from "react"
import { Button } from "~/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "~/components/ui/drawer"
import TransactionForm from "./transaction-form"

const AddTransactionDrawer = () => {
  const [open, setOpen] = useState(false)

  const onCloseDrawer = () => {
    setOpen(false)
  }

  return (
    <Drawer
      direction="right"
      open={open}
      onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button className="!cursor-pointer !text-white">
          <PlusIcon className="h-4 w-4" />
          Add Transaction
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-w-md overflow-hidden overflow-y-auto">
        <DrawerHeader className="relative">
          <div>
            <DrawerTitle className="font-semibold text-xl">Add Transaction</DrawerTitle>
            <DrawerDescription>
              Add a new transaction to track your finances
            </DrawerDescription>
          </div>
          <DrawerClose className="absolute top-4 right-4">
            <XIcon className="!cursor-pointer h-5 w-5" />
          </DrawerClose>
        </DrawerHeader>
        <TransactionForm onCloseDrawer={onCloseDrawer} />
      </DrawerContent>
    </Drawer>
  )
}

export default AddTransactionDrawer
