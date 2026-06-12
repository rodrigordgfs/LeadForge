import { Badge } from "@leadforge/ui";

interface WebsiteStatusProps {
  hasRealWebsite: boolean;
  score?: number | null;
}

export function WebsiteStatus({ hasRealWebsite, score }: WebsiteStatusProps) {
  let label = "Sem site";
  let variant: "secondary" | "low" | "excellent" = "secondary";

  if (hasRealWebsite) {
    if (score != null && score <= 60) {
      label = "Site fraco";
      variant = "low";
    } else {
      label = "Site ok";
      variant = "excellent";
    }
  }

  return (
    <Badge variant={variant} data-testid="website-status">
      {label}
    </Badge>
  );
}
