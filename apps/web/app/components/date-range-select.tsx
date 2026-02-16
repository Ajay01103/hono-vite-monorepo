import { format, startOfMonth, startOfYear, subDays, subMonths, subYears } from "date-fns"
import { ChevronDownIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "~/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover"
import { cn } from "~/lib/utils"

export const DateRangeEnum = {
  LAST_30_DAYS: "30days",
  LAST_MONTH: "lastMonth",
  LAST_3_MONTHS: "last3Months",
  LAST_YEAR: "lastYear",
  THIS_MONTH: "thisMonth",
  THIS_YEAR: "thisYear",
  ALL_TIME: "allTime",
  CUSTOM: "custom",
} as const

export type DateRangeEnumType = (typeof DateRangeEnum)[keyof typeof DateRangeEnum]

export type DateRangeType = {
  from: Date | null
  to: Date | null
  value?: string
  label: string
} | null

type DateRangePreset = {
  label: string
  value: string
  getRange: () => DateRangeType
}

interface DateRangeSelectProps {
  dateRange: DateRangeType
  setDateRange: (range: DateRangeType) => void
  defaultRange?: DateRangeEnumType
}

const today = new Date()
const yesterday = subDays(today, 1)

const presets: DateRangePreset[] = [
  {
    label: "Last 30 Days",
    value: DateRangeEnum.LAST_30_DAYS,
    getRange: () => ({
      from: subDays(yesterday, 29),
      to: yesterday,
      value: DateRangeEnum.LAST_30_DAYS,
      label: "for Past 30 Days",
    }),
  },
  {
    label: "Last Month",
    value: DateRangeEnum.LAST_MONTH,
    getRange: () => ({
      from: startOfMonth(subMonths(today, 1)),
      to: startOfMonth(today),
      value: DateRangeEnum.LAST_MONTH,
      label: "for Last Month",
    }),
  },
  {
    label: "Last 3 Months",
    value: DateRangeEnum.LAST_3_MONTHS,
    getRange: () => ({
      from: startOfMonth(subMonths(today, 3)),
      to: startOfMonth(today),
      value: DateRangeEnum.LAST_3_MONTHS,
      label: "for Past 3 Months",
    }),
  },
  {
    label: "Last Year",
    value: DateRangeEnum.LAST_YEAR,
    getRange: () => ({
      from: startOfYear(subYears(today, 1)),
      to: startOfYear(today),
      value: DateRangeEnum.LAST_YEAR,
      label: "for Past Year",
    }),
  },
  {
    label: "This Month",
    value: DateRangeEnum.THIS_MONTH,
    getRange: () => ({
      from: startOfMonth(today),
      to: today,
      value: DateRangeEnum.THIS_MONTH,
      label: "for This Month",
    }),
  },
  {
    label: "This Year",
    value: DateRangeEnum.THIS_YEAR,
    getRange: () => ({
      from: startOfYear(today),
      to: today,
      value: DateRangeEnum.THIS_YEAR,
      label: "for This Year",
    }),
  },
  {
    label: "All Time",
    value: DateRangeEnum.ALL_TIME,
    getRange: () => ({
      from: null,
      to: null,
      value: DateRangeEnum.ALL_TIME,
      label: "across All Time",
    }),
  },
]

export const DateRangeSelect = ({
  dateRange,
  setDateRange,
  defaultRange = DateRangeEnum.LAST_30_DAYS,
}: DateRangeSelectProps) => {
  const [open, setOpen] = useState(false)

  const displayText = dateRange
    ? presets.find((p) => p.value === dateRange.value)?.label ||
      (dateRange.from
        ? `${format(dateRange.from, "MMM dd, y")} - ${
            dateRange.to ? format(dateRange.to, "MMM dd, y") : "Present"
          }`
        : "Select a duration")
    : "Select a duration"

  // Set default range on initial render
  useEffect(() => {
    if (!dateRange) {
      const defaultPreset = presets.find((p) => p.value === defaultRange)
      if (defaultPreset) {
        // console.log(defaultPreset.getRange(),"defaultPreset.getRange()")
        setDateRange(defaultPreset.getRange())
      }
    }
  }, [dateRange, defaultRange, setDateRange])

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "bg-(--secondary-dark-color)! text-white! cursor-pointer! flex w-50 items-center justify-between text-left font-normal hover:bg-input/50 rounded-lg border border-gray-700 py-2 pr-2 pl-2.5 text-sm transition-colors",
          !dateRange && "text-muted-foreground",
        )}>
        {displayText}
        <ChevronDownIcon className="ml-2 h-4 w-4 opacity-50" />
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0"
        align="start">
        <div className="grid py-1">
          {presets.map((preset) => (
            <Button
              key={preset.value}
              variant="ghost"
              className={cn(
                "justify-start text-left",
                dateRange?.value === preset.value && "bg-accent",
              )}
              onClick={() => {
                setDateRange(preset.getRange())
                setOpen(false)
              }}>
              {preset.label}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
