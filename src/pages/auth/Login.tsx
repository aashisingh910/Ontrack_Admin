import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { setSession, type Session } from "@/lib/session";
import { API_BASE_URL } from "@/lib/api";
import type { Role } from "@/lib/mock-data";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, UserCog, User, Loader2 } from "lucide-react";
import { toast } from "sonner";

const roleCards: {
  role: Role;
  title: string;
  desc: string;
  icon: typeof Shield;
  demoIdentifier: string;
  demoName: string;
  password?: string;
  requiresPassword: boolean;
}[] = [
  {
    role: "admin",
    title: "Admin",
    desc: "Full control over stores, courses and people.",
    icon: Shield,
    demoIdentifier: "admin@hometown.com",
    demoName: "Admin User",
    password: "admin@123",
    requiresPassword: true,
  },
  {
    role: "manager",
    title: "Manager",
    desc: "Run a store, set targets, track your team.",
    icon: UserCog,
    demoIdentifier: "azam.qazi@praxisretail.in",
    demoName: "Azam Qazi",
    requiresPassword: false,
  },
  {
    role: "staff",
    title: "Staff",
    desc: "Check in, learn, hit targets, earn rewards.",
    icon: User,
    demoIdentifier: "emp.552815@hometown.internal",
    demoName: "Swapnil Singh",
    password: "staff@123",
    requiresPassword: true,
  },
];

const normalizeRole = (value?: string): Role => {
  const role = String(value || "").toLowerCase();

  if (role === "admin") return "admin";
  if (role === "manager") return "manager";
  if (role === "staff") return "staff";

  return "staff";
};

const getRedirectPath = (_role: Role) => "/dashboard";

export default function LoginPage() {
  const [role, setRole] = useState<Role>("admin");
  const [identifier, setIdentifier] = useState("admin@hometown.com");
  const [name, setName] = useState("Admin User");
  const [password, setPassword] = useState("admin@123");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const selectedRole = roleCards.find((item) => item.role === role);

  const pick = (r: (typeof roleCards)[number]) => {
    setRole(r.role);
    setIdentifier(r.demoIdentifier);
    setName(r.demoName);
    setPassword(r.password || "");
  };

  const buildSession = (apiUser: any, token?: string): Session => {
    const apiRole = normalizeRole(apiUser?.role || role);

    const apiName =
      apiUser?.name ||
      apiUser?.managerName ||
      apiUser?.fullName ||
      name;

    const apiEmail =
      apiUser?.email ||
      apiUser?.managerEmail ||
      identifier;

    return {
      role: apiRole,
      email: apiEmail,
      name: apiName,
      token,
      employeeCode: apiUser?.employeeCode || apiUser?.managerId || "",
      contactNumber:
        apiUser?.contactNumber || apiUser?.managerContactNumber || "",
      storeCode: apiUser?.storeCode || apiUser?.assignedStore?.storeCode || "",
      storeName: apiUser?.storeName || apiUser?.assignedStore?.storeName || "",
      city: apiUser?.city || apiUser?.assignedStore?.city || "",
      region: apiUser?.region || apiUser?.assignedStore?.region || "",
    };
  };

  const checkExistingSession = async () => {
    const token = localStorage.getItem("token");

    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok || !data.success || !data.data?.user) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        return;
      }

      const apiUser = data.data.user;
      const session = buildSession(apiUser, token);

      localStorage.setItem("user", JSON.stringify(apiUser));
      localStorage.setItem("userName", session.name);
      setSession(session);

      navigate(getRedirectPath(session.role), { replace: true });
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  };

  useEffect(() => {
    checkExistingSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let url = "";
      let body: Record<string, string> = {};

      if (role === "manager") {
        url = `${API_BASE_URL}/auth/manager/login`;
        body = {
          identifier,
        };
      } else {
        url = `${API_BASE_URL}/users/login`;
        body = {
          email: identifier,
          password,
        };
      }

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Login failed");
      }

      const token =
        data.data?.token ||
        data.token ||
        data.accessToken ||
        data.data?.accessToken;

      const apiUser =
        data.data?.user ||
        data.user ||
        data.data ||
        {};

      if (!token) {
        throw new Error("Login token missing from backend response");
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(apiUser));

      const session = buildSession(apiUser, token);

      localStorage.setItem("userName", session.name);
      setSession(session);

      toast.success(`Welcome ${session.name}`);

      navigate(getRedirectPath(session.role), { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div
        className="relative hidden lg:flex flex-col justify-between p-12 text-sidebar-foreground overflow-hidden"
        style={{
          background:
            "linear-gradient(160deg, color-mix(in oklab, var(--brown) 92%, black) 0%, color-mix(in oklab, var(--brand) 80%, var(--brown)) 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-20 mix-blend-overlay"
          style={{
            backgroundImage:
              "radial-gradient(600px 300px at 20% 10%, white, transparent), radial-gradient(500px 300px at 80% 90%, var(--golden), transparent)",
          }}
        />

        <div className="relative">
          <Logo size={44} />
        </div>

        <div className="relative space-y-4 max-w-md">
          <h1 className="text-4xl font-display font-bold leading-tight">
            One workspace for every store, every shift.
          </h1>

          <p className="text-sidebar-foreground/80">
            Track attendance, training, targets, incentives, notices and store
            performance — all in HomeTown OnTrack.
          </p>

          <div className="flex gap-2 pt-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-brand" />
            <span className="inline-flex h-2 w-2 rounded-full bg-golden" />
            <span className="inline-flex h-2 w-2 rounded-full bg-beige" />
          </div>
        </div>

        <div className="relative text-xs text-sidebar-foreground/60">
          © HomeTown · OnTrack Workspace
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden">
            <Logo size={40} />
          </div>

          <div>
            <h2 className="text-2xl font-display font-bold">Welcome back</h2>
            <p className="text-sm text-muted-foreground">
              Select your role and sign in to your workspace.
            </p>
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
                  <r.icon
                    className={`h-5 w-5 ${
                      active ? "text-brand" : "text-muted-foreground"
                    }`}
                  />

                  <div className="mt-2 text-sm font-semibold">{r.title}</div>

                  <div className="text-[11px] text-muted-foreground leading-tight">
                    {r.desc}
                  </div>
                </button>
              );
            })}
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Display name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="identifier">
                {role === "manager"
                  ? "Email / Mobile / Employee Code"
                  : "Email"}
              </Label>

              <Input
                id="identifier"
                type={role === "manager" ? "text" : "email"}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={
                  role === "manager"
                    ? "azam.qazi@praxisretail.in / MGR6068 / 8433599557"
                    : "email@hometown.com"
                }
                required
              />
            </div>

            {selectedRole?.requiresPassword ? (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>

                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            ) : (
              <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
                Manager password is skipped for now. Later this will be replaced
                with OTP mobile login.
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-brand text-brand-foreground hover:bg-brand/90 shadow-warm"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {loading ? "Signing in…" : "Enter workspace"}
            </Button>
          </form>

          <div className="rounded-lg border bg-card p-3 text-xs text-muted-foreground space-y-1">
            <div className="font-semibold text-foreground">
              Manager test logins
            </div>
            <div>Azam Qazi: azam.qazi@praxisretail.in</div>
            <div>Alok Ranjan Sahoo: alok.sahoo@praxisretail.in</div>
            <div>Satyanarayana Reddy: satyanarayana.reddy@praxisretail.in</div>
          </div>
        </div>
      </div>
    </div>
  );
}