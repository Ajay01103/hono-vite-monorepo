import { useTypedSelector } from "~/hooks/useTypedSelector"
import DashboardHeader from "./dashboard-heaader"
import DashboardStats from "./dashboard-stats"
import type { DateRangeType } from "../date-range-select"

const DashboardSummary = ({
  dateRange,
  setDateRange,
}: {
  dateRange?: DateRangeType
  setDateRange?: (range: DateRangeType) => void
}) => {
  const { user } = useTypedSelector((state) => state.auth)

  return (
    <div className="w-full">
      <DashboardHeader
        title={`Welcome back, ${user?.name || "Alex"}`}
        subtitle="This is your overview report for the selected period"
        dateRange={dateRange}
        setDateRange={setDateRange}
      />
      <DashboardStats dateRange={dateRange} />
    </div>
  )
}

export default DashboardSummary
