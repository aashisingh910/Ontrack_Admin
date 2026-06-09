import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { getSession } from "@/lib/session";
import type { Role } from "@/lib/mock-data";

// ── Auth ─────────────────────────────────────────────────────────────────────
import LoginPage from "@/pages/auth/Login";
import AuthLayout from "@/pages/auth/AuthLayout";

// ── Admin pages ───────────────────────────────────────────────────────────────
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminAttendance from "@/pages/admin/Attendance";
import AdminTargets from "@/pages/admin/Targets";
import AdminIncentives from "@/pages/admin/Incentives";
import AdminNotices from "@/pages/admin/Notices";
import AdminCourses from "@/pages/admin/Courses";
import AdminStaff from "@/pages/admin/Staff";
import AdminManagers from "@/pages/admin/Managers";
import AdminStores from "@/pages/admin/Stores";
import StoreDetail from "@/pages/admin/StoreDetail";
import StaffDetail from "@/pages/admin/StaffDetail";
import Register from "@/pages/admin/Register";
import RegisterStore from "@/pages/admin/RegisterStore";
import RegisterManager from "@/pages/admin/RegisterManager";
import RegisterStaff from "@/pages/admin/RegisterStaff";

// ── Manager pages ─────────────────────────────────────────────────────────────
import ManagerDashboard from "@/pages/manager/Dashboard";
import ManagerAttendance from "@/pages/manager/Attendance";
import ManagerTargets from "@/pages/manager/Targets";
import ManagerIncentives from "@/pages/manager/Incentives";
import ManagerNotices from "@/pages/manager/Notices";
import ManagerCourses from "@/pages/manager/Courses";
import ManagerStaff from "@/pages/manager/Staff";

// ── Staff pages ───────────────────────────────────────────────────────────────
import StaffDashboard from "@/pages/staff/Dashboard";
import StaffAttendance from "@/pages/staff/Attendance";
import StaffTargets from "@/pages/staff/Targets";
import StaffIncentives from "@/pages/staff/Incentives";
import StaffNotices from "@/pages/staff/Notices";
import StaffCourses from "@/pages/staff/Courses";
import StaffProfile from "@/pages/staff/Profile";

// ── Helpers ───────────────────────────────────────────────────────────────────

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <a href="/" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

/** Renders a different page component based on the logged-in role. */
function RolePage({
  admin,
  manager,
  staff,
}: {
  admin: React.ReactNode;
  manager: React.ReactNode;
  staff: React.ReactNode;
}) {
  const role = getSession()?.role;
  if (role === "manager") return <>{manager}</>;
  if (role === "staff") return <>{staff}</>;
  return <>{admin}</>;
}

/** Redirects to /dashboard unless the user has one of the allowed roles. */
function RoleGuard({
  allow,
  children,
}: {
  allow: Role[];
  children: React.ReactNode;
}) {
  const session = getSession();
  if (!session || !allow.includes(session.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

// ── App ───────────────────────────────────────────────────────────────────────

function App() {
  const session = getSession();

  return (
    <BrowserRouter>
      <Routes>
        {/* Root redirect */}
        <Route path="/" element={<Navigate to={session ? "/dashboard" : "/login"} replace />} />

        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected — all authenticated roles */}
        <Route element={<AuthLayout />}>

          {/* Role-aware pages */}
          <Route
            path="/dashboard"
            element={
              <RolePage
                admin={<AdminDashboard />}
                manager={<ManagerDashboard />}
                staff={<StaffDashboard />}
              />
            }
          />
          <Route
            path="/attendance"
            element={
              <RolePage
                admin={<AdminAttendance />}
                manager={<ManagerAttendance />}
                staff={<StaffAttendance />}
              />
            }
          />
          <Route
            path="/targets"
            element={
              <RolePage
                admin={<AdminTargets />}
                manager={<ManagerTargets />}
                staff={<StaffTargets />}
              />
            }
          />
          <Route
            path="/incentives"
            element={
              <RolePage
                admin={<AdminIncentives />}
                manager={<ManagerIncentives />}
                staff={<StaffIncentives />}
              />
            }
          />
          <Route
            path="/notices"
            element={
              <RolePage
                admin={<AdminNotices />}
                manager={<ManagerNotices />}
                staff={<StaffNotices />}
              />
            }
          />
          <Route
            path="/courses"
            element={
              <RolePage
                admin={<AdminCourses />}
                manager={<ManagerCourses />}
                staff={<StaffCourses />}
              />
            }
          />

          

          {/* Staff profile — staff only */}
          <Route
            path="/profile"
            element={
              <RoleGuard allow={["staff"]}>
                <StaffProfile />
              </RoleGuard>
            }
          />

          {/* Staff list & detail — admin + manager only */}
          <Route
            path="/staff"
            element={
              <RoleGuard allow={["admin", "manager"]}>
                <RolePage
                  admin={<AdminStaff />}
                  manager={<ManagerStaff />}
                  staff={<Navigate to="/dashboard" replace />}
                />
              </RoleGuard>
            }
          />
          <Route
            path="/staff/:staffId"
            element={
              <RoleGuard allow={["admin", "manager"]}>
                <StaffDetail />
              </RoleGuard>
            }
          />

          {/* Stores — list admin only, detail admin + manager */}
          <Route
            path="/stores"
            element={
              <RoleGuard allow={["admin"]}>
                <AdminStores />
              </RoleGuard>
            }
          />
          <Route
            path="/stores/:id"
            element={
              <RoleGuard allow={["admin", "manager"]}>
                <StoreDetail />
              </RoleGuard>
            }
          />

          {/* Managers list — admin only */}
          <Route
            path="/managers"
            element={
              <RoleGuard allow={["admin"]}>
                <AdminManagers />
              </RoleGuard>
            }
          />

          {/* Register — admin only */}
          <Route
            path="/register"
            element={
              <RoleGuard allow={["admin"]}>
                <Register />
              </RoleGuard>
            }
          >
            <Route index element={<Navigate to="/register/store" replace />} />
            <Route path="store" element={<RegisterStore />} />
            <Route path="manager" element={<RegisterManager />} />
            <Route path="staff" element={<RegisterStaff />} />
          </Route>

        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster richColors position="top-right" />
    </BrowserRouter>
  );
}

export default App;
