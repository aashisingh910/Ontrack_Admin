export type Role = "admin" | "manager" | "staff";

export type Session = {
  role: Role;
  email: string;
  name: string;
  token?: string;
  employeeCode?: string;
  contactNumber?: string;
  storeCode?: string;
  storeName?: string;
  city?: string;
  region?: string;
};

const SESSION_KEY = "ontrack_session";

export function setSession(session: Session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getSession(): Session | null {
  const raw = localStorage.getItem(SESSION_KEY);

  if (!raw) return null;

  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("userName");
}