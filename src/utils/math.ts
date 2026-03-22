export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val))
}

export function normalize(val: number, min: number, max: number): number {
  if (max === min) return 0
  return (val - min) / (max - min)
}
