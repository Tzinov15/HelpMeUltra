import { parseISO, startOfWeek, format, subYears, getISOWeek, getYear } from 'date-fns'

export function oneYearAgoEpoch(): number {
  return Math.floor(subYears(new Date(), 1).getTime() / 1000)
}

// Strava ships start_date_local with a misleading "Z" suffix even though the
// value represents local time at the activity's location, not UTC. Parsing it
// as UTC then converting to the browser's timezone shifts early-morning /
// late-night activities into the wrong day and the wrong week. Strip the Z so
// the value is interpreted as a naive local timestamp.
export function parseLocalDate(s: string): Date {
  return parseISO(s.replace(/Z$/, ''))
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
