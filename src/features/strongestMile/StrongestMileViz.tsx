import { useRef, useEffect, useState, useCallback } from 'react'
import * as d3 from 'd3'
import { format } from 'date-fns'
import { useActivities } from '@/features/activities/hooks/useActivities'
import { useStrongestMile, type StrongestMileEntry } from './hooks/useStrongestMile'
import { formatPace } from '@/lib/strava/formatters'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { axiosInstance } from '@/api/client'
import type { DetailedActivity } from '@/features/activities/hooks/useActivityDetail'

export function StrongestMileViz() {
  const svgRef = useRef<SVGSVGElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const { data: activities } = useActivities()
  const [detailedActivities, setDetailedActivities] = useState<Array<{ activity: DetailedActivity }>>([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState({ loaded: 0, total: 0 })

  const runActivities =
    activities?.filter(
      (a) => ['Run', 'TrailRun'].includes(a.sport_type) && a.distance > 1609.344
    ) ?? []

  const loadDetails = useCallback(async () => {
    if (!runActivities.length) return
    setLoading(true)
    setProgress({ loaded: 0, total: runActivities.length })

    const results: Array<{ activity: DetailedActivity }> = []
    const batchSize = 5

    for (let i = 0; i < runActivities.length; i += batchSize) {
      const batch = runActivities.slice(i, i + batchSize)
      const detailPromises = batch.map((a) =>
        axiosInstance
          .get<DetailedActivity>(`/activities/${a.id}`, {
            params: { include_all_efforts: true },
          })
          .then((r) => ({ activity: r.data }))
          .catch(() => null)
      )
      const settled = await Promise.all(detailPromises)
      results.push(
        ...(settled.filter(Boolean) as Array<{ activity: DetailedActivity }>)
      )
      setProgress({
        loaded: Math.min(i + batchSize, runActivities.length),
        total: runActivities.length,
      })
      // Rate limit respect
      await new Promise((r) => setTimeout(r, 200))
    }

    setDetailedActivities(results)
    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activities])

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
    const hrExtent = d3.extent(
      entries.filter((d) => d.avgHR),
      (d) => d.avgHR!
    ) as [number, number]

    // Scales — faster pace (lower GAP) on right
    const x = d3
      .scaleLinear()
      .domain([gapExtent[1] * 1.05, gapExtent[0] * 0.95])
      .range([0, innerW])
    const y = d3
      .scaleLinear()
      .domain([0, elevExtent[1] * 1.1])
      .range([innerH, 0])
    const r = d3.scaleSqrt().domain(scoreExtent).range([4, 18])
    const color = d3
      .scaleSequential(d3.interpolateRdYlGn)
      .domain([hrExtent[1], hrExtent[0]])

    // Gridlines
    svg
      .append('g')
      .call(
        d3
          .axisLeft(y)
          .ticks(5)
          .tickSize(-innerW)
          .tickFormat(() => '')
      )
      .call((g) => {
        g.select('.domain').remove()
        g.selectAll('line').attr('stroke', '#374151').attr('stroke-dasharray', '3,3')
      })
    svg
      .append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(
        d3
          .axisBottom(x)
          .ticks(6)
          .tickSize(-innerH)
          .tickFormat(() => '')
      )
      .call((g) => {
        g.select('.domain').remove()
        g.selectAll('line').attr('stroke', '#374151').attr('stroke-dasharray', '3,3')
      })

    // Dots
    svg
      .selectAll('circle')
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
        tooltip.style.display = 'block'
        tooltip.style.left = `${(event as MouseEvent & { offsetX: number }).offsetX + 12}px`
        tooltip.style.top = `${(event as MouseEvent & { offsetY: number }).offsetY - 10}px`
        tooltip.innerHTML = `
          <div class="font-semibold text-white text-xs mb-1">${d.activityName}</div>
          <div class="text-gray-400 text-xs">${format(d.date, 'MMM d, yyyy')}</div>
          <div class="mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
            <span class="text-gray-400">Pace:</span><span class="text-white">${formatPace(d.paceSecPerMile)}</span>
            <span class="text-gray-400">GAP:</span><span class="text-emerald-400">${formatPace(d.gapSecPerMile)}</span>
            <span class="text-gray-400">Vert:</span><span class="text-white">${Math.round(d.elevGainFt).toLocaleString()} ft</span>
            ${d.avgHR ? `<span class="text-gray-400">HR:</span><span class="text-red-400">${Math.round(d.avgHR)} bpm</span>` : ''}
            <span class="text-gray-400">Score:</span><span class="text-yellow-400">${d.score.toFixed(2)}</span>
          </div>
          ${d.isPR ? '<div class="mt-1 text-yellow-400 text-xs">⭐ PR</div>' : ''}
        `
      })
      .on('mouseleave', () => {
        if (tooltipRef.current) tooltipRef.current.style.display = 'none'
      })

    // Axes
    svg
      .append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(
        d3
          .axisBottom(x)
          .ticks(6)
          .tickFormat((d) => formatPace(d as number))
      )
      .call((g) => {
        g.select('.domain').attr('stroke', '#4b5563')
        g.selectAll('text')
          .attr('fill', '#9ca3af')
          .attr('font-size', '10px')
          .attr('transform', 'rotate(-20)')
          .attr('text-anchor', 'end')
        g.selectAll('line').attr('stroke', '#4b5563')
      })

    svg
      .append('g')
      .call(
        d3
          .axisLeft(y)
          .ticks(5)
          .tickFormat((d) => `${((d as number) / 1000).toFixed(1)}k ft`)
      )
      .call((g) => {
        g.select('.domain').remove()
        g.selectAll('text').attr('fill', '#9ca3af').attr('font-size', '11px')
        g.selectAll('line').remove()
      })

    // Axis labels
    svg
      .append('text')
      .attr('x', innerW / 2)
      .attr('y', innerH + 52)
      .attr('text-anchor', 'middle')
      .attr('fill', '#6b7280')
      .attr('font-size', '11px')
      .text('← Slower   Grade Adjusted Pace   Faster →')

    svg
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerH / 2)
      .attr('y', -50)
      .attr('text-anchor', 'middle')
      .attr('fill', '#6b7280')
      .attr('font-size', '11px')
      .text('Activity Elevation Gain (ft)')
  }, [entries])

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
            Strongest Mile Efforts
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            Best 1-mile efforts from runs • Size = strength score • Color = avg HR (green=low,
            red=high) • Gold ring = PR
          </p>
        </div>
        {!detailedActivities.length && !loading && (
          <button
            onClick={loadDetails}
            className="rounded bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-500 transition-colors"
          >
            Load Best Efforts ({runActivities.length} runs)
          </button>
        )}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-gray-400">
            Loading {progress.loaded} / {progress.total} activities…
          </p>
          <div className="w-64 rounded-full bg-gray-700 h-2">
            <div
              className="rounded-full bg-orange-500 h-2 transition-all"
              style={{
                width: `${progress.total ? (progress.loaded / progress.total) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      )}

      {!loading && entries.length === 0 && detailedActivities.length > 0 && (
        <p className="py-10 text-center text-sm text-gray-500">
          No 1-mile best efforts found. Make sure you have run activities with best efforts
          recorded.
        </p>
      )}

      {!loading && !detailedActivities.length && (
        <div className="flex items-center justify-center h-64 text-gray-600">
          <p className="text-sm">
            Click "Load Best Efforts" to visualize your strongest mile efforts
          </p>
        </div>
      )}

      {entries.length > 0 && (
        <div className="relative">
          <svg ref={svgRef} className="w-full" />
          <div
            ref={tooltipRef}
            className="pointer-events-none absolute hidden rounded-lg border border-gray-700 bg-gray-900 p-3 shadow-xl"
            style={{ minWidth: '180px' }}
          />
        </div>
      )}

      {entries.length > 0 && (
        <div className="mt-4">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Top 10 Strongest Miles
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 border-b border-gray-800">
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
                  <tr
                    key={e.activityId}
                    className="border-b border-gray-800 text-gray-300 hover:bg-gray-800"
                  >
                    <td className="py-2 pr-4 text-white">
                      {i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : i === 2 ? '🥉 ' : `${i + 1}. `}
                      {e.activityName}
                      {e.isPR && <span className="ml-1 text-yellow-400">⭐</span>}
                    </td>
                    <td className="py-2 pr-4">{format(e.date, 'MMM d, yy')}</td>
                    <td className="py-2 pr-4 text-right font-mono">
                      {formatPace(e.paceSecPerMile)}
                    </td>
                    <td className="py-2 pr-4 text-right font-mono text-emerald-400">
                      {formatPace(e.gapSecPerMile)}
                    </td>
                    <td className="py-2 pr-4 text-right">
                      {Math.round(e.elevGainFt).toLocaleString()} ft
                    </td>
                    <td className="py-2 pr-4 text-right text-red-400">
                      {e.avgHR ? `${Math.round(e.avgHR)} bpm` : '—'}
                    </td>
                    <td className="py-2 text-right text-yellow-400 font-semibold">
                      {e.score.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
