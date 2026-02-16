import { DateRangeSelect, type DateRangeType } from "~/components/date-range-select"
import AddTransactionDrawer from "../transctions/add-transaction-drawer"

interface Props {
  title: string
  subtitle: string
  dateRange?: DateRangeType
  setDateRange?: (range: DateRangeType) => void
}

const DashboardHeader = ({ title, subtitle, dateRange, setDateRange }: Props) => {
  return (
    <div className="flex flex-col items-start justify-between space-y-7 px-4 lg:flex-row">
      <div className="space-y-1">
        <h2 className="font-medium text-2xl lg:text-4xl">{title}</h2>
        <p className="text-sm text-white/60">{subtitle}</p>
      </div>
      <div className="mb-6 flex justify-end gap-4">
        <DateRangeSelect
          dateRange={dateRange || null}
          setDateRange={(range) => setDateRange?.(range)}
        />
        <AddTransactionDrawer />
      </div>
    </div>
  )
}

export default DashboardHeader
