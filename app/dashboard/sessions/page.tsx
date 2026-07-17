"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../../../src/core/context/AuthContext";
import { scanSessionService, InvigilationSessionResponseDto, ItemScanSessionResponseDto } from "../../../src/features/sessions/services/scanSessionService";
import { schoolService } from "../../../src/features/schools/services/schoolService";
import { SchoolResponseDto } from "../../../src/core/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Badge,
  StatusBadge,
  Input,
  StatCard,
} from "../../../src/components/ui";
import {
  CrudPageTemplate,
  CrudTable,
  FilterDropdown,
} from "../../../src/components/framework";
import {
  QrCode,
  Calendar,
  School,
  User,
  Search,
  Eye,
  RefreshCw,
  Clock,
  MapPin,
  ClipboardList,
} from "lucide-react";
import { useToast } from "../../../src/components/ui/Toast";
import { useDebounce } from "../../../src/core/hooks";
import { Modal } from "../../../src/components/ui/Modal";

type LogTab = "scans" | "invigilation";

export default function SessionsLogPage() {
  const { success, error: toastError } = useToast();

  // Active Tab: Asset Scans or Classroom Check-ins
  const [activeTab, setActiveTab] = useState<LogTab>("scans");

  // Reference data
  const [schools, setSchools] = useState<SchoolResponseDto[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("");

  // Scan Logs State
  const [scanData, setScanData] = useState<ItemScanSessionResponseDto[]>([]);
  const [scanTotal, setScanTotal] = useState(0);
  const [scanPage, setScanPage] = useState(1);
  const [scanLimit] = useState(10);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  // Invigilation Logs State
  const [invData, setInvData] = useState<InvigilationSessionResponseDto[]>([]);
  const [invTotal, setInvTotal] = useState(0);
  const [invPage, setInvPage] = useState(1);
  const [invLimit] = useState(10);
  const [invLoading, setInvLoading] = useState(false);
  const [invError, setInvError] = useState<string | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Details Modal States
  const [selectedScan, setSelectedScan] = useState<ItemScanSessionResponseDto | null>(null);
  const [selectedInv, setSelectedInv] = useState<InvigilationSessionResponseDto | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Preload schools list (required for items scans query parameter)
  const fetchSchools = useCallback(async () => {
    try {
      const response = await schoolService.findAll({ page: 1, limit: 100 });
      setSchools(response.items || []);
      if (response.items && response.items.length > 0) {
        setSelectedSchoolId(response.items[0].id);
      }
    } catch (err) {
      console.error("Failed to preload schools list for scans filter:", err);
    }
  }, []);

  // Fetch Item Scans (Requires schoolId)
  const fetchScanSessions = useCallback(async () => {
    if (!selectedSchoolId) return;
    setScanLoading(true);
    setScanError(null);
    try {
      const response = await scanSessionService.findItemScanSessions({
        page: scanPage,
        limit: scanLimit,
        schoolId: selectedSchoolId,
      });
      setScanData(response.items || []);
      setScanTotal(response.total || 0);
    } catch (err: any) {
      setScanError(err.message || "Failed to load scan sessions.");
    } finally {
      setScanLoading(false);
    }
  }, [scanPage, scanLimit, selectedSchoolId]);

  // Fetch Invigilation Sessions
  const fetchInvigilation = useCallback(async () => {
    setInvLoading(true);
    setInvError(null);
    try {
      const response = await scanSessionService.findInvigilationSessions({
        page: invPage,
        limit: invLimit,
        search: debouncedSearch || undefined,
      });
      setInvData(response.items || []);
      setInvTotal(response.total || 0);
    } catch (err: any) {
      setInvError(err.message || "Failed to load invigilation sessions.");
    } finally {
      setInvLoading(false);
    }
  }, [invPage, invLimit, debouncedSearch]);

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  useEffect(() => {
    if (activeTab === "scans") {
      fetchScanSessions();
    } else {
      fetchInvigilation();
    }
  }, [activeTab, fetchScanSessions, fetchInvigilation]);

  // Handle Tab Switch
  const handleTabChange = (tab: LogTab) => {
    setActiveTab(tab);
    setSearchQuery("");
  };

  const handleOpenScanDetails = (scan: ItemScanSessionResponseDto) => {
    setSelectedScan(scan);
    setSelectedInv(null);
    setIsDetailOpen(true);
  };

  const handleOpenInvDetails = (inv: InvigilationSessionResponseDto) => {
    setSelectedInv(inv);
    setSelectedScan(null);
    setIsDetailOpen(true);
  };

  // Columns definition for Scan Logs
  const scanColumns = useMemo(() => [
    {
      id: "scannedAt",
      header: "Scanned Time",
      cell: (row: ItemScanSessionResponseDto) => (
        <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          {new Date(row.scannedAt).toLocaleString()}
        </span>
      ),
    },
    {
      id: "item",
      header: "Scanned Item",
      cell: (row: ItemScanSessionResponseDto) => (
        <div className="flex flex-col">
          <span className="font-bold text-foreground text-xs leading-none">{row.item?.name}</span>
          <span className="text-[10px] text-muted-foreground mt-1 font-mono">SKU: {row.item?.sku || "N/A"}</span>
        </div>
      ),
    },
    {
      id: "school",
      header: "Target School",
      cell: (row: ItemScanSessionResponseDto) => (
        <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
          <School className="h-3.5 w-3.5 text-primary/70" />
          {row.school?.schoolName}
        </span>
      ),
    },
    {
      id: "user",
      header: "Scanner Operator",
      cell: (row: ItemScanSessionResponseDto) => (
        <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
          <User className="h-3.5 w-3.5 text-muted-foreground" />
          {row.user?.name || `${row.user?.firstName} ${row.user?.lastName}`}
        </span>
      ),
    },
  ], []);

  // Columns definition for Invigilation Logs
  const invColumns = useMemo(() => [
    {
      id: "checkedInAt",
      header: "Checked-in Time",
      cell: (row: InvigilationSessionResponseDto) => (
        <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          {new Date(row.checkedInAt).toLocaleString()}
        </span>
      ),
    },
    {
      id: "invigilator",
      header: "Invigilator Name",
      cell: (row: InvigilationSessionResponseDto) => (
        <div className="flex flex-col">
          <span className="font-bold text-foreground text-xs leading-none">{row.invigilatorName}</span>
          <span className="text-[10px] text-muted-foreground mt-1 font-semibold">{row.phoneNumber || "No phone"}</span>
        </div>
      ),
    },
    {
      id: "school",
      header: "School",
      cell: (row: InvigilationSessionResponseDto) => (
        <span className="text-xs font-semibold text-muted-foreground">
          {row.school?.schoolName}
        </span>
      ),
    },
    {
      id: "classroom",
      header: "Room Assigned",
      cell: (row: InvigilationSessionResponseDto) => (
        <Badge variant="secondary" className="text-[10px] font-bold uppercase">
          {row.classroom?.name}
        </Badge>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (row: InvigilationSessionResponseDto) => (
        <StatusBadge status={row.sessionStatus === "CHECKED_IN" ? "active" : "inactive"} labels={{ active: row.sessionStatus, inactive: row.sessionStatus }} />
      ),
    },
  ], []);

  const { user } = useAuth();
  const isDeptAdmin = user?.role?.slug === "admin";

  if (isDeptAdmin) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* 1. Header */}
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-slate-900">Activity Scan Logs</h1>
          <p className="text-xs text-slate-500">
            Review asset scans and invigilation check-in records.
          </p>
        </div>

        {/* 2. Compact Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="border border-slate-200 bg-white p-5 rounded-lg shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500">Total Asset Scans</span>
              <h3 className="text-xl font-bold text-slate-900">{scanTotal.toLocaleString()}</h3>
              <p className="text-[11px] text-slate-400">Items checked in system wide</p>
            </div>
            <div className="text-slate-400 p-2.5 bg-slate-50 rounded-lg shrink-0">
              <QrCode className="h-5 w-5 text-blue-600" />
            </div>
          </div>

          <div className="border border-slate-200 bg-white p-5 rounded-lg shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500">Total Check-Ins</span>
              <h3 className="text-xl font-bold text-slate-900">{invTotal.toLocaleString()}</h3>
              <p className="text-[11px] text-slate-400">Invigilator sessions logged</p>
            </div>
            <div className="text-slate-400 p-2.5 bg-slate-50 rounded-lg shrink-0">
              <ClipboardList className="h-5 w-5 text-emerald-600" />
            </div>
          </div>

          <div className="border border-slate-200 bg-white p-5 rounded-lg shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500">Monitoring Status</span>
              <h3 className="text-xl font-bold text-slate-900">Active</h3>
              <p className="text-[11px] text-slate-400">All logs fully synchronized</p>
            </div>
            <div className="text-slate-400 p-2.5 bg-slate-50 rounded-lg shrink-0">
              <RefreshCw className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>

        {/* 3. Filter/Control Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-2">
          {/* Tab Navigation */}
          <div className="flex gap-4">
            <button
              onClick={() => handleTabChange("scans")}
              className={`pb-2 px-1 text-xs font-semibold tracking-wide transition-all cursor-pointer border-b-2 ${
                activeTab === "scans"
                  ? "border-blue-600 text-blue-600 font-bold"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              Asset Scan Logs
            </button>
            <button
              onClick={() => handleTabChange("invigilation")}
              className={`pb-2 px-1 text-xs font-semibold tracking-wide transition-all cursor-pointer border-b-2 ${
                activeTab === "invigilation"
                  ? "border-blue-600 text-blue-600 font-bold"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              Invigilation Check-ins
            </button>
          </div>

          {/* School Selector / Search */}
          <div className="flex items-center gap-3 self-end sm:self-center">
            {activeTab === "scans" && schools.length > 0 && (
              <div className="w-64">
                <FilterDropdown
                  label="Filter School"
                  selected={selectedSchoolId}
                  onChange={(val) => setSelectedSchoolId(String(val || ""))}
                  options={schools.map((s) => ({ label: s.schoolName, value: s.id }))}
                />
              </div>
            )}
            {activeTab === "invigilation" && (
              <div className="w-64">
                <Input
                  placeholder="Search invigilator..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 text-xs rounded border-slate-200 bg-white"
                />
              </div>
            )}
          </div>
        </div>

        {/* 4. Table */}
        {activeTab === "scans" ? (
          <CrudTable
            columns={scanColumns}
            data={scanData}
            idKey="id"
            isLoading={scanLoading}
            error={scanError}
            emptyMessage="No asset scan logs found. Please select a different school."
            page={scanPage}
            pageSize={scanLimit}
            totalPages={Math.ceil(scanTotal / scanLimit)}
            onPageChange={setScanPage}
            onRefresh={fetchScanSessions}
            rowActions={(row) => (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenScanDetails(row)}
                className="w-full justify-start gap-2 text-xs font-semibold px-2"
              >
                <Eye className="h-3.5 w-3.5 text-muted-foreground" /> View Log Details
              </Button>
            )}
          />
        ) : (
          <CrudTable
            columns={invColumns}
            data={invData}
            idKey="id"
            isLoading={invLoading}
            error={invError}
            emptyMessage="No classroom check-in logs found."
            page={invPage}
            pageSize={invLimit}
            totalPages={Math.ceil(invTotal / invLimit)}
            onPageChange={setInvPage}
            onRefresh={fetchInvigilation}
            rowActions={(row) => (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenInvDetails(row)}
                className="w-full justify-start gap-2 text-xs font-semibold px-2"
              >
                <Eye className="h-3.5 w-3.5 text-muted-foreground" /> View Log Details
              </Button>
            )}
          />
        )}

        {/* DETAIL MODAL */}
        {isDetailOpen && (
          <Modal
            isOpen={true}
            onClose={() => setIsDetailOpen(false)}
            size="md"
            title="Activity Log Details"
            footer={
              <Button variant="outline" size="sm" onClick={() => setIsDetailOpen(false)}>
                Close
              </Button>
            }
          >
            {selectedScan && (
              <div className="space-y-4 py-2">
                <div className="bg-secondary/35 p-4 rounded-xl border border-border/40 text-center">
                  <QrCode className="h-10 w-10 text-primary mx-auto mb-2" />
                  <h4 className="text-xs font-black text-foreground uppercase tracking-wide">Scanned Item</h4>
                  <p className="text-sm font-extrabold text-primary">{selectedScan.item?.name}</p>
                  <p className="text-[10px] font-mono text-muted-foreground">SKU: {selectedScan.item?.sku || "N/A"}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-muted-foreground">
                  <div className="flex flex-col">
                    <span>Operator</span>
                    <span className="font-bold text-foreground mt-0.5">{selectedScan.user?.name || `${selectedScan.user?.firstName} ${selectedScan.user?.lastName}`}</span>
                    <span className="text-[10px] text-muted-foreground">{selectedScan.user?.email}</span>
                  </div>
                  <div className="flex flex-col">
                    <span>School Location</span>
                    <span className="font-bold text-foreground mt-0.5">{selectedScan.school?.schoolName}</span>
                    <span className="text-[10px] text-muted-foreground">Code: {selectedScan.school?.schoolId}</span>
                  </div>
                </div>

                <div className="border-t border-border/40 pt-3 flex justify-between text-[10px] font-bold text-muted-foreground">
                  <span>Scanned At Time:</span>
                  <span className="text-foreground">{new Date(selectedScan.scannedAt).toLocaleString()}</span>
                </div>
              </div>
            )}

            {selectedInv && (
              <div className="space-y-4 py-2">
                <div className="bg-secondary/35 p-4 rounded-xl border border-border/40 text-center">
                  <User className="h-10 w-10 text-primary mx-auto mb-2" />
                  <h4 className="text-xs font-black text-foreground uppercase tracking-wide">Invigilator Check-In</h4>
                  <p className="text-sm font-extrabold text-primary">{selectedInv.invigilatorName}</p>
                  <p className="text-[10px] font-mono text-muted-foreground">{selectedInv.phoneNumber || "No phone listed"}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-muted-foreground">
                  <div className="flex flex-col">
                    <span>School Venue</span>
                    <span className="font-bold text-foreground mt-0.5">{selectedInv.school?.schoolName}</span>
                    <span className="text-[10px] text-muted-foreground">Code: {selectedInv.school?.schoolId}</span>
                  </div>
                  <div className="flex flex-col">
                    <span>Classroom / Room</span>
                    <span className="font-bold text-foreground mt-0.5">{selectedInv.classroom?.name}</span>
                    <span className="text-[10px] text-muted-foreground">ID: {selectedInv.classroom?.classroomId}</span>
                  </div>
                </div>

                <div className="border-t border-border/40 pt-3 flex justify-between text-[10px] font-bold text-muted-foreground">
                  <span>Session Status:</span>
                  <Badge variant={selectedInv.sessionStatus === "CHECKED_IN" ? "success" : "secondary"}>
                    {selectedInv.sessionStatus}
                  </Badge>
                </div>
                <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                  <span>Checked-in At Time:</span>
                  <span className="text-foreground">{new Date(selectedInv.checkedInAt).toLocaleString()}</span>
                </div>
              </div>
            )}
          </Modal>
        )}
      </div>
    );
  }

  return (
    <CrudPageTemplate
      title="Activity Scan Logs"
      description="Review asset scans and invigilation check-in records."
      searchQuery={activeTab === "invigilation" ? searchQuery : ""}
      onSearchChange={activeTab === "invigilation" ? setSearchQuery : undefined}
      searchPlaceholder="Search by invigilator name or school..."
      filters={
        activeTab === "scans" && schools.length > 0 ? (
          <FilterDropdown
            label="Filter School"
            selected={selectedSchoolId}
            onChange={(val) => setSelectedSchoolId(String(val || ""))}
            options={schools.map((s) => ({ label: s.schoolName, value: s.id }))}
          />
        ) : undefined
      }
      stats={
        <>
          <StatCard title="Total asset scans" value={scanTotal} description="Items checked in system wide" icon={<QrCode className="h-5 w-5 text-primary" />} />
          <StatCard title="Total check-ins" value={invTotal} description="Invigilator sessions logged" icon={<ClipboardList className="h-5 w-5 text-emerald-500" />} className="border-l-emerald-500/30" />
          <StatCard title="Monitoring status" value="Active" description="All logs fully synchronized" icon={<RefreshCw className="h-5 w-5 text-blue-500" />} />
        </>
      }
    >
      {/* Dual Tab navigation */}
      <div className="flex border-b border-border/40 gap-4 mb-4 pb-2">
        <button
          onClick={() => handleTabChange("scans")}
          className={`px-4 py-2 text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === "scans" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Asset Scan Logs
        </button>
        <button
          onClick={() => handleTabChange("invigilation")}
          className={`px-4 py-2 text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === "invigilation" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Invigilation Check-ins
        </button>
      </div>

      {activeTab === "scans" ? (
        <CrudTable
          columns={scanColumns}
          data={scanData}
          idKey="id"
          isLoading={scanLoading}
          error={scanError}
          emptyMessage="No asset scan logs found. Please select a different school."
          page={scanPage}
          pageSize={scanLimit}
          totalPages={Math.ceil(scanTotal / scanLimit)}
          onPageChange={setScanPage}
          onRefresh={fetchScanSessions}
          rowActions={(row) => (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenScanDetails(row)}
              className="w-full justify-start gap-2 text-xs font-semibold px-2"
            >
              <Eye className="h-3.5 w-3.5 text-muted-foreground" /> View Log Details
            </Button>
          )}
        />
      ) : (
        <CrudTable
          columns={invColumns}
          data={invData}
          idKey="id"
          isLoading={invLoading}
          error={invError}
          emptyMessage="No classroom check-in logs found."
          page={invPage}
          pageSize={invLimit}
          totalPages={Math.ceil(invTotal / invLimit)}
          onPageChange={setInvPage}
          onRefresh={fetchInvigilation}
          rowActions={(row) => (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenInvDetails(row)}
              className="w-full justify-start gap-2 text-xs font-semibold px-2"
            >
              <Eye className="h-3.5 w-3.5 text-muted-foreground" /> View Log Details
            </Button>
          )}
        />
      )}

      {/* DETAIL MODAL */}
      {isDetailOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsDetailOpen(false)}
          size="md"
          title="Activity Log Details"
          footer={
            <Button variant="outline" size="sm" onClick={() => setIsDetailOpen(false)}>
              Close
            </Button>
          }
        >
          {selectedScan && (
            <div className="space-y-4 py-2">
              <div className="bg-secondary/35 p-4 rounded-xl border border-border/40 text-center">
                <QrCode className="h-10 w-10 text-primary mx-auto mb-2" />
                <h4 className="text-xs font-black text-foreground uppercase tracking-wide">Scanned Item</h4>
                <p className="text-sm font-extrabold text-primary">{selectedScan.item?.name}</p>
                <p className="text-[10px] font-mono text-muted-foreground">SKU: {selectedScan.item?.sku || "N/A"}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-muted-foreground">
                <div className="flex flex-col">
                  <span>Operator</span>
                  <span className="font-bold text-foreground mt-0.5">{selectedScan.user?.name || `${selectedScan.user?.firstName} ${selectedScan.user?.lastName}`}</span>
                  <span className="text-[10px] text-muted-foreground">{selectedScan.user?.email}</span>
                </div>
                <div className="flex flex-col">
                  <span>School Location</span>
                  <span className="font-bold text-foreground mt-0.5">{selectedScan.school?.schoolName}</span>
                  <span className="text-[10px] text-muted-foreground">Code: {selectedScan.school?.schoolId}</span>
                </div>
              </div>

              <div className="border-t border-border/40 pt-3 flex justify-between text-[10px] font-bold text-muted-foreground">
                <span>Scanned At Time:</span>
                <span className="text-foreground">{new Date(selectedScan.scannedAt).toLocaleString()}</span>
              </div>
            </div>
          )}

          {selectedInv && (
            <div className="space-y-4 py-2">
              <div className="bg-secondary/35 p-4 rounded-xl border border-border/40 text-center">
                <User className="h-10 w-10 text-primary mx-auto mb-2" />
                <h4 className="text-xs font-black text-foreground uppercase tracking-wide">Invigilator Check-In</h4>
                <p className="text-sm font-extrabold text-primary">{selectedInv.invigilatorName}</p>
                <p className="text-[10px] font-mono text-muted-foreground">{selectedInv.phoneNumber || "No phone listed"}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-muted-foreground">
                <div className="flex flex-col">
                  <span>School Venue</span>
                  <span className="font-bold text-foreground mt-0.5">{selectedInv.school?.schoolName}</span>
                  <span className="text-[10px] text-muted-foreground">Code: {selectedInv.school?.schoolId}</span>
                </div>
                <div className="flex flex-col">
                  <span>Classroom / Room</span>
                  <span className="font-bold text-foreground mt-0.5">{selectedInv.classroom?.name}</span>
                  <span className="text-[10px] text-muted-foreground">ID: {selectedInv.classroom?.classroomId}</span>
                </div>
              </div>

              <div className="border-t border-border/40 pt-3 flex justify-between text-[10px] font-bold text-muted-foreground">
                <span>Session Status:</span>
                <Badge variant={selectedInv.sessionStatus === "CHECKED_IN" ? "success" : "secondary"}>
                  {selectedInv.sessionStatus}
                </Badge>
              </div>
              <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                <span>Checked-in At Time:</span>
                <span className="text-foreground">{new Date(selectedInv.checkedInAt).toLocaleString()}</span>
              </div>
            </div>
          )}
        </Modal>
      )}
    </CrudPageTemplate>
  );
}
