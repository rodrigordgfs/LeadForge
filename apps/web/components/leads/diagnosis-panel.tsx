import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@leadforge/ui";

interface DiagnosisPanelProps {
  problems?: string[];
  opportunities?: string[];
}

export function DiagnosisPanel({ problems = [], opportunities = [] }: DiagnosisPanelProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2" data-testid="diagnosis-panel">
      <Card className="gap-4 border-destructive/25 bg-destructive/5 py-4">
        <CardHeader className="px-4 py-0">
          <CardTitle className="text-sm text-destructive">Problemas</CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          {problems.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum problema identificado.
            </p>
          ) : (
            <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
              {problems.map((problem) => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="gap-4 border-success/25 bg-success/5 py-4">
        <CardHeader className="px-4 py-0">
          <CardTitle className="text-sm text-success">Oportunidades</CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          {opportunities.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma oportunidade identificada.
            </p>
          ) : (
            <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
              {opportunities.map((opportunity) => (
                <li key={opportunity}>{opportunity}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
