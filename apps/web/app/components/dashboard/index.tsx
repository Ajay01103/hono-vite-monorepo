import { useState } from "react"
import DashboardSummary from "./dashboard-summary"
import PageLayout from "../page-layout"
import type { DateRangeType } from "../date-range-select"

export const OverView = () => {
  const [dateRange, _setDateRange] = useState<DateRangeType>(null)

  return (
    <div className="flex w-full flex-col">
      {/* Dashboard Summary Overview */}
      <PageLayout
        className="space-y-6"
        renderPageHeader={
          <DashboardSummary
            dateRange={dateRange}
            setDateRange={_setDateRange}
          />
        }>
        <h1>Dashboard Page</h1>
      </PageLayout>
    </div>
  )
}
