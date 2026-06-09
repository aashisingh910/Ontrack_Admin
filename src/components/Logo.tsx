import logo from "@/assets/react-logo.png";

export function Logo({ size = 36, withWordmark = true }: { size?: number; withWordmark?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <img
        src={logo}
        alt="Hometown logo"
        width={size}
        height={size}
        className="rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.25)] ring-2 ring-golden/60"
        style={{ width: size, height: size }}
      />
      {withWordmark && (
        <div className="leading-none">
          <div className="font-display text-lg font-bold tracking-tight">Hometown</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Hometown Workspace</div>
        </div>
      )}
    </div>
  );
}
