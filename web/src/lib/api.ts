import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

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
  photo_url: string;
  condition: "OK" | "RUSAK_RINGAN" | "RUSAK_TOTAL" | "MAINTENANCE";
  purchase_date: string | null;
  price: number | null;
  warranty_expiry: string | null;
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

export default api;
