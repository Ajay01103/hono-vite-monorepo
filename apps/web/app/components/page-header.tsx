import { Fragment, type ReactNode } from "react"

interface PageHeaderProps {
  title?: string
  subtitle?: string
  rightAction?: ReactNode
  renderPageHeader?: ReactNode
}

const PageHeader = ({
  title,
  subtitle,
  rightAction,
  renderPageHeader,
}: PageHeaderProps) => {
  return (
    <div className="w-full bg-[#1a1e2a] px-5 pt-4 pb-20 text-white lg:px-0">
      <div className="mx-auto w-full max-w-[var(--max-width)]">
        {renderPageHeader ? (
          <Fragment>{renderPageHeader}</Fragment>
        ) : (
          <div className="flex w-full flex-col items-start justify-start gap-3 lg:flex-row lg:items-center lg:justify-between">
            {(title || subtitle) && (
              <div className="space-y-1">
                {title && <h2 className="font-medium text-2xl lg:text-4xl">{title}</h2>}
                {subtitle && <p className="text-sm text-white/60">{subtitle}</p>}
              </div>
            )}
            {rightAction && rightAction}
          </div>
        )}
      </div>
    </div>
  )
}

export default PageHeader
