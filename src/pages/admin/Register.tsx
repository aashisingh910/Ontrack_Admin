import { Outlet, Link, useLocation } from "react-router-dom";
import { Store, UserCog, Users } from "lucide-react";

const tabs = [
  { to: "/register/store", label: "Store", icon: Store },
  { to: "/register/manager", label: "Manager", icon: UserCog },
  { to: "/register/staff", label: "Staff", icon: Users },
] as const;

export default function Register() {
  const { pathname } = useLocation();
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-display font-bold">Register</h1>
        <p className="text-sm text-muted-foreground">
          Onboard new stores, managers and staff to the Hometown network.
        </p>
      </header>

      <div className="flex gap-2 border-b">
        {tabs.map((t) => {
          const active = pathname.startsWith(t.to);
          return (
            <Link
              key={t.to}
              to={t.to}
              className={`relative inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition ${
                active ? "text-brand" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="h-4 w-4" /> {t.label}
              {active && <span className="absolute inset-x-2 -bottom-px h-0.5 bg-brand rounded-full" />}
            </Link>
          );
        })}
      </div>

      <Outlet />
    </div>
  );
}
