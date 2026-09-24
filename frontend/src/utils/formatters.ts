export function formatPoints(points: number): string {
  return new Intl.NumberFormat("es-PE").format(points);
}

export function formatDate(dateString: string): string {
  try {
    return new Intl.DateTimeFormat("es-PE", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(dateString));
  } catch {
    return dateString;
  }
}

export function getRankBadgeColor(level: string): string {
  switch (level.toLowerCase()) {
    case "diamante":
      return "bg-cyan-500/20 text-cyan-500 border-cyan-500/30";
    case "oro":
      return "bg-amber-500/20 text-amber-600 border-amber-500/30";
    case "plata":
      return "bg-slate-300/20 text-slate-500 border-slate-300/30";
    default:
      return "bg-orange-600/20 text-orange-600 border-orange-600/30";
  }
}
