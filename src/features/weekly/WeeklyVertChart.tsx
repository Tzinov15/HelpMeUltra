import { useRef, useEffect } from 'react'
import * as d3 from 'd3'
import type { WeekChartPoint } from './hooks/useWeeklyChartData'

const WEEKS = 26
const MARGIN = { top: 16, right: 16, bottom: 48, left: 60 }
const HEIGHT = 220

interface Props {
  data: WeekChartPoint[]
}

export function WeeklyVertChart({ data }: Props) {
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

      const maxFt = d3.max(weeks, (w) => w.elevFt) ?? 1000
      const x = d3.scaleBand().domain(weeks.map((w) => w.weekKey)).range([0, innerW]).padding(0.1)
      const y = d3.scaleLinear().domain([0, maxFt * 1.1]).nice().range([innerH, 0])

      // Gridlines
      svg.append('g')
        .call(d3.axisLeft(y).ticks(5).tickSize(-innerW).tickFormat(() => ''))
        .call((g) => {
          g.select('.domain').remove()
          g.selectAll('line').attr('stroke', '#DBC292').attr('stroke-dasharray', '3,3').attr('opacity', 0.5)
        })

      // Area fill
      const area = d3.area<WeekChartPoint>()
        .x((d) => (x(d.weekKey) ?? 0) + x.bandwidth() / 2)
        .y0(innerH)
        .y1((d) => y(d.elevFt))
        .curve(d3.curveMonotoneX)

      svg.append('path')
        .datum(weeks)
        .attr('fill', '#99f6e4')
        .attr('opacity', 0.25)
        .attr('d', area)

      // Line
      const line = d3.line<WeekChartPoint>()
        .x((d) => (x(d.weekKey) ?? 0) + x.bandwidth() / 2)
        .y((d) => y(d.elevFt))
        .curve(d3.curveMonotoneX)

      svg.append('path')
        .datum(weeks)
        .attr('fill', 'none')
        .attr('stroke', '#0d9488')
        .attr('stroke-width', 2)
        .attr('d', line)

      // Dots
      svg.selectAll('.dot')
        .data(weeks)
        .join('circle')
        .attr('class', 'dot')
        .attr('cx', (d) => (x(d.weekKey) ?? 0) + x.bandwidth() / 2)
        .attr('cy', (d) => y(d.elevFt))
        .attr('r', 3)
        .attr('fill', '#0d9488')
        .append('title')
        .text((d) => `${d.label}: ${Math.round(d.elevFt).toLocaleString()} ft`)

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

      // Y axis — "12k ft" format
      svg.append('g')
        .call(
          d3.axisLeft(y).ticks(5).tickFormat((d) =>
            +d >= 1000 ? `${(+d / 1000).toFixed(0)}k ft` : `${d} ft`
          )
        )
        .call((g) => {
          g.select('.domain').remove()
          g.selectAll('text').attr('fill', '#8B9953').attr('font-size', '11px')
          g.selectAll('.tick line').remove()
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
