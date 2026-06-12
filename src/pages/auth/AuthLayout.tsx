import { Outlet, Navigate, useLocation } from "react-router-dom";
import { getSession } from "@/lib/session";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Bell, Search } from "lucide-react";

export default function AuthLayout() {
  const session = getSession();
  const { pathname } = useLocation();

  if (!session) return <Navigate to="/login" replace />;

  const title = pathname.split("/").filter(Boolean)[0] ?? "dashboard";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar session={session} />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 sticky top-0 z-30 flex items-center gap-3 border-b bg-background/80 backdrop-blur px-3">
            <SidebarTrigger />

            <div className="font-display font-semibold capitalize">
              {title}
            </div>

            <div className="ml-auto flex items-center gap-2">
              {session.storeCode ? (
                <div className="hidden md:block rounded-md border px-3 py-1.5 text-xs text-muted-foreground">
                  {session.storeName} · #{session.storeCode}
                </div>
              ) : null}

              <button className="hidden sm:inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent">
                <Search className="h-3.5 w-3.5" /> Search…
              </button>

              <button className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border hover:bg-accent">
                <Bell className="h-4 w-4" />
                <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-brand" />
              </button>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}