import type { LucideIcon } from 'lucide-react'

interface IconChipProps {
  icon: LucideIcon
  /** Hex color; the chip background is the same hue at low opacity. */
  color: string
  size?: 'sm' | 'md'
  shape?: 'circle' | 'square'
}

export function IconChip({ icon: Icon, color, size = 'md', shape = 'circle' }: IconChipProps) {
  const box = size === 'sm' ? 'size-8' : 'size-10'
  return (
    <span
      className={`flex shrink-0 items-center justify-center ${box} ${shape === 'circle' ? 'rounded-full' : 'rounded-xl'}`}
      style={{ backgroundColor: `${color}1f`, color }}
    >
      <Icon size={size === 'sm' ? 15 : 18} strokeWidth={2} />
    </span>
  )
}
