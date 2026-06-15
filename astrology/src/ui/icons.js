import { Calendar, ChevronLeft, ChevronRight, Heart, Sparkles, Users } from 'lucide';

const icons = {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Heart,
  Sparkles,
  Users,
};

export function renderIcon(name, className = 'size-6') {
  const iconFactory = icons[name] ?? Sparkles;
  return iconFactory({ class: className, 'aria-hidden': 'true' });
}
