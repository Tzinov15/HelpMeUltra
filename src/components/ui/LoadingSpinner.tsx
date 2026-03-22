export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sz = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' }[size]
  return (
    <div className={`animate-spin rounded-full border-2 border-hmu-tertiary dark:border-gray-300 border-t-hmu-primary dark:border-t-orange-500 ${sz}`} />
  )
}
