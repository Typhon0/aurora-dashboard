// src/components/aurora/AuroraTimerCard.tsx
import { useMemo } from "react";
import { useEntity, type EntityName } from "@hakit/core";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface Props {
  entityId: EntityName;
  className?: string;
}

export function AuroraTimerCard({ entityId, className }: Props) {
  const entity = useEntity(entityId);

  // Expect remaining seconds in attributes.remaining
  const remaining = Number(entity.attributes.remaining ?? 0);
  const formatted = useMemo(() => {
    const sec = Math.max(0, remaining);
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(sec % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  }, [remaining]);

  return (
    <Card className={`animate-fade-pop ${className ?? ""}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-base font-semibold">
          {entity.attributes.friendly_name || "Timer"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-0">
        <div className="text-3xl font-bold text-white tabular-nums tracking-tight">
          {formatted}
        </div>
        <div className="text-xs text-white/60 mt-2">
          {entity.state === "active" ? "Counting down" : entity.state}
        </div>
      </CardContent>
    </Card>
  );
}
