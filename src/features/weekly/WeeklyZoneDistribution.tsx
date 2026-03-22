import { useRef, useEffect } from 'react'
import * as d3 from 'd3'
import type { WeekChartPoint } from './hooks/useWeeklyChartData'

const WEEKS = 26
const MARGIN = { top: 16, right: 16, bottom: 64, left: 52 }
const HEIGHT = 260

// Matches HRZoneBar colors exactly
const ZONE_COLORS = ['#94a3b8', '#60a5fa', '#34d399', '#fb923c', '#f87171']
const ZONE_LABELS = ['Z1 Recovery', 'Z2 Aerobic', 'Z3 Tempo', 'Z4 Threshold', 'Z5 Max']

interface Props {
  data: WeekChartPoint[]
}

export function WeeklyZoneDistribution({ data }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    function draw() {
      if (!svgRef.current || !containerRef.current) return
      const weeks = data.slice(-WEEKS)
      if (!weeks.length) return

      const totalW = containerRef.current.clientWidth
      const innerW = totalW - MARGIN.left - MARGIN.right
      const innerH = HEIGHT - MARGIN.top - MARGIN.bottom

      const el = d3.select(svgRef.current)
      el.selectAll('*').remove()
      el.attr('width', totalW).attr('height', HEIGHT)

      const svg = el.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`)

      // Build stacked data: each zone as a layer
      type StackRow = { weekKey: string } & Record<`z${number}`, number>
      const rows: StackRow[] = weeks.map((w) => ({
        weekKey: w.weekKey,
        z0: w.zoneTimes[0] / 3600,
        z1: w.zoneTimes[1] / 3600,
        z2: w.zoneTimes[2] / 3600,
        z3: w.zoneTimes[3] / 3600,
        z4: w.zoneTimes[4] / 3600,
      }))

      const keys = ['z0', 'z1', 'z2', 'z3', 'z4']
      const stacked = d3.stack<StackRow>().keys(keys)(rows)

      const maxH = d3.max(rows, (r) => keys.reduce((s, k) => s + (r[k as keyof StackRow] as number), 0)) ?? 1
      const x = d3.scaleBand().domain(weeks.map((w) => w.weekKey)).range([0, innerW]).padding(0.15)
      const y = d3.scaleLinear().domain([0, maxH * 1.05]).nice().range([innerH, 0])

      // Gridlines
      svg.append('g')
        .call(d3.axisLeft(y).ticks(5).tickSize(-innerW).tickFormat(() => ''))
        .call((g) => {
          g.select('.domain').remove()
          g.selectAll('line').attr('stroke', '#DBC292').attr('stroke-dasharray', '3,3').attr('opacity', 0.5)
        })

      // Stacked bars
      stacked.forEach((layer, zi) => {
        svg.selectAll(`.zone-${zi}`)
          .data(layer)
          .join('rect')
          .attr('class', `zone-${zi}`)
          .attr('x', (d) => x(d.data.weekKey) ?? 0)
          .attr('y', (d) => y(d[1]))
          .attr('height', (d) => y(d[0]) - y(d[1]))
          .attr('width', x.bandwidth())
          .attr('fill', ZONE_COLORS[zi])
          .attr('rx', 1)
          .append('title')
          .text((d) => {
            const hrs = d[1] - d[0]
            const h = Math.floor(hrs)
            const m = Math.round((hrs - h) * 60)
            const label = weeks.find((w) => w.weekKey === d.data.weekKey)?.label ?? d.data.weekKey
            return `${label}\n${ZONE_LABELS[zi]}: ${h > 0 ? `${h}h ` : ''}${m}m`
          })
      })

      // X axis — every 4th week label
      svg.append('g')
        .attr('transform', `translate(0,${innerH})`)
        .call(
          d3.axisBottom(x)
            .tickValues(weeks.filter((_, i) => i % 4 === 0).map((w) => w.weekKey))
            .tickFormat((d) => weeks.find((w) => w.weekKey === d)?.label.split('–')[0] ?? d)
        )
        .call((g) => {
          g.select('.domain').attr('stroke', '#DBC292')
          g.selectAll('text').attr('fill', '#8B9953').attr('font-size', '11px')
            .attr('transform', 'rotate(-25)').attr('text-anchor', 'end').attr('dy', '0.5em')
          g.selectAll('.tick line').attr('stroke', '#DBC292')
        })

      // Y axis — hours
      svg.append('g')
        .call(d3.axisLeft(y).ticks(5).tickFormat((d) => `${d}h`))
        .call((g) => {
          g.select('.domain').remove()
          g.selectAll('text').attr('fill', '#8B9953').attr('font-size', '11px')
          g.selectAll('.tick line').remove()
        })

      // Legend (bottom center)
      const legendG = svg.append('g')
        .attr('transform', `translate(0, ${innerH + 40})`)

      const itemW = 120
      const totalLegendW = ZONE_LABELS.length * itemW
      const legendStartX = (innerW - totalLegendW) / 2

      ZONE_LABELS.forEach((label, i) => {
        const lx = legendStartX + i * itemW
        legendG.append('rect')
          .attr('x', lx).attr('y', 0)
          .attr('width', 10).attr('height', 10)
          .attr('fill', ZONE_COLORS[i]).attr('rx', 2)
        legendG.append('text')
          .attr('x', lx + 14).attr('y', 9)
          .attr('fill', '#8B9953').attr('font-size', '11px')
          .text(label)
      })
    }

    draw()
    const ro = new ResizeObserver(draw)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [data])

  return (
    <div ref={containerRef} className="w-full">
      <svg ref={svgRef} className="w-full overflow-visible" />
    </div>
  )
}
