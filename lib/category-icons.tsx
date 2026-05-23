import {
  Tag,
  ShoppingCart,
  Car,
  Home,
  HeartPulse,
  Gamepad2,
  Briefcase,
  Coffee,
  Plane,
  Repeat,
  Laptop,
  TrendingUp,
  MoreHorizontal,
  PlusCircle,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  tag: Tag,
  "shopping-cart": ShoppingCart,
  car: Car,
  home: Home,
  "heart-pulse": HeartPulse,
  "gamepad-2": Gamepad2,
  briefcase: Briefcase,
  coffee: Coffee,
  plane: Plane,
  repeat: Repeat,
  laptop: Laptop,
  "trending-up": TrendingUp,
  "more-horizontal": MoreHorizontal,
  "plus-circle": PlusCircle,
};

export function getCategoryIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? Tag;
}
