import { useRef, useEffect } from 'react'
import * as d3 from 'd3'
import { useActivities } from '@/features/activities/hooks/useActivities'
import { useWeeklyStats } from './hooks/useWeeklyStats'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export function WeeklyMileageChart() {
  const svgRef = useRef<SVGSVGElement>(null)
  const { data: activities, isLoading } = useActivities()
  const weeks = useWeeklyStats(activities)

  useEffect(() => {
    if (!weeks.length || !svgRef.current) return

    const el = svgRef.current
    const { width } = el.getBoundingClientRect()
    const height = 280
    const margin = { top: 20, right: 20, bottom: 60, left: 45 }
    const innerW = width - margin.left - margin.right
    const innerH = height - margin.top - margin.bottom

    d3.select(el).selectAll('*').remove()

    const svg = d3
      .select(el)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Show last 52 weeks for readability
    const recentWeeks = weeks.slice(-52)
    const maxMiles = d3.max(recentWeeks, (w) => w.runMiles + w.rideMiles) ?? 10

    const x = d3
      .scaleBand()
      .domain(recentWeeks.map((w) => w.key))
      .range([0, innerW])
      .padding(0.15)
    const y = d3.scaleLinear().domain([0, maxMiles * 1.1]).range([innerH, 0])

    // Gridlines
    svg
      .append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(y).ticks(5).tickSize(-innerW).tickFormat(() => ''))
      .call((g) => {
        g.select('.domain').remove()
        g.selectAll('line').attr('stroke', '#DBC292').attr('stroke-dasharray', '3,3').attr('opacity', 0.6)
      })

    // Run bars (orange)
    svg
      .selectAll('.bar-run')
      .data(recentWeeks)
      .join('rect')
      .attr('class', 'bar-run')
      .attr('x', (d) => x(d.key)!)
      .attr('y', (d) => y(d.runMiles))
      .attr('width', x.bandwidth())
      .attr('height', (d) => innerH - y(d.runMiles))
      .attr('fill', '#f97316')
      .attr('rx', 1)

    // Ride bars stacked on top (blue)
    svg
      .selectAll('.bar-ride')
      .data(recentWeeks)
      .join('rect')
      .attr('class', 'bar-ride')
      .attr('x', (d) => x(d.key)!)
      .attr('y', (d) => y(d.runMiles + d.rideMiles))
      .attr('width', x.bandwidth())
      .attr('height', (d) => y(d.runMiles) - y(d.runMiles + d.rideMiles))
      .attr('fill', '#60a5fa')
      .attr('rx', 1)

    // Rolling 4-week average line for total mileage
    const rollingAvg = recentWeeks.map((w, i, arr) => {
      const slice = arr.slice(Math.max(0, i - 3), i + 1)
      const avg = d3.mean(slice, (d) => d.runMiles + d.rideMiles) ?? 0
      return { key: w.key, avg }
    })

    const line = d3
      .line<{ key: string; avg: number }>()
      .x((d) => (x(d.key) ?? 0) + x.bandwidth() / 2)
      .y((d) => y(d.avg))
      .curve(d3.curveMonotoneX)

    svg
      .append('path')
      .datum(rollingAvg)
      .attr('fill', 'none')
      .attr('stroke', '#8B9953')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,2')
      .attr('opacity', 0.6)
      .attr('d', line)

    // X axis — only show every 4th week label
    svg
      .append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(
        d3
          .axisBottom(x)
          .tickValues(recentWeeks.filter((_, i) => i % 4 === 0).map((w) => w.key))
          .tickFormat((d) => {
            const w = recentWeeks.find((wk) => wk.key === d)
            return w ? w.label : d
          })
      )
      .call((g) => {
        g.select('.domain').attr('stroke', '#8B9953')
        g.selectAll('text')
          .attr('fill', '#566827')
          .attr('font-size', '11px')
          .attr('transform', 'rotate(-30)')
          .attr('text-anchor', 'end')
        g.selectAll('line').attr('stroke', '#8B9953')
      })

    // Y axis
    svg
      .append('g')
      .call(d3.axisLeft(y).ticks(5).tickFormat((d) => `${d}mi`))
      .call((g) => {
        g.select('.domain').remove()
        g.selectAll('text').attr('fill', '#566827').attr('font-size', '11px')
        g.selectAll('line').remove()
      })

    // Legend
    const legend = svg.append('g').attr('transform', `translate(${innerW - 160}, ${-10})`)
    const items = [
      { color: '#f97316', label: 'Run' },
      { color: '#60a5fa', label: 'Ride' },
      { color: '#e2e8f0', label: '4wk avg', dashed: true },
    ]
    items.forEach((item, i) => {
      legend
        .append('rect')
        .attr('x', i * 55)
        .attr('y', 0)
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', item.color)
        .attr('rx', 2)
      legend
        .append('text')
        .attr('x', i * 55 + 16)
        .attr('y', 10)
        .attr('fill', '#566827')
        .attr('font-size', '11px')
        .text(item.label)
    })
  }, [weeks])

  // ResizeObserver to redraw on width change
  useEffect(() => {
    if (!svgRef.current) return
    const observer = new ResizeObserver(() => {
      if (weeks.length) {
        // Re-trigger by dispatching a synthetic resize — handled by the weeks effect
        svgRef.current?.dispatchEvent(new Event('resize'))
      }
    })
    observer.observe(svgRef.current)
    return () => observer.disconnect()
  }, [weeks])

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )

  return (
    <div className="w-full">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-hmu-secondary dark:text-gray-400">
        Weekly Mileage — Last 52 Weeks
      </h3>
      <svg ref={svgRef} className="w-full" />
    </div>
  )
}
