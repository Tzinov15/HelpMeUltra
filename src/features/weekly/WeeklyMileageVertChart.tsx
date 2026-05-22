import { useRef, useEffect, useState } from 'react'
import { format } from 'date-fns'
import * as d3 from 'd3'
import type { WeekChartPoint } from './hooks/useWeeklyChartData'

const WEEKS = 26
const HEIGHT = 240
const DOT_R = 5
const DOT_R_HOVER = 7

const MILEAGE_COLOR = '#566827'
const MILEAGE_FILL = '#E9BE77'
const VERT_COLOR = '#0d9488'
const VERT_FILL = '#99f6e4'

export type ChartMode = 'combined' | 'mileage' | 'vert'

interface Props {
  data: WeekChartPoint[]
  mode: ChartMode
}

interface TipState {
  visible: boolean
  x: number
  y: number
  week: WeekChartPoint | null
}

export function WeeklyMileageVertChart({ data, mode }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [tip, setTip] = useState<TipState>({ visible: false, x: 0, y: 0, week: null })

  const showMi = mode === 'combined' || mode === 'mileage'
  const showFt = mode === 'combined' || mode === 'vert'

  useEffect(() => {
    function draw() {
      if (!svgRef.current || !containerRef.current) return
      const weeks = data.slice(-WEEKS)
      if (!weeks.length) return

      // Combined mode reserves room for a right-side axis; single-metric modes don't need it.
      const MARGIN = {
        top: 16,
        right: mode === 'combined' ? 64 : 16,
        bottom: 48,
        left: mode === 'vert' ? 60 : 52,
      }

      const totalW = containerRef.current.clientWidth
      const innerW = totalW - MARGIN.left - MARGIN.right
      const innerH = HEIGHT - MARGIN.top - MARGIN.bottom

      const el = d3.select(svgRef.current)
      el.selectAll('*').remove()
      el.attr('width', totalW).attr('height', HEIGHT)

      const svg = el.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`)

      const maxMiles = d3.max(weeks, (w) => w.mileage) ?? 10
      const maxFt = d3.max(weeks, (w) => w.elevFt) ?? 1000

      const x = d3.scaleBand().domain(weeks.map((w) => w.weekKey)).range([0, innerW]).padding(0.1)
      const yMi = d3.scaleLinear().domain([0, maxMiles * 1.1]).nice().range([innerH, 0])
      const yFt = d3.scaleLinear().domain([0, maxFt * 1.1]).nice().range([innerH, 0])

      // Gridlines tied to whichever scale is on the left
      const gridScale = mode === 'vert' ? yFt : yMi
      svg.append('g')
        .call(d3.axisLeft(gridScale).ticks(5).tickSize(-innerW).tickFormat(() => ''))
        .call((g) => {
          g.select('.domain').remove()
          g.selectAll('line').attr('stroke', '#DBC292').attr('stroke-dasharray', '3,3').attr('opacity', 0.5)
        })

      const cx = (d: WeekChartPoint) => (x(d.weekKey) ?? 0) + x.bandwidth() / 2

      // Vert line + dots (drawn first so mileage sits on top when combined)
      if (showFt) {
        const cyFt = (d: WeekChartPoint) => yFt(d.elevFt)
        // Fill only when this is the sole series — fills overlap badly in combined mode
        if (mode === 'vert') {
          svg.append('path')
            .datum(weeks)
            .attr('fill', VERT_FILL)
            .attr('opacity', 0.25)
            .attr('d', d3.area<WeekChartPoint>().x(cx).y0(innerH).y1(cyFt).curve(d3.curveMonotoneX))
        }
        svg.append('path')
          .datum(weeks)
          .attr('fill', 'none')
          .attr('stroke', VERT_COLOR)
          .attr('stroke-width', 2)
          .attr('d', d3.line<WeekChartPoint>().x(cx).y(cyFt).curve(d3.curveMonotoneX))
        svg.selectAll('.dot-ft')
          .data(weeks)
          .join('circle')
          .attr('class', 'dot dot-ft')
          .attr('cx', cx).attr('cy', cyFt)
          .attr('r', DOT_R).attr('fill', VERT_COLOR)
      }

      // Mileage line + dots
      if (showMi) {
        const cyMi = (d: WeekChartPoint) => yMi(d.mileage)
        if (mode === 'mileage') {
          svg.append('path')
            .datum(weeks)
            .attr('fill', MILEAGE_FILL)
            .attr('opacity', 0.25)
            .attr('d', d3.area<WeekChartPoint>().x(cx).y0(innerH).y1(cyMi).curve(d3.curveMonotoneX))
        }
        svg.append('path')
          .datum(weeks)
          .attr('fill', 'none')
          .attr('stroke', MILEAGE_COLOR)
          .attr('stroke-width', 2)
          .attr('d', d3.line<WeekChartPoint>().x(cx).y(cyMi).curve(d3.curveMonotoneX))
        svg.selectAll('.dot-mi')
          .data(weeks)
          .join('circle')
          .attr('class', 'dot dot-mi')
          .attr('cx', cx).attr('cy', cyMi)
          .attr('r', DOT_R).attr('fill', MILEAGE_COLOR)
      }

      // Column-wide hover targets
      const containerEl = containerRef.current
      svg.append('g')
        .attr('class', 'hover-targets')
        .selectAll('rect')
        .data(weeks)
        .join('rect')
        .attr('x', (w) => (x(w.weekKey) ?? 0) - x.step() * x.padding() / 2)
        .attr('y', 0)
        .attr('width', x.step())
        .attr('height', innerH)
        .attr('fill', 'transparent')
        .style('cursor', 'pointer')
        .on('mousemove', function (event, w) {
          const [px, py] = d3.pointer(event, containerEl)
          setTip({ visible: true, x: px, y: py, week: w })
          if (showMi) {
            svg.selectAll<SVGCircleElement, WeekChartPoint>('.dot-mi')
              .attr('r', (d) => (d.weekKey === w.weekKey ? DOT_R_HOVER : DOT_R))
          }
          if (showFt) {
            svg.selectAll<SVGCircleElement, WeekChartPoint>('.dot-ft')
              .attr('r', (d) => (d.weekKey === w.weekKey ? DOT_R_HOVER : DOT_R))
          }
        })
        .on('mouseleave', () => {
          setTip((t) => ({ ...t, visible: false }))
          svg.selectAll('.dot').attr('r', DOT_R)
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

      // LEFT Y axis
      if (mode === 'vert') {
        svg.append('g')
          .call(
            d3.axisLeft(yFt).ticks(5).tickFormat((d) =>
              +d >= 1000 ? `${(+d / 1000).toFixed(0)}k ft` : `${d} ft`
            )
          )
          .call((g) => {
            g.select('.domain').remove()
            g.selectAll('text').attr('fill', VERT_COLOR).attr('font-size', '11px')
            g.selectAll('.tick line').remove()
          })
      } else {
        svg.append('g')
          .call(d3.axisLeft(yMi).ticks(5).tickFormat((d) => `${d}mi`))
          .call((g) => {
            g.select('.domain').remove()
            g.selectAll('text').attr('fill', MILEAGE_COLOR).attr('font-size', '11px')
            g.selectAll('.tick line').remove()
          })
      }

      // RIGHT Y axis — combined mode only
      if (mode === 'combined') {
        svg.append('g')
          .attr('transform', `translate(${innerW},0)`)
          .call(
            d3.axisRight(yFt).ticks(5).tickFormat((d) =>
              +d >= 1000 ? `${(+d / 1000).toFixed(0)}k ft` : `${d} ft`
            )
          )
          .call((g) => {
            g.select('.domain').remove()
            g.selectAll('text').attr('fill', VERT_COLOR).attr('font-size', '11px')
            g.selectAll('.tick line').remove()
          })

        // Legend (top-left) — only when both series share the chart
        const legend = svg.append('g').attr('class', 'legend').attr('transform', `translate(8, 0)`)
        const items = [
          { label: 'Miles', color: MILEAGE_COLOR },
          { label: 'Vertical', color: VERT_COLOR },
        ]
        items.forEach((item, i) => {
          const row = legend.append('g').attr('transform', `translate(${i * 90}, 0)`)
          row.append('line')
            .attr('x1', 0).attr('x2', 18).attr('y1', 6).attr('y2', 6)
            .attr('stroke', item.color).attr('stroke-width', 2)
          row.append('circle')
            .attr('cx', 9).attr('cy', 6).attr('r', 3.5).attr('fill', item.color)
          row.append('text')
            .attr('x', 24).attr('y', 9)
            .attr('fill', '#8B9953').attr('font-size', '11px')
            .text(item.label)
        })
      }
    }

    draw()
    const ro = new ResizeObserver(draw)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [data, mode, showMi, showFt])

  const TOOLTIP_W = 220
  const flip = containerRef.current && tip.x + TOOLTIP_W + 16 > containerRef.current.clientWidth
  const tipStyle: React.CSSProperties = {
    left: flip ? tip.x - TOOLTIP_W - 12 : tip.x + 12,
    top: Math.max(0, tip.y - 56),
    width: TOOLTIP_W,
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <svg ref={svgRef} className="w-full overflow-visible" />
      {tip.visible && tip.week && (
        <div
          className="pointer-events-none absolute z-10 rounded-md border border-hmu-tertiary dark:border-gray-700 bg-hmu-surface dark:bg-gray-900 px-3 py-2 text-xs shadow-lg"
          style={tipStyle}
        >
          <div className="space-y-0.5">
            {showMi && (
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-hmu-secondary dark:text-gray-400">
                  <span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: MILEAGE_COLOR }} />
                  Miles
                </span>
                <span className="font-semibold tabular-nums text-hmu-primary dark:text-white">
                  {tip.week.mileage.toFixed(1)} mi
                </span>
              </div>
            )}
            {showFt && (
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-hmu-secondary dark:text-gray-400">
                  <span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: VERT_COLOR }} />
                  Vertical
                </span>
                <span className="font-semibold tabular-nums text-hmu-primary dark:text-white">
                  {Math.round(tip.week.elevFt).toLocaleString()} ft
                </span>
              </div>
            )}
          </div>
          <div className="mt-1.5 text-[11px] text-hmu-secondary dark:text-gray-500">
            {format(tip.week.startDate, 'EEEE, MMM d')} <span className="opacity-60">→</span>{' '}
            {format(tip.week.endDate, 'EEEE, MMM d')}
          </div>
        </div>
      )}
    </div>
  )
}
