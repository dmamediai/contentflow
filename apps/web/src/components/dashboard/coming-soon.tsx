import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

export function ComingSoon({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground mt-1">{description}</p>
      </div>

      <Card>
        <CardContent className="py-16 text-center">
          <Icon className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
          <p className="font-medium">Coming soon</p>
          <p className="text-sm text-muted-foreground mt-1">
            This area isn&apos;t wired up yet.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
