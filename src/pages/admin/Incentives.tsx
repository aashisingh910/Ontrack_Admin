import { staff, getStore, fmtINR, incentive } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award } from "lucide-react";

export default function Incentives() {
  const ranked = [...staff].sort((a, b) => incentive(b.achieved) - incentive(a.achieved));
  const total = ranked.reduce((a, s) => a + incentive(s.achieved), 0);

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="h-2" style={{ background: "linear-gradient(90deg, var(--brand), var(--golden))" }} />
        <CardContent className="p-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Incentives this month</div>
            <div className="text-3xl font-display font-bold text-brown">{fmtINR(total)}</div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Award className="h-4 w-4 text-golden" /> Each staff earns 10% of achieved target.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Leaderboard</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {ranked.map((s, idx) => (
              <div key={s.id} className="grid grid-cols-12 items-center gap-3 px-5 py-3">
                <div className="col-span-1 text-sm font-mono text-muted-foreground">#{idx + 1}</div>
                <div className="col-span-5 sm:col-span-4 flex items-center gap-3 min-w-0">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white text-xs font-semibold" style={{ background: s.avatarColor }}>
                    {s.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                  </span>
                  <div className="min-w-0">
                    <div className="font-medium truncate">{s.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{getStore(s.storeId)?.name}</div>
                  </div>
                </div>
                <div className="col-span-3 text-xs">
                  <div className="text-muted-foreground">Achieved</div>
                  <div className="font-medium">{fmtINR(s.achieved)}</div>
                </div>
                <div className="col-span-3 sm:col-span-4 text-right">
                  <div className="text-xs text-muted-foreground">Incentive</div>
                  <div className="font-display font-bold text-brand">{fmtINR(incentive(s.achieved))}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
