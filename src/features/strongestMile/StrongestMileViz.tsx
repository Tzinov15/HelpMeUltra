import { useRef, useEffect, useMemo } from 'react'
import * as d3 from 'd3'
import { format } from 'date-fns'
import { useActivities } from '@/features/activities/hooks/useActivities'
import { useStrongestMile, type StrongestMileEntry } from './hooks/useStrongestMile'
import { formatPace } from '@/lib/strava/formatters'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { detailCache } from '@/lib/stravaCache'
import type { DetailPreloadState } from './hooks/useDetailPreloader'

interface Props {
  detailProgress: DetailPreloadState | null
}

export function StrongestMileViz({ detailProgress }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const { data: activities } = useActivities()

  // Read from detailCache — recomputes whenever detailProgress changes,
  // which happens as the preloader (running in DashboardPage) fills the cache.
  const detailedActivities = useMemo(() => {
    if (!activities) return []
    return activities
      .filter((a) => ['Run', 'TrailRun'].includes(a.sport_type) && a.distance > 1609.344)
      .flatMap((a) => {
        const detail = detailCache.get(a.id)
        return detail ? [{ activity: detail }] : []
      })
  // detailProgress is the tick that causes this to re-evaluate as cache fills
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activities, detailProgress])

  const entries = useStrongestMile(detailedActivities)

  useEffect(() => {
    if (!entries.length || !svgRef.current) return

    const el = svgRef.current
    const { width } = el.getBoundingClientRect()
    const height = 420
    const margin = { top: 30, right: 30, bottom: 60, left: 65 }
    const innerW = width - margin.left - margin.right
    const innerH = height - margin.top - margin.bottom

    d3.select(el).selectAll('*').remove()

    const svg = d3
      .select(el)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    const gapExtent = d3.extent(entries, (d) => d.gapSecPerMile) as [number, number]
    const elevExtent = d3.extent(entries, (d) => d.elevGainFt) as [number, number]
    const scoreExtent = d3.extent(entries, (d) => d.score) as [number, number]
    const hrExtent = d3.extent(entries.filter((d) => d.avgHR), (d) => d.avgHR!) as [number, number]

    const x = d3.scaleLinear().domain([gapExtent[1] * 1.05, gapExtent[0] * 0.95]).range([0, innerW])
    const y = d3.scaleLinear().domain([0, elevExtent[1] * 1.1]).range([innerH, 0])
    const r = d3.scaleSqrt().domain(scoreExtent).range([4, 18])
    const color = d3.scaleSequential(d3.interpolateRdYlGn).domain([hrExtent[1], hrExtent[0]])

    // Grid
    svg.append('g')
      .call(d3.axisLeft(y).ticks(5).tickSize(-innerW).tickFormat(() => ''))
      .call((g) => { g.select('.domain').remove(); g.selectAll('line').attr('stroke', '#DBC292').attr('stroke-dasharray', '3,3').attr('opacity', 0.7) })
    svg.append('g').attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(x).ticks(6).tickSize(-innerH).tickFormat(() => ''))
      .call((g) => { g.select('.domain').remove(); g.selectAll('line').attr('stroke', '#DBC292').attr('stroke-dasharray', '3,3').attr('opacity', 0.7) })

    // Dots
    svg.selectAll('circle')
      .data(entries)
      .join('circle')
      .attr('cx', (d) => x(d.gapSecPerMile))
      .attr('cy', (d) => y(d.elevGainFt))
      .attr('r', (d) => r(d.score))
      .attr('fill', (d) => (d.avgHR ? color(d.avgHR) : '#94a3b8'))
      .attr('fill-opacity', 0.75)
      .attr('stroke', (d) => (d.isPR ? '#fbbf24' : 'transparent'))
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseover', (event: MouseEvent, d: StrongestMileEntry) => {
        const tooltip = tooltipRef.current
        if (!tooltip) return
        const ev = event as MouseEvent & { offsetX: number; offsetY: number }
        tooltip.style.display = 'block'
        tooltip.style.left = `${ev.offsetX + 12}px`
        tooltip.style.top = `${ev.offsetY - 10}px`
        tooltip.innerHTML = `
          <div class="font-semibold text-xs mb-1" style="color:#3D4A1A">${d.activityName}</div>
          <div class="text-xs" style="color:#8B9953">${format(d.date, 'MMM d, yyyy')}</div>
          <div class="mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
            <span style="color:#8B9953">Pace:</span><span style="color:#566827">${formatPace(d.paceSecPerMile)}</span>
            <span style="color:#8B9953">GAP:</span><span class="text-emerald-600">${formatPace(d.gapSecPerMile)}</span>
            <span style="color:#8B9953">Vert:</span><span style="color:#566827">${Math.round(d.elevGainFt).toLocaleString()} ft</span>
            ${d.avgHR ? `<span style="color:#8B9953">HR:</span><span class="text-red-500">${Math.round(d.avgHR)} bpm</span>` : ''}
            <span style="color:#8B9953">Score:</span><span class="text-yellow-600">${d.score.toFixed(2)}</span>
          </div>
          ${d.isPR ? '<div class="mt-1 text-yellow-600 text-xs">⭐ PR</div>' : ''}
        `
      })
      .on('mouseleave', () => { if (tooltipRef.current) tooltipRef.current.style.display = 'none' })

    // Axes
    svg.append('g').attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(x).ticks(6).tickFormat((d) => formatPace(d as number)))
      .call((g) => {
        g.select('.domain').attr('stroke', '#8B9953')
        g.selectAll('text').attr('fill', '#566827').attr('font-size', '10px').attr('transform', 'rotate(-20)').attr('text-anchor', 'end')
        g.selectAll('line').attr('stroke', '#8B9953')
      })
    svg.append('g')
      .call(d3.axisLeft(y).ticks(5).tickFormat((d) => `${((d as number) / 1000).toFixed(1)}k ft`))
      .call((g) => { g.select('.domain').remove(); g.selectAll('text').attr('fill', '#566827').attr('font-size', '11px'); g.selectAll('line').remove() })

    svg.append('text').attr('x', innerW / 2).attr('y', innerH + 52).attr('text-anchor', 'middle')
      .attr('fill', '#8B9953').attr('font-size', '11px').text('← Slower   Grade Adjusted Pace   Faster →')
    svg.append('text').attr('transform', 'rotate(-90)').attr('x', -innerH / 2).attr('y', -50)
      .attr('text-anchor', 'middle').attr('fill', '#8B9953').attr('font-size', '11px').text('Activity Elevation Gain (ft)')

  }, [entries])

  const isLoading = detailProgress !== null && !detailProgress.done
  const totalRuns = activities?.filter(
    (a) => ['Run', 'TrailRun'].includes(a.sport_type) && a.distance > 1609.344
  ).length ?? 0

  return (
    <div className="p-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-hmu-secondary dark:text-gray-400">
            Strongest Mile Efforts
          </h3>
          <p className="mt-1 text-xs text-hmu-secondary dark:text-gray-500">
            Best 1-mile efforts from runs · Size = strength score · Color = avg HR (green=low, red=high) · Gold ring = PR
          </p>
        </div>
        <div className="text-right text-xs text-hmu-secondary dark:text-gray-600 shrink-0 ml-4">
          {isLoading && detailProgress && (
            <span>Loading {detailProgress.loaded}/{detailProgress.total} runs…</span>
          )}
          {detailProgress?.done && (
            <span>{detailedActivities.length}/{totalRuns} runs loaded</span>
          )}
        </div>
      </div>

      {isLoading && detailProgress && (
        <div className="mb-4 w-full rounded-full bg-hmu-tertiary dark:bg-gray-800 h-1">
          <div
            className="rounded-full bg-hmu-primary dark:bg-orange-500 h-1 transition-all duration-300"
            style={{ width: `${detailProgress.total ? (detailProgress.loaded / detailProgress.total) * 100 : 0}%` }}
          />
        </div>
      )}

      {entries.length === 0 && !isLoading && (
        <div className="flex items-center justify-center h-48 text-hmu-secondary dark:text-gray-600">
          {detailedActivities.length === 0
            ? <LoadingSpinner />
            : <p className="text-sm">No 1-mile best efforts found in your runs.</p>
          }
        </div>
      )}

      {entries.length > 0 && (
        <>
          <div className="relative">
            <svg ref={svgRef} className="w-full" />
            <div
              ref={tooltipRef}
              className="pointer-events-none absolute hidden rounded-lg border border-hmu-tertiary dark:border-gray-700 bg-hmu-surface dark:bg-gray-900 p-3 shadow-xl"
              style={{ minWidth: '180px' }}
            />
          </div>

          <div className="mt-6">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-hmu-secondary dark:text-gray-500">
              Top 10 Strongest Miles
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-hmu-tertiary dark:border-gray-800 text-hmu-secondary dark:text-gray-500">
                    <th className="text-left py-2 pr-4">Activity</th>
                    <th className="text-left py-2 pr-4">Date</th>
                    <th className="text-right py-2 pr-4">Pace</th>
                    <th className="text-right py-2 pr-4">GAP</th>
                    <th className="text-right py-2 pr-4">Vert</th>
                    <th className="text-right py-2 pr-4">HR</th>
                    <th className="text-right py-2">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.slice(0, 10).map((e, i) => (
                    <tr key={e.activityId} className="border-b border-hmu-tertiary dark:border-gray-800 text-hmu-primary dark:text-gray-300 hover:bg-hmu-surface-alt dark:hover:bg-gray-800">
                      <td className="py-2 pr-4 text-hmu-primary dark:text-white">
                        {i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : i === 2 ? '🥉 ' : `${i + 1}. `}
                        {e.activityName}
                        {e.isPR && <span className="ml-1 text-yellow-400">⭐</span>}
                      </td>
                      <td className="py-2 pr-4">{format(e.date, 'MMM d, yy')}</td>
                      <td className="py-2 pr-4 text-right font-mono">{formatPace(e.paceSecPerMile)}</td>
                      <td className="py-2 pr-4 text-right font-mono text-emerald-400">{formatPace(e.gapSecPerMile)}</td>
                      <td className="py-2 pr-4 text-right">{Math.round(e.elevGainFt).toLocaleString()} ft</td>
                      <td className="py-2 pr-4 text-right text-red-400">{e.avgHR ? `${Math.round(e.avgHR)} bpm` : '—'}</td>
                      <td className="py-2 text-right font-semibold text-yellow-400">{e.score.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
