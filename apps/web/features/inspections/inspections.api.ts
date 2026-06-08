import { apiClient } from "@/lib/api-client";

export interface CreateInspectionInput {
  containerId: string;
  inspectionType: "ARRIVAL" | "DEPARTURE" | "PERIODIC";
  locationName: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
}

export interface ListInspectionsParams {
  page?: number;
  limit?: number;
  status?: string;
  containerId?: string;
  inspectionType?: string;
  locationName?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function createInspectionApi(input: CreateInspectionInput) {
  const res = await apiClient.post("/inspections", input);
  return res.data;
}

export async function listInspectionsApi(params: ListInspectionsParams = {}) {
  const res = await apiClient.get("/inspections", { params });
  return res.data;
}

export async function getInspectionDetailApi(id: string) {
  const res = await apiClient.get(`/inspections/${id}`);
  return res.data;
}

export async function submitInspectionApi(id: string) {
  const res = await apiClient.post(`/inspections/${id}/submit`);
  return res.data;
}

export async function updateInspectionStatusApi(id: string, status: "APPROVED" | "REJECTED" | "CLARIFICATION", comment?: string) {
  const res = await apiClient.patch(`/inspections/${id}/status`, { status, comment });
  return res.data;
}
