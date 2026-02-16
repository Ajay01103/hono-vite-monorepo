import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { client } from "~/lib/client"

interface TransactionPayload {
  title: string
  amount: string
  type: "INCOME" | "EXPENSE"
  category: string
  date: Date
  paymentMethod: string
  isRecurring: boolean
  frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | null
  description?: string
  receiptUrl?: string
}

export const useCreateTransaction = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: TransactionPayload) => {
      // Convert amount from string to number
      const amount = Number(payload.amount)

      if (isNaN(amount) || amount <= 0) {
        throw new Error("Invalid amount")
      }

      // Map frequency to recurringInterval for the backend
      const response = await client.api.transactions.create.$post({
        json: {
          title: payload.title,
          amount,
          type: payload.type,
          category: payload.category,
          date: payload.date,
          paymentMethod: payload.paymentMethod as any,
          isRecurring: payload.isRecurring,
          recurringInterval: payload.frequency as any,
          description: payload.description || "",
          receiptUrl: payload.receiptUrl || "",
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create transaction")
      }

      return response.json()
    },
    onSuccess: (data) => {
      toast.success("Transaction created successfully")
      // Invalidate queries to refetch transactions
      queryClient.invalidateQueries({ queryKey: ["transactions"] })
    },
    onError: (error) => {
      toast.error("Failed to create transaction", {
        description: error.message,
      })
    },
  })
}
