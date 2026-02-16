import * as z from "zod"
import { useEffect, useState } from "react"
import { Calendar } from "lucide-react"
import { useForm } from "@tanstack/react-form"
import { Button } from "~/components/ui/button"
import { Label } from "~/components/ui/label"
import { Input } from "~/components/ui/input"
import { Textarea } from "~/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group"
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover"
import { cn } from "~/lib/utils"
import { format } from "date-fns"
import { Calendar as CalendarComponent } from "~/components/ui/calendar"
import RecieptScanner from "./reciept-scanner"
import {
  _TRANSACTION_FREQUENCY,
  _TRANSACTION_TYPE,
  CATEGORIES,
  PAYMENT_METHODS,
} from "~/constants"
import { Switch } from "../ui/switch"
import CurrencyInputField from "../ui/currency-input"
import { SingleSelector } from "../ui/single-select"
import type { AIScanReceiptData } from "./types"
import { useCreateTransaction } from "~/api/useTransactions"

// Helper function to format error messages
const formatError = (err: any) => {
  if (typeof err === "string") return err
  if (err?.message) return err.message
  if (err?.issues?.[0]?.message) return err.issues[0].message
  return JSON.stringify(err)
}

const formSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters." }),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a positive number.",
  }),
  type: z.enum([_TRANSACTION_TYPE.INCOME, _TRANSACTION_TYPE.EXPENSE]),
  category: z.string().min(1, { message: "Please select a category." }),
  date: z.date({
    error: "Please select a date.",
  }),
  paymentMethod: z.string().min(1, { message: "Please select a payment method." }),
  isRecurring: z.boolean(),
  frequency: z
    .enum([
      _TRANSACTION_FREQUENCY.DAILY,
      _TRANSACTION_FREQUENCY.WEEKLY,
      _TRANSACTION_FREQUENCY.MONTHLY,
      _TRANSACTION_FREQUENCY.YEARLY,
    ])
    .nullable(),
  description: z.string(),
  receiptUrl: z.string(),
})

type FormValues = z.infer<typeof formSchema>

const TransactionForm = (props: {
  isEdit?: boolean
  transactionId?: string
  onCloseDrawer?: () => void
}) => {
  const { onCloseDrawer, isEdit = false, transactionId } = props

  const [isScanning, setIsScanning] = useState(false)
  const createTransactionMutation = useCreateTransaction()

  // const {data, isLoading } = useGetSingleTransactionQuery(
  //   transactionId || "",{skip: !transactionId}
  // );
  // const editData = data?.data;

  // const [updateTransaction, { isLoading: isUpdating }] =
  //   useUpdateTransactionMutation();

  const form = useForm({
    defaultValues: {
      title: "",
      amount: "",
      type: _TRANSACTION_TYPE.INCOME as "INCOME" | "EXPENSE",
      category: "",
      date: new Date(),
      paymentMethod: "",
      isRecurring: false,
      frequency: null as null | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY",
      description: "",
      receiptUrl: "",
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      if (isEdit && transactionId) {
        // TODO: Implement update transaction
        console.log("Edit transaction:", value)
        onCloseDrawer?.()
        return
      }

      // Create transaction
      createTransactionMutation.mutate(
        {
          title: value.title,
          amount: value.amount,
          type: value.type,
          category: value.category,
          date: value.date,
          paymentMethod: value.paymentMethod,
          isRecurring: value.isRecurring,
          frequency: value.frequency,
          description: value.description || "",
          receiptUrl: value.receiptUrl || "",
        },
        {
          onSuccess: () => {
            // Reset form and close drawer on success
            form.reset()
            onCloseDrawer?.()
          },
        },
      )
    },
  })

  useEffect(() => {
    if (isEdit && transactionId) {
      // When editing, you would load data here and set field values
      // form.setFieldValue("title", editData.title);
      // form.setFieldValue("amount", editData.amount.toString());
      // etc...
    }
  }, [isEdit, transactionId])

  const frequencyOptions = Object.entries(_TRANSACTION_FREQUENCY).map(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ([_, value]) => ({
      value: value,
      label: value.replace("_", " ").toLowerCase(),
    }),
  )

  const handleScanComplete = (data: AIScanReceiptData) => {
    form.setFieldValue("title", data.title || "")
    form.setFieldValue("amount", data.amount.toString())
    form.setFieldValue("type", data.type || _TRANSACTION_TYPE.EXPENSE)
    form.setFieldValue("category", data.category?.toLowerCase() || "")
    form.setFieldValue("date", new Date(data.date))
    form.setFieldValue("paymentMethod", data.paymentMethod || "")
    form.setFieldValue("isRecurring", false)
    form.setFieldValue("frequency", null)
    form.setFieldValue("description", data.description || "")
    form.setFieldValue("receiptUrl", data.receiptUrl || "")
  }

  return (
    <div className="relative pb-10 pt-5 px-2.5">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
        className="space-y-6 px-4">
        <div className="space-y-6">
          {/* Receipt Upload Section */}
          {!isEdit && (
            <RecieptScanner
              loadingChange={isScanning}
              onScanComplete={handleScanComplete}
              onLoadingChange={setIsScanning}
            />
          )}

          {/* Transaction Type */}
          <form.Field
            name="type"
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <div className="space-y-2">
                  <Label>Transaction Type</Label>
                  <RadioGroup
                    onValueChange={(value) =>
                      field.handleChange(value as "INCOME" | "EXPENSE")
                    }
                    value={field.state.value}
                    className="flex space-x-2"
                    disabled={isScanning}>
                    <label
                      htmlFor={_TRANSACTION_TYPE.INCOME}
                      className={cn(
                        `text-sm font-normal leading-none cursor-pointer
                          flex items-center space-x-2 rounded-md 
                          shadow-sm border p-2 flex-1 justify-center 
                          `,
                        field.state.value === _TRANSACTION_TYPE.INCOME &&
                          "border-primary!",
                      )}>
                      <RadioGroupItem
                        value={_TRANSACTION_TYPE.INCOME}
                        id={_TRANSACTION_TYPE.INCOME}
                        className="border-primary!"
                      />
                      Income
                    </label>

                    <label
                      htmlFor={_TRANSACTION_TYPE.EXPENSE}
                      className={cn(
                        `text-sm font-normal leading-none cursor-pointer
                          flex items-center space-x-2 rounded-md 
                          shadow-sm border p-2 flex-1 justify-center 
                          `,
                        field.state.value === _TRANSACTION_TYPE.EXPENSE &&
                          "border-primary!",
                      )}>
                      <RadioGroupItem
                        value={_TRANSACTION_TYPE.EXPENSE}
                        id={_TRANSACTION_TYPE.EXPENSE}
                        className="border-primary!"
                      />
                      Expense
                    </label>
                  </RadioGroup>
                  {isInvalid && field.state.meta.errors.length > 0 && (
                    <p className="text-sm text-red-500">
                      {field.state.meta.errors.map(formatError).join(", ")}
                    </p>
                  )}
                </div>
              )
            }}
          />

          {/* Title */}
          <form.Field
            name="title"
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Title</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Transaction title"
                    disabled={isScanning}
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && field.state.meta.errors.length > 0 && (
                    <p className="text-sm text-red-500">
                      {field.state.meta.errors.map(formatError).join(", ")}
                    </p>
                  )}
                </div>
              )
            }}
          />

          {/* Amount */}
          <form.Field
            name="amount"
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Amount</Label>
                  <div className="relative">
                    <CurrencyInputField
                      name={field.name}
                      value={field.state.value}
                      disabled={isScanning}
                      onValueChange={(value) => field.handleChange(value || "")}
                      placeholder="$0.00"
                      prefix="$"
                    />
                  </div>
                  {isInvalid && field.state.meta.errors.length > 0 && (
                    <p className="text-sm text-red-500">
                      {field.state.meta.errors.map(formatError).join(", ")}
                    </p>
                  )}
                </div>
              )
            }}
          />

          {/* Category */}
          <form.Field
            name="category"
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <div className="space-y-2">
                  <Label>Category</Label>
                  <SingleSelector
                    value={
                      CATEGORIES.find((opt) => opt.value === field.state.value) ||
                      field.state.value
                        ? { value: field.state.value, label: field.state.value }
                        : undefined
                    }
                    onChange={(option) => field.handleChange(option.value)}
                    options={CATEGORIES}
                    placeholder="Select or type a category"
                    creatable
                    disabled={isScanning}
                  />
                  {isInvalid && field.state.meta.errors.length > 0 && (
                    <p className="text-sm text-red-500">
                      {field.state.meta.errors.map(formatError).join(", ")}
                    </p>
                  )}
                </div>
              )
            }}
          />

          {/* Date */}
          <form.Field
            name="date"
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <div className="space-y-2 flex flex-col">
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          "w-full text-left font-normal border-input hover:bg-input/50 rounded-lg border bg-transparent py-2 pr-2 pl-2.5 text-sm transition-colors flex items-center justify-between",
                          !field.state.value && "text-muted-foreground",
                        )}>
                        {field.state.value ? (
                          format(field.state.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <Calendar className="ml-auto h-4 w-4 opacity-50" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0"
                      align="start">
                      <CalendarComponent
                        mode="single"
                        selected={field.state.value}
                        onSelect={(date) => {
                          console.log(date)
                          if (date) field.handleChange(date) // This updates the form value
                        }}
                        disabled={(date) => date < new Date("2023-01-01")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {isInvalid && field.state.meta.errors.length > 0 && (
                    <p className="text-sm text-red-500">
                      {field.state.meta.errors.map(formatError).join(", ")}
                    </p>
                  )}
                </div>
              )
            }}
          />

          {/* Payment Method */}
          <form.Field
            name="paymentMethod"
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

              return (
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(value) => {
                      field.handleChange(value)
                    }}
                    disabled={isScanning}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent align="center">
                      <SelectGroup>
                        {PAYMENT_METHODS.map((method) => (
                          <SelectItem
                            key={method.value}
                            value={method.value}>
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {isInvalid && field.state.meta.errors.length > 0 && (
                    <p className="text-sm text-red-500">
                      {field.state.meta.errors.map(formatError).join(", ")}
                    </p>
                  )}
                </div>
              )
            }}
          />

          <form.Field
            name="isRecurring"
            children={(field) => {
              return (
                <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label className="text-[14.5px]">Recurring Transaction</Label>
                    <p className="text-xs text-muted-foreground">
                      {field.state.value
                        ? "This will repeat automatically"
                        : "Set recurring to repeat this transaction"}
                    </p>
                  </div>
                  <Switch
                    disabled={isScanning}
                    checked={field.state.value}
                    className="cursor-pointer"
                    onCheckedChange={(checked) => {
                      field.handleChange(checked)
                      if (checked) {
                        form.setFieldValue("frequency", _TRANSACTION_FREQUENCY.DAILY)
                      } else {
                        form.setFieldValue("frequency", null)
                      }
                    }}
                  />
                </div>
              )
            }}
          />

          <form.Field
            name="isRecurring"
            children={(recurringField) => {
              if (!recurringField.state.value) return null
              return (
                <form.Field
                  name="frequency"
                  children={(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <div className="space-y-2 recurring-control">
                        <Label>Frequency</Label>
                        <Select
                          value={field.state.value ?? undefined}
                          onValueChange={(value) =>
                            field.handleChange(
                              value as "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | null,
                            )
                          }
                          disabled={isScanning}>
                          <SelectTrigger className="w-full">
                            <SelectValue
                              placeholder="Select frequency"
                              className="capitalize!"
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {frequencyOptions.map(({ value, label }) => (
                                <SelectItem
                                  key={value}
                                  value={value}
                                  className="capitalize!">
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        {isInvalid && field.state.meta.errors.length > 0 && (
                          <p className="text-sm text-red-500">
                            {field.state.meta.errors.map(formatError).join(", ")}
                          </p>
                        )}
                      </div>
                    )
                  }}
                />
              )
            }}
          />
          {/* Description */}
          <form.Field
            name="description"
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Description (Optional)</Label>
                  <Textarea
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Add notes about this transaction"
                    className="resize-none"
                    disabled={isScanning}
                  />
                  {isInvalid && field.state.meta.errors.length > 0 && (
                    <p className="text-sm text-red-500">
                      {field.state.meta.errors.map(formatError).join(", ")}
                    </p>
                  )}
                </div>
              )
            }}
          />
        </div>

        <div className="sticky bottom-0 bg-white dark:bg-background pb-2">
          <Button
            type="submit"
            className="w-full text-white!"
            disabled={isScanning || createTransactionMutation.isPending}>
            {createTransactionMutation.isPending
              ? "Creating..."
              : isEdit
                ? "Update"
                : "Save"}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default TransactionForm
