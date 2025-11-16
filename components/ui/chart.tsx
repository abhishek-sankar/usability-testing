import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ChartConfig {
  [key: string]: {
    label?: string
    color?: string
  }
}

const ChartContext = React.createContext<{ config: ChartConfig }>({
  config: {},
})

export function ChartContainer({
  config,
  children,
  className,
}: React.HTMLAttributes<HTMLDivElement> & { config: ChartConfig }) {
  return (
    <ChartContext.Provider value={{ config }}>
      <div className={cn('flex h-full w-full flex-col', className)}>{children}</div>
    </ChartContext.Provider>
  )
}

export function useChartConfig() {
  const context = React.useContext(ChartContext)
  if (!context) {
    throw new Error('useChartConfig must be used within a ChartContainer')
  }
  return context
}

export function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean
  payload?: ReadonlyArray<any>
  label?: string | number
  formatter?: (value: any) => React.ReactNode
}) {
  if (!active || !payload || !payload.length) {
    return null
  }

  const displayLabel = label != null ? String(label) : undefined

  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-sm shadow-sm">
      {displayLabel && <p className="font-medium">{displayLabel}</p>}
      <div className="flex flex-col gap-1 mt-1">
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center gap-2 text-muted-foreground">
            <span
              className="block h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.fill || entry.color }}
            />
            <span>
              {formatter ? formatter(entry.value) : entry.value}{' '}
              {entry.name && <span className="text-xs">({entry.name})</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

