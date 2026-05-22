import { useRef, useEffect, useState } from 'react'
import { format } from 'date-fns'
import * as d3 from 'd3'
import type { WeekChartPoint } from './hooks/useWeeklyChartData'

const WEEKS = 26
const MARGIN = { top: 16, right: 16, bottom: 48, left: 60 }
const HEIGHT = 240
const DOT_R = 5
const DOT_R_HOVER = 7

export interface ZoneSeries {
  zoneIndex: 0 | 1 | 2 | 3 | 4
  label: string
  lineColor: string
  fillColor: string
}

interface Props {
  data: WeekChartPoint[]
  series: ZoneSeries[]
}

interface TipState {
  visible: boolean
  x: number
  y: number
  week: WeekChartPoint | null
}

function formatHM(hours: number): string {
  if (hours < 1 / 120) return '0m'
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export function WeeklyZoneLineChart({ data, series }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [tip, setTip] = useState<TipState>({ visible: false, x: 0, y: 0, week: null })

  useEffect(() => {
    if (!tip.visible) return
    function onDocDown(e: PointerEvent) {
      const c = containerRef.current
      if (c && !c.contains(e.target as Node)) {
        setTip((t) => ({ ...t, visible: false }))
      }
    }
    document.addEventListener('pointerdown', onDocDown)
    return () => document.removeEventListener('pointerdown', onDocDown)
  }, [tip.visible])

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

      const maxH = d3.max(weeks, (w) =>
        Math.max(...series.map((s) => w.zoneTimes[s.zoneIndex] / 3600))
      ) ?? 1

      const x = d3.scaleBand().domain(weeks.map((w) => w.weekKey)).range([0, innerW]).padding(0.1)
      const y = d3.scaleLinear().domain([0, Math.max(maxH, 0.5) * 1.1]).nice().range([innerH, 0])

      // Gridlines
      svg.append('g')
        .call(d3.axisLeft(y).ticks(5).tickSize(-innerW).tickFormat(() => ''))
        .call((g) => {
          g.select('.domain').remove()
          g.selectAll('line').attr('stroke', '#DBC292').attr('stroke-dasharray', '3,3').attr('opacity', 0.5)
        })

      const cx = (d: WeekChartPoint) => (x(d.weekKey) ?? 0) + x.bandwidth() / 2

      // Render each series: area, line, dots
      series.forEach((s) => {
        const cy = (d: WeekChartPoint) => y(d.zoneTimes[s.zoneIndex] / 3600)

        const area = d3.area<WeekChartPoint>()
          .x(cx).y0(innerH).y1(cy).curve(d3.curveMonotoneX)
        svg.append('path')
          .datum(weeks)
          .attr('fill', s.fillColor)
          .attr('opacity', 0.18)
          .attr('d', area)

        const line = d3.line<WeekChartPoint>().x(cx).y(cy).curve(d3.curveMonotoneX)
        svg.append('path')
          .datum(weeks)
          .attr('fill', 'none')
          .attr('stroke', s.lineColor)
          .attr('stroke-width', 2)
          .attr('d', line)

        svg.selectAll(`.dot-${s.zoneIndex}`)
          .data(weeks)
          .join('circle')
          .attr('class', `dot dot-${s.zoneIndex}`)
          .attr('cx', cx)
          .attr('cy', cy)
          .attr('r', DOT_R)
          .attr('fill', s.lineColor)
      })

      // Single column-wide hover target per week — highlights all series dots in that column
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
        .on('pointerdown pointermove', function (event, w) {
          const [px, py] = d3.pointer(event, containerEl)
          setTip({ visible: true, x: px, y: py, week: w })
          series.forEach((s) => {
            svg.selectAll<SVGCircleElement, WeekChartPoint>(`.dot-${s.zoneIndex}`)
              .attr('r', (d) => (d.weekKey === w.weekKey ? DOT_R_HOVER : DOT_R))
          })
        })
        .on('pointerleave', (event) => {
          if ((event as PointerEvent).pointerType !== 'mouse') return
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

      // Y axis — hours
      svg.append('g')
        .call(d3.axisLeft(y).ticks(5).tickFormat((d) => `${d}h`))
        .call((g) => {
          g.select('.domain').remove()
          g.selectAll('text').attr('fill', '#8B9953').attr('font-size', '11px')
          g.selectAll('.tick line').remove()
        })

      // Legend (top-right)
      const legend = svg.append('g').attr('class', 'legend')
      const itemH = 16
      series.forEach((s, i) => {
        const row = legend.append('g').attr('transform', `translate(0, ${i * itemH})`)
        row.append('line')
          .attr('x1', 0).attr('x2', 18)
          .attr('y1', 6).attr('y2', 6)
          .attr('stroke', s.lineColor)
          .attr('stroke-width', 2)
        row.append('circle')
          .attr('cx', 9).attr('cy', 6).attr('r', 3.5)
          .attr('fill', s.lineColor)
        row.append('text')
          .attr('x', 24).attr('y', 9)
          .attr('fill', '#8B9953')
          .attr('font-size', '11px')
          .text(s.label)
      })
      // Right-align the legend block
      const legendNode = legend.node() as SVGGElement | null
      if (legendNode) {
        const bbox = legendNode.getBBox()
        legend.attr('transform', `translate(${innerW - bbox.width - 8}, 0)`)
      }
    }

    draw()
    const ro = new ResizeObserver(draw)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [data, series])

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
            {series.map((s) => (
              <div key={s.zoneIndex} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-hmu-secondary dark:text-gray-400">
                  <span
                    className="inline-block h-2 w-2 rounded-sm"
                    style={{ backgroundColor: s.lineColor }}
                  />
                  {s.label}
                </span>
                <span className="font-semibold tabular-nums text-hmu-primary dark:text-white">
                  {formatHM(tip.week!.zoneTimes[s.zoneIndex] / 3600)}
                </span>
              </div>
            ))}
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
