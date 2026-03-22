import { startOfWeek, format, subYears, getISOWeek, getYear } from 'date-fns'

export function oneYearAgoEpoch(): number {
  return Math.floor(subYears(new Date(), 1).getTime() / 1000)
}

export function weekKey(date: Date): string {
  return `${getYear(date)}-W${getISOWeek(date).toString().padStart(2, '0')}`
}

export function weekLabel(date: Date): string {
  const start = startOfWeek(date, { weekStartsOn: 1 })
  return format(start, 'MMM d')
}

export function epochToDate(epoch: number): Date {
  return new Date(epoch * 1000)
}
