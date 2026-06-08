"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { logoutApi } from "@/features/auth/auth.api";
import { listInspectionsApi } from "@/features/inspections/inspections.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api-client";

export default function ArchivePage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const [inspections, setInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<"GRID" | "LIST">("GRID");
  const [showFilters, setShowFilters] = useState(false);

  // Search & Filter state
  const [containerId, setContainerId] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [locationName, setLocationName] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 12;

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const params: any = {
        page,
        limit,
        containerId: containerId || undefined,
        status: status || undefined,
        inspectionType: type || undefined,
        locationName: locationName || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      };

      const res = await listInspectionsApi(params);
      if (res.success) {
        setInspections(res.data);
        if (res.meta) {
          setTotalPages(res.meta.totalPages || 1);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to load archive logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, status, type]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const handleClearFilters = () => {
    setContainerId("");
    setStatus("");
    setType("");
    setLocationName("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const triggerExport = async (format: "pdf" | "csv") => {
    try {
      const params = {
        containerId: containerId || undefined,
        status: status || undefined,
        inspectionType: type || undefined,
        locationName: locationName || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      };

      const res = await apiClient.get(`/reports/export/${format}`, {
        params,
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: format === "pdf" ? "application/pdf" : "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `inspection-report-${Date.now()}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      alert("Failed to export report document");
    }
  };

  async function handleLogout() {
    try {
      await logoutApi();
    } catch (e) {}
    logout();
    router.push("/login");
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex justify-between items-center border border-ink p-4 bg-substrate">
        <span className="telemetry font-bold text-ink">HISTORICAL_ARCHIVE // MON-SYS</span>
        <Button variant="outline" size="sm" onClick={handleLogout} className="telemetry">
          Exit Terminal
        </Button>
      </div>

      {/* Control Panel (Search, Filters, Export) */}
      <div className="border border-ink p-6 bg-substrate space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Search Container ID..."
            value={containerId}
            onChange={(e) => setContainerId(e.target.value.toUpperCase())}
            className="telemetry text-sm flex-1 bg-substrate border-ink border text-ink uppercase h-10"
          />
          <div className="flex gap-2">
            <Button type="submit" className="telemetry bg-ink text-white h-10 px-6">
              Search
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="telemetry h-10 px-4"
            >
              {showFilters ? "Hide Filters" : "Filters"}
            </Button>
          </div>
        </form>

        {/* Collapsible Filter Panel */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-ink/10 text-xs telemetry font-bold text-ink">
            <div className="space-y-1">
              <label>Status Badge</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full h-10 bg-substrate border border-ink px-2 outline-none"
              >
                <option value="">ALL STATUS</option>
                <option value="DRAFT">DRAFT</option>
                <option value="PENDING">PENDING</option>
                <option value="APPROVED">APPROVED</option>
                <option value="REJECTED">REJECTED</option>
                <option value="CLARIFICATION">CLARIFICATION</option>
              </select>
            </div>

            <div className="space-y-1">
              <label>Inspection Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full h-10 bg-substrate border border-ink px-2 outline-none"
              >
                <option value="">ALL TYPES</option>
                <option value="ARRIVAL">ARRIVAL</option>
                <option value="DEPARTURE">DEPARTURE</option>
                <option value="PERIODIC">PERIODIC</option>
              </select>
            </div>

            <div className="space-y-1">
              <label>Depot Name</label>
              <Input
                placeholder="Filter location..."
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="h-10 bg-substrate border border-ink"
              />
            </div>

            <div className="space-y-1">
              <label>Date Range (From - To)</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-1/2 h-10 bg-substrate border border-ink px-2 text-[10px]"
                />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-1/2 h-10 bg-substrate border border-ink px-2 text-[10px]"
                />
              </div>
            </div>

            <div className="md:col-span-4 flex justify-between pt-2">
              <button
                type="button"
                onClick={handleClearFilters}
                className="underline opacity-60 hover:opacity-100"
              >
                Clear All Filter Conditions
              </button>
              <Button type="button" onClick={loadData} className="bg-ink text-white px-4 h-8 text-[10px]">
                Apply Conditions
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-ink/10">
          <div className="flex gap-2 text-xs telemetry font-bold text-ink">
            <span>EXPORT RESULT AS:</span>
            <button onClick={() => triggerExport("pdf")} className="text-hazard hover:underline">
              [PDF DOCUMENT]
            </button>
            <button onClick={() => triggerExport("csv")} className="text-hazard hover:underline">
              [CSV SPREADSHEET]
            </button>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode("GRID")}
              className={`telemetry text-[10px] ${viewMode === "GRID" ? "bg-ink text-substrate" : ""}`}
            >
              Grid
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode("LIST")}
              className={`telemetry text-[10px] ${viewMode === "LIST" ? "bg-ink text-substrate" : ""}`}
            >
              List
            </Button>
          </div>
        </div>
      </div>

      {/* Main Results Listing */}
      {loading ? (
        <div className="telemetry text-center py-12 border border-ink bg-substrate">
          Reading historic repository records...
        </div>
      ) : error ? (
        <div className="telemetry text-center text-hazard py-12 border border-ink bg-substrate">
          {error}
        </div>
      ) : inspections.length === 0 ? (
        <div className="telemetry text-center py-12 border border-ink bg-substrate opacity-50">
          No records matched query parameters.
        </div>
      ) : viewMode === "GRID" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {inspections.map((item) => (
            <div
              key={item.id}
              onClick={() => router.push(user?.role === "ADMIN" ? `/admin/verification/${item.id}` : "#")}
              className="border border-ink p-4 bg-substrate flex flex-col justify-between hover:bg-ink hover:text-substrate transition-colors cursor-pointer group"
            >
              <div>
                <div className="text-lg font-black font-mono tracking-tight">{item.containerId}</div>
                <div className="flex flex-col mt-2 text-[9px] telemetry opacity-60 font-bold">
                  <span>DEPOT: {item.locationName}</span>
                  <span>TYPE: {item.inspectionType}</span>
                  <span>STAFF: {item.inspector?.fullName || item.inspectorId.slice(0, 8)}</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-ink/10 flex justify-between items-center text-[9px] telemetry font-bold">
                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                <span
                  className={`font-black ${
                    item.status === "APPROVED"
                      ? "text-green-600 group-hover:text-green-400"
                      : item.status === "REJECTED"
                      ? "text-hazard"
                      : "text-amber-500"
                  }`}
                >
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-ink bg-ink grid grid-cols-1 gap-px">
          {inspections.map((item) => (
            <div
              key={item.id}
              onClick={() => router.push(user?.role === "ADMIN" ? `/admin/verification/${item.id}` : "#")}
              className="bg-substrate p-4 flex justify-between items-center cursor-pointer hover:bg-ink hover:text-substrate transition-colors group"
            >
              <div>
                <div className="text-base font-bold font-mono">{item.containerId}</div>
                <div className="flex gap-4 text-[9px] telemetry opacity-60 font-bold mt-1">
                  <span>DEPOT: {item.locationName}</span>
                  <span>TYPE: {item.inspectionType}</span>
                  <span>STAFF: {item.inspector?.fullName || item.inspectorId.slice(0, 8)}</span>
                </div>
              </div>
              <div className="flex items-center gap-6 text-[10px] telemetry font-bold">
                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                <span
                  className={`font-black ${
                    item.status === "APPROVED"
                      ? "text-green-600 group-hover:text-green-400"
                      : item.status === "REJECTED"
                      ? "text-hazard"
                      : "text-amber-500"
                  }`}
                >
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6 border border-ink p-4 bg-substrate">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            className="telemetry text-[10px]"
          >
            « Prev Page
          </Button>
          <span className="telemetry text-[11px] font-bold text-ink">
            PAGE {page} OF {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            className="telemetry text-[10px]"
          >
            Next Page »
          </Button>
        </div>
      )}
    </div>
  );
}
