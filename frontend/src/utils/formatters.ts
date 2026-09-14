export function formatPoints(points: number): string {
  return new Intl.NumberFormat('es-ES').format(points);
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(dateString));
}

export function getRankBadgeColor(level: string): string {
  switch (level.toLowerCase()) {
    case 'diamante':
      return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    case 'oro':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'plata':
      return 'bg-slate-300/20 text-slate-200 border-slate-300/30';
    default:
      return 'bg-orange-600/20 text-orange-400 border-orange-600/30';
  }
}
