interface WebsiteStatusProps {
  hasRealWebsite: boolean;
  score?: number | null;
}

export function WebsiteStatus({ hasRealWebsite, score }: WebsiteStatusProps) {
  let label = "Sem site";
  let className = "bg-slate-100 text-slate-700 border-slate-200";

  if (hasRealWebsite) {
    if (score != null && score <= 60) {
      label = "Site fraco";
      className = "bg-amber-100 text-amber-800 border-amber-200";
    } else {
      label = "Site ok";
      className = "bg-emerald-100 text-emerald-800 border-emerald-200";
    }
  }

  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${className}`}
      data-testid="website-status"
    >
      {label}
    </span>
  );
}
