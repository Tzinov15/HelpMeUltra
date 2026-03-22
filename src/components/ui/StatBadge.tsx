export function StatBadge({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs font-medium uppercase tracking-wider text-hmu-secondary dark:text-gray-400">{label}</span>
      <span className="text-lg font-semibold text-hmu-primary dark:text-white">{value}</span>
      {sub && <span className="text-xs text-hmu-secondary dark:text-gray-400">{sub}</span>}
    </div>
  )
}
