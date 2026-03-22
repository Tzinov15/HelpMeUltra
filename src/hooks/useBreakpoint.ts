import { useMedia } from 'react-use'

export function useBreakpoint() {
  const isDesktop = useMedia('(min-width: 1024px)')
  const isTablet = useMedia('(min-width: 768px) and (max-width: 1023px)')
  const isMobile = useMedia('(max-width: 767px)')
  return { isDesktop, isTablet, isMobile }
}
