import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Store, Users, UserCog, GraduationCap,
  Target, CalendarCheck, Megaphone, Award, LogOut, UserPlus, User,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/Logo";
import { clearSession, type Session } from "@/lib/session";

type NavItem = { title: string; url: string; icon: typeof LayoutDashboard; roles: Session["role"][] };

const nav: NavItem[] = [
  { title: "Dashboard",  url: "/dashboard",  icon: LayoutDashboard, roles: ["admin", "manager", "staff"] },
  { title: "Stores",     url: "/stores",     icon: Store,           roles: ["admin"] },
  { title: "Managers",   url: "/managers",   icon: UserCog,         roles: ["admin"] },
  { title: "Staff",      url: "/staff",      icon: Users,           roles: ["admin", "manager"] },
  { title: "Courses",    url: "/courses",    icon: GraduationCap,   roles: ["admin", "manager", "staff"] },
  { title: "Targets",    url: "/targets",    icon: Target,          roles: ["admin", "manager", "staff"] },
  { title: "Attendance", url: "/attendance", icon: CalendarCheck,   roles: ["admin", "manager", "staff"] },
  { title: "Notices",    url: "/notices",    icon: Megaphone,       roles: ["admin", "manager", "staff"] },
  { title: "Incentives", url: "/incentives", icon: Award,           roles: ["admin", "manager", "staff"] },
  { title: "Register",   url: "/register",   icon: UserPlus,        roles: ["admin"] },
  { title: "Profile",    url: "/profile",    icon: User,            roles: ["staff"] },
];

export function AppSidebar({ session }: { session: Session }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const items = nav.filter((i) => i.roles.includes(session.role));

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="px-2 py-2">
          {collapsed ? <Logo size={28} withWordmark={false} /> : <Logo size={32} />}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = pathname === item.url || pathname.startsWith(item.url + "/");
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={active}>
                      <Link to={item.url} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        {!collapsed && (
          <div className="px-2 py-2">
            <div className="text-xs text-sidebar-foreground/70">Signed in as</div>
            <div className="text-sm font-medium text-sidebar-foreground">{session.name}</div>
            <div className="text-[11px] uppercase tracking-wider text-brand">{session.role}</div>
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Log out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
