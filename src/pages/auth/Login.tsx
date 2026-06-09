import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setSession, type Session } from "@/lib/session";
import { API_BASE_URL } from "@/lib/api";
import type { Role } from "@/lib/mock-data";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, UserCog, User, Loader2 } from "lucide-react";

const roleCards: { role: Role; title: string; desc: string; icon: typeof Shield; demoEmail: string; demoName: string }[] = [
  { role: "admin",   title: "Admin",   desc: "Full control over stores, courses and people.", icon: Shield,  demoEmail: "admin@hometown.app",   demoName: "Admin User" },
  { role: "manager", title: "Manager", desc: "Run a store, set targets, track your team.",    icon: UserCog, demoEmail: "aarav@hometown.app",  demoName: "Aarav Mehta" },
  { role: "staff",   title: "Staff",   desc: "Check in, learn, hit targets, earn rewards.",   icon: User,    demoEmail: "ishaan@hometown.app", demoName: "Ishaan Verma" },
];

export default function LoginPage() {
  const [role, setRole] = useState<Role>("admin");
  const [email, setEmail] = useState("admin@hometown.app");
  const [name, setName] = useState("Admin User");
  const [password, setPassword] = useState("demo1234");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const pick = (r: typeof roleCards[number]) => {
    setRole(r.role); setEmail(r.demoEmail); setName(r.demoName);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Backend returns { success: true, data: { token, user: { name, email, role, ... } } }
        const token = data.data?.token ?? data.token ?? data.accessToken ?? data.data?.accessToken;
        if (token) localStorage.setItem("token", token);
        const apiUser = data.data?.user ?? data.data ?? {};
        const apiName = apiUser.name ?? apiUser.fullName ?? name;
        const rawRole = (apiUser.role as string | undefined) ?? "";
        // Normalize backend role (ADMIN/MANAGER/STAFF) to frontend role (admin/manager/staff)
        const apiRole: Role = (rawRole.toLowerCase() as Role) || role;
        localStorage.setItem("userName", apiName);
        const session: Session = { role: apiRole, email: apiUser.email ?? email, name: apiName };
        setSession(session);
        navigate("/dashboard");
        return;
      }
    } catch {
      // backend unreachable — fall through to demo mode
    }
    // Demo fallback: no real backend token, but session allows navigation
    localStorage.removeItem("token");
    localStorage.setItem("userName", name);
    const session: Session = { role, email, name };
    setSession(session);
    navigate("/dashboard");
    setLoading(false);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 text-sidebar-foreground overflow-hidden"
           style={{
             background:
               "linear-gradient(160deg, color-mix(in oklab, var(--brown) 92%, black) 0%, color-mix(in oklab, var(--brand) 80%, var(--brown)) 100%)",
           }}>
        <div className="absolute inset-0 opacity-20 mix-blend-overlay"
             style={{ backgroundImage: "radial-gradient(600px 300px at 20% 10%, white, transparent), radial-gradient(500px 300px at 80% 90%, var(--golden), transparent)" }} />
        <div className="relative">
          <Logo size={44} />
        </div>
        <div className="relative space-y-4 max-w-md">
          <h1 className="text-4xl font-display font-bold leading-tight">
            One workspace for every store, every shift.
          </h1>
          <p className="text-sidebar-foreground/80">
            Track attendance from the field, run targeted training, set daily targets, and reward your team — all in Hometown.
          </p>
          <div className="flex gap-2 pt-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-brand" />
            <span className="inline-flex h-2 w-2 rounded-full bg-golden" />
            <span className="inline-flex h-2 w-2 rounded-full bg-beige" />
          </div>
        </div>
        <div className="relative text-xs text-sidebar-foreground/60">© Hometown · Hometown Workspace</div>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden">
            <Logo size={40} />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold">Welcome back</h2>
            <p className="text-sm text-muted-foreground">Pick a role to preview the workspace.</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {roleCards.map((r) => {
              const active = role === r.role;
              return (
                <button
                  key={r.role}
                  type="button"
                  onClick={() => pick(r)}
                  className={`group rounded-xl border p-3 text-left transition ${
                    active
                      ? "border-brand bg-accent shadow-warm"
                      : "border-border bg-card hover:border-brand/50"
                  }`}
                >
                  <r.icon className={`h-5 w-5 ${active ? "text-brand" : "text-muted-foreground"}`} />
                  <div className="mt-2 text-sm font-semibold">{r.title}</div>
                  <div className="text-[11px] text-muted-foreground leading-tight">{r.desc}</div>
                </button>
              );
            })}
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Display name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Connects to backend if available, otherwise enters demo mode.
              </p>
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-brand text-brand-foreground hover:bg-brand/90 shadow-warm">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {loading ? "Signing in…" : "Enter workspace"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
