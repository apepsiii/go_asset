import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  try {
    const clerk = await import("@clerk/react");
    // Try to get token using getAuth() or from window.__clerk
    let token = null;
    
    if (clerk.useAuth) {
      // Clerk is loaded, try to get token from window if available
      const clerkWindow = (window as any).__clerk;
      if (clerkWindow?.client?.sessions?.length > 0) {
        const session = clerkWindow.client.sessions[0];
        // Use the session's token
        token = session.token?.jwt || null;
      }
    }
    
    if (!token && clerk.getToken) {
      try {
        token = await clerk.getToken();
      } catch {
        // getToken might not work outside component context
      }
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // Clerk not available or error
    console.debug("Clerk not available for auth:", e);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = "/sign-in";
    }
    return Promise.reject(error);
  }
);

export interface Category {
  id: number;
  name: string;
  created_at: string;
}

export interface BudgetSource {
  id: number;
  name: string;
  created_at: string;
}

export interface Location {
  id: number;
  name: string;
  created_at: string;
}

export interface Asset {
  id: number;
  category_id: number | null;
  budget_source_id: number | null;
  location_id: number | null;
  code: string;
  name: string;
  specification: string;
  specifications: string;
  photo_url: string;
  condition: "OK" | "RUSAK_RINGAN" | "RUSAK_TOTAL" | "MAINTENANCE";
  purchase_date: string | null;
  price: number | null;
  warranty_expiry: string | null;
  useful_life_years: number;
  salvage_value: number;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceLog {
  id: number;
  asset_id: number;
  action_date: string;
  description: string;
  technician_name: string;
  cost: number;
}

export interface UpgradeLog {
  id: number;
  asset_id: number;
  upgrade_date: string;
  description: string;
}

export interface DashboardStats {
  total_assets: number;
  ok_count: number;
  rusak_ringan_count: number;
  rusak_total_count: number;
  maintenance_count: number;
  total_value: number;
  by_category: CategoryStat[];
  by_location: LocationStat[];
  by_budget_source: BudgetStat[];
}

export interface CategoryStat {
  name: string;
  count: number;
}

export interface LocationStat {
  name: string;
  count: number;
}

export interface BudgetStat {
  name: string;
  count: number;
  total_value: number;
}

export interface WarrantyAlert {
  asset: Asset;
  days_remaining: number;
}

export interface BrokenAssetAlert {
  asset: Asset;
  maintenance_count: number;
  last_maintenance: string | null;
}

export interface NotificationSummary {
  warranty_expiring: WarrantyAlert[];
  broken_assets: BrokenAssetAlert[];
  total_ok: number;
  total_broken: number;
}

export interface AuditLog {
  id: number;
  user_id: string;
  action: string;
  resource: string;
  resource_id: string;
  details: string;
  ip_address: string;
  created_at: string;
}

export interface ImportResult {
  total: number;
  success: number;
  failed: number;
  errors: string[];
}

export interface Loan {
  id: number;
  asset_id: number;
  borrower_name: string;
  borrower_contact: string;
  loan_date: string;
  due_date: string;
  return_date: string | null;
  status: "BORROWED" | "RETURNED" | "OVERDUE";
  condition_at_loan: string;
  condition_at_return: string;
  notes: string;
  loaner_id: string;
  created_at: string;
}

export interface LoanWithAsset extends Loan {
  asset_code: string;
  asset_name: string;
}

export interface LoanStats {
  active: number;
  overdue: number;
  returned: number;
  available: number;
  total_assets: number;
}

export interface DepreciationInfo {
  asset_id: number;
  asset_code: string;
  asset_name: string;
  purchase_price: number;
  current_value: number;
  salvage_value: number;
  useful_life_years: number;
  age_in_years: number;
  annual_depreciation: number;
  accumulated_depreciation: number;
  remaining_life_years: number;
  status: "healthy" | "depreciated" | "fully_depreciated";
}

export interface DepreciationSummary {
  total_assets: number;
  total_purchase_value: number;
  total_current_value: number;
  total_depreciation: number;
  healthy_count: number;
  depreciated_count: number;
  fully_depreciated_count: number;
  assets: DepreciationInfo[];
}

export const categoryApi = {
  getAll: () => api.get<Category[]>("/api/categories"),
  getById: (id: number) => api.get<Category>(`/api/categories/${id}`),
  create: (data: { name: string }) => api.post<Category>("/api/categories", data),
  update: (id: number, data: { name: string }) =>
    api.put<Category>(`/api/categories/${id}`, data),
  delete: (id: number) => api.delete(`/api/categories/${id}`),
};

export const budgetSourceApi = {
  getAll: () => api.get<BudgetSource[]>("/api/budget-sources"),
  getById: (id: number) => api.get<BudgetSource>(`/api/budget-sources/${id}`),
  create: (data: { name: string }) =>
    api.post<BudgetSource>("/api/budget-sources", data),
  update: (id: number, data: { name: string }) =>
    api.put<BudgetSource>(`/api/budget-sources/${id}`, data),
  delete: (id: number) => api.delete(`/api/budget-sources/${id}`),
};

export const locationApi = {
  getAll: () => api.get<Location[]>("/api/locations"),
  getById: (id: number) => api.get<Location>(`/api/locations/${id}`),
  create: (data: { name: string }) =>
    api.post<Location>("/api/locations", data),
  update: (id: number, data: { name: string }) =>
    api.put<Location>(`/api/locations/${id}`, data),
  delete: (id: number) => api.delete(`/api/locations/${id}`),
};

export const assetApi = {
  getAll: () => api.get<Asset[]>("/api/assets"),
  getById: (id: number) => api.get<Asset>(`/api/assets/${id}`),
  create: (data: Partial<Asset>) => api.post<Asset>("/api/assets", data),
  update: (id: number, data: Partial<Asset>) =>
    api.put<Asset>(`/api/assets/${id}`, data),
  delete: (id: number) => api.delete(`/api/assets/${id}`),
  bulkUpdateCondition: (assetIds: number[], condition: string) =>
    api.post("/api/assets/bulk/update-condition", { asset_ids: assetIds, condition }),
  bulkDelete: (assetIds: number[]) =>
    api.post("/api/assets/bulk/delete", { asset_ids: assetIds }),
  bulkUpdateLocation: (assetIds: number[], locationId: number) =>
    api.post("/api/assets/bulk/update-location", { asset_ids: assetIds, location_id: locationId }),
  getDepreciation: (id: number) =>
    api.get<DepreciationInfo>(`/api/assets/${id}/depreciation`),
  getAllDepreciations: () =>
    api.get<DepreciationSummary>("/api/depreciations"),
  generateCode: (categoryId: number) =>
    api.get<{ code: string }>(`/api/assets/generate-code?category_id=${categoryId}`),
};

export const uploadApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append("photo", file);
    return api.post<{ url: string }>("/api/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};

export const maintenanceLogApi = {
  getByAssetId: (assetId: number) =>
    api.get<MaintenanceLog[]>(`/api/assets/${assetId}/maintenance-logs`),
  create: (assetId: number, data: Partial<MaintenanceLog>) =>
    api.post<MaintenanceLog>(`/api/assets/${assetId}/maintenance-logs`, data),
  delete: (id: number) => api.delete(`/api/maintenance-logs/${id}`),
};

export const upgradeLogApi = {
  getByAssetId: (assetId: number) =>
    api.get<UpgradeLog[]>(`/api/assets/${assetId}/upgrade-logs`),
  create: (assetId: number, data: Partial<UpgradeLog>) =>
    api.post<UpgradeLog>(`/api/assets/${assetId}/upgrade-logs`, data),
  delete: (id: number) => api.delete(`/api/upgrade-logs/${id}`),
};

export const qrCodeApi = {
  getByAssetId: (assetId: number) =>
    api.get<{ qr_code: string; url: string }>(`/api/assets/${assetId}/qrcode`),
};

export const labelApi = {
  getPdfUrl: (assetId: number) => `${API_BASE_URL}/api/assets/${assetId}/label/pdf`,
};

export const statsApi = {
  getDashboard: () => api.get<DashboardStats>("/api/stats/dashboard"),
};

export const auditLogApi = {
  getAll: (resource?: string) =>
    api.get<AuditLog[]>("/api/audit-logs", { params: resource ? { resource } : {} }),
};

export const notificationApi = {
  getSummary: (warrantyDays = 30) =>
    api.get<NotificationSummary>("/api/notifications/summary", {
      params: { warranty_days: warrantyDays },
    }),
  getWarrantyAlerts: (days = 30) =>
    api.get<WarrantyAlert[]>("/api/notifications/warranty", {
      params: { days },
    }),
  getBrokenAssets: () =>
    api.get<BrokenAssetAlert[]>("/api/notifications/broken-assets"),
};

export const exportApi = {
  getCsvUrl: () => `${API_BASE_URL}/api/export/assets/csv`,
};

export const importApi = {
  importCsv: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post<ImportResult>("/api/import/assets/csv", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

export const loanApi = {
  create: (data: {
    asset_id: number;
    borrower_name: string;
    borrower_contact?: string;
    loan_date: string;
    due_date: string;
    condition_at_loan?: string;
    notes?: string;
  }) => api.post<LoanWithAsset>("/api/loans", data),

  getAll: (params?: { status?: string; asset_id?: string; limit?: number }) =>
    api.get<LoanWithAsset[]>("/api/loans", { params }),

  getById: (id: number) => api.get<LoanWithAsset>(`/api/loans/${id}`),

  return: (id: number, data: {
    return_date?: string;
    condition_at_return?: string;
    notes?: string;
  }) => api.put<LoanWithAsset>(`/api/loans/${id}/return`, data),

  getActive: () => api.get<LoanWithAsset[]>("/api/loans/active"),

  getOverdue: () => api.get<LoanWithAsset[]>("/api/loans/overdue"),

  getAvailableAssets: () => api.get<Asset[]>("/api/assets/available"),

  getStats: () => api.get<LoanStats>("/api/loans/stats"),

  getByAssetId: (assetId: number) =>
    api.get<LoanWithAsset[]>("/api/loans", { params: { asset_id: assetId.toString() } }),
};

export interface CurrentUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  image_url: string;
  role: "admin" | "user";
}

export const userApi = {
  getCurrentUser: () => api.get<CurrentUser>("/api/me"),
};

export default api;
