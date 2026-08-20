import {
  Utensils,
  Fuel,
  PartyPopper,
  Sparkles,
  ShoppingCart,
  Car,
  HeartPulse,
  Home,
  Clapperboard,
  MoreHorizontal,
  type LucideIcon,
} from 'lucide-react'

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  utensils: Utensils,
  fuel: Fuel,
  'party-popper': PartyPopper,
  sparkles: Sparkles,
  'shopping-cart': ShoppingCart,
  car: Car,
  'heart-pulse': HeartPulse,
  home: Home,
  clapperboard: Clapperboard,
  'more-horizontal': MoreHorizontal,
}

export function getCategoryIcon(icon: string | null): LucideIcon {
  return (icon && CATEGORY_ICONS[icon]) || MoreHorizontal
}
