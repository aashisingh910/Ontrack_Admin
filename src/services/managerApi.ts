import { API_BASE_URL } from "@/lib/api";

const authHeaders = () => {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

async function handleResponse(res: Response) {
  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || "API request failed");
  }

  return data.data;
}

export const managerApi = {
  staff: async () => {
    const res = await fetch(`${API_BASE_URL}/manager/staff`, {
      headers: authHeaders(),
    });

    return handleResponse(res);
  },

  attendance: async (date: string) => {
    const res = await fetch(`${API_BASE_URL}/manager/attendance?date=${date}`, {
      headers: authHeaders(),
    });

    return handleResponse(res);
  },

  staffTargets: async (month = "2026-07") => {
    const res = await fetch(
      `${API_BASE_URL}/manager/staff-targets?month=${month}`,
      {
        headers: authHeaders(),
      }
    );

    return handleResponse(res);
  },

  assignStaffTarget: async (payload: {
    employeeCode: string;
    targetMonth: string;
    assignedTarget: number;
    categoryBreakup?: {
      furnitureTarget?: number;
      homewareTarget?: number;
      decorTarget?: number;
      servicesTarget?: number;
    };
    remarks?: string;
  }) => {
    const res = await fetch(`${API_BASE_URL}/manager/staff-targets`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });

    return handleResponse(res);
  },

  updateStaffTarget: async (
    targetId: string,
    payload: {
      assignedTarget?: number;
      categoryBreakup?: {
        furnitureTarget?: number;
        homewareTarget?: number;
        decorTarget?: number;
        servicesTarget?: number;
      };
      remarks?: string;
    }
  ) => {
    const res = await fetch(`${API_BASE_URL}/manager/staff-targets/${targetId}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });

    return handleResponse(res);
  },

  approveIncentive: async (incentiveId: string, remarks: string) => {
    const res = await fetch(
      `${API_BASE_URL}/manager/incentives/${incentiveId}/approve`,
      {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ remarks }),
      }
    );

    return handleResponse(res);
  },

  rejectIncentive: async (incentiveId: string, remarks: string) => {
    const res = await fetch(
      `${API_BASE_URL}/manager/incentives/${incentiveId}/reject`,
      {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ remarks }),
      }
    );

    return handleResponse(res);
  },

  sendIncentiveToAdmin: async (incentiveId: string, remarks: string) => {
    const res = await fetch(
      `${API_BASE_URL}/manager/incentives/${incentiveId}/send-to-admin`,
      {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ remarks }),
      }
    );

    return handleResponse(res);
  },

  assignStaffDailyTarget: async (payload: {
    employeeCode: string;
    targetDate: string;
    assignedDailyTarget: number;
    remarks?: string;
  }) => {
    const res = await fetch(`${API_BASE_URL}/manager/staff-daily-targets`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });

    return handleResponse(res);
  },
};
