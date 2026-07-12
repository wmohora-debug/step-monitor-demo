"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { sessionWeekService, SessionWeekResponseDto } from "../../../src/features/sessions/services/sessionWeekService";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Badge,
  Input,
  StatCard,
} from "../../../src/components/ui";
import {
  CrudPageTemplate,
  CrudTable,
} from "../../../src/components/framework";
import {
  Calendar,
  Plus,
  Edit2,
  Info,
  Clock,
  Layers,
  ArrowRight,
} from "lucide-react";
import { useToast } from "../../../src/components/ui/Toast";
import { Modal } from "../../../src/components/ui/Modal";

export default function SessionWeeksPage() {
  const { success, error: toastError } = useToast();

  // State lists
  const [data, setData] = useState<SessionWeekResponseDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Form states
  const [selectedWeek, setSelectedWeek] = useState<SessionWeekResponseDto | null>(null);
  const [description, setDescription] = useState("");
  
  // Generation form states
  const [startDate, setStartDate] = useState("");
  const [totalWeeks, setTotalWeeks] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load list
  const fetchSessionWeeks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await sessionWeekService.findSessionWeeks({
        page,
        limit,
        sortBy: "weekNumber",
        sortOrder: "asc",
      });
      setData(response.items || []);
      setTotal(response.total || 0);
    } catch (err: any) {
      setError(err.message || "Failed to load session weeks.");
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchSessionWeeks();
  }, [fetchSessionWeeks]);

  // Bulk Generate handler
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || totalWeeks < 1) {
      toastError("Please fill out all required fields.");
      return;
    }
    setIsSubmitting(true);
    try {
      await sessionWeekService.createSessionWeeks({
        startDate,
        totalWeeks: Number(totalWeeks),
      });
      success("Session weeks generated successfully.");
      setIsGenerateOpen(false);
      fetchSessionWeeks();
    } catch (err: any) {
      toastError(err.message || "Failed to generate session weeks.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit description handler
  const handleEdit = (week: SessionWeekResponseDto) => {
    setSelectedWeek(week);
    setDescription(week.description || "");
    setIsEditOpen(true);
  };

  const handleUpdateDescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWeek) return;
    setIsSubmitting(true);
    try {
      await sessionWeekService.updateSessionWeekDescription(selectedWeek.id, {
        description: description || null,
      });
      success(`Updated week ${selectedWeek.weekNumber} description.`);
      setIsEditOpen(false);
      fetchSessionWeeks();
    } catch (err: any) {
      toastError(err.message || "Failed to update description.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDetails = (week: SessionWeekResponseDto) => {
    setSelectedWeek(week);
    setIsDetailsOpen(true);
  };

  // Columns mapping
  const columns = useMemo(() => [
    {
      id: "weekNumber",
      header: "Week ID",
      cell: (row: SessionWeekResponseDto) => (
        <Badge variant="default" className="text-xs font-black px-2 py-0.5">
          Week {row.weekNumber}
        </Badge>
      ),
    },
    {
      id: "duration",
      header: "Interval Span",
      cell: (row: SessionWeekResponseDto) => (
        <div className="flex items-center gap-2 text-xs font-bold text-foreground">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{row.startDate}</span>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <span>{row.endDate}</span>
        </div>
      ),
    },
    {
      id: "description",
      header: "Description / Objective",
      cell: (row: SessionWeekResponseDto) => (
        <span className="text-xs font-medium text-muted-foreground line-clamp-1">
          {row.description || <span className="italic text-muted-foreground/50">No description set</span>}
        </span>
      ),
    },
    {
      id: "createdAt",
      header: "Created Time",
      cell: (row: SessionWeekResponseDto) => (
        <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ], []);

  return (
    <CrudPageTemplate
      title="Session Weeks manager"
      description="Manage global academic session intervals and learning week definitions."
      primaryAction={{
        label: "Bulk Generate Weeks",
        onClick: () => setIsGenerateOpen(true),
        icon: Plus,
      }}
      stats={
        <>
          <StatCard title="Total Defined Weeks" value={total} description="Registered academic session weeks" icon={<Layers className="h-5 w-5 text-primary" />} />
          <StatCard title="Current Track" value={total > 0 ? `Week ${data[data.length - 1]?.weekNumber || total}` : "None"} description="Latest generated week" icon={<Calendar className="h-5 w-5 text-emerald-500" />} />
        </>
      }
    >
      <CrudTable
        columns={columns}
        data={data}
        idKey="id"
        isLoading={loading}
        error={error}
        emptyMessage="No session weeks defined. Click 'Bulk Generate Weeks' to construct your calendar."
        page={page}
        pageSize={limit}
        totalPages={Math.ceil(total / limit)}
        onPageChange={setPage}
        onRefresh={fetchSessionWeeks}
        rowActions={(row) => (
          <div className="flex flex-col gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(row)}
              className="w-full justify-start gap-2 text-xs font-semibold px-2"
            >
              <Edit2 className="h-3.5 w-3.5 text-muted-foreground" /> Edit Description
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenDetails(row)}
              className="w-full justify-start gap-2 text-xs font-semibold px-2"
            >
              <Info className="h-3.5 w-3.5 text-muted-foreground" /> View Details
            </Button>
          </div>
        )}
      />

      {/* BULK GENERATION MODAL */}
      {isGenerateOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsGenerateOpen(false)}
          title="Bulk Generate Session Weeks"
          size="md"
        >
          <form onSubmit={handleGenerate} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase text-muted-foreground">First Week Start Date</label>
              <Input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <span className="text-[10px] text-muted-foreground font-semibold">
                Consecutive weeks will automatically start immediately after the previous week end date.
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase text-muted-foreground">Total Weeks to Generate</label>
              <Input
                type="number"
                min={1}
                max={104}
                required
                value={totalWeeks}
                onChange={(e) => setTotalWeeks(Number(e.target.value))}
              />
              <span className="text-[10px] text-muted-foreground font-semibold">
                Create multiple weeks consecutively (e.g. 5 weeks generates 35 days of intervals).
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsGenerateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? "Generating..." : "Generate Calendar"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* EDIT DESCRIPTION MODAL */}
      {isEditOpen && selectedWeek && (
        <Modal
          isOpen={true}
          onClose={() => setIsEditOpen(false)}
          title={`Edit Week ${selectedWeek.weekNumber} Description`}
          size="md"
        >
          <form onSubmit={handleUpdateDescription} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase text-muted-foreground">Objective / description</label>
              <textarea
                className="w-full text-sm p-3 rounded-lg border border-border/40 bg-background/50 focus:outline-none focus:ring-1 focus:ring-primary min-h-[100px]"
                placeholder="Enter learning objective or notes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* DETAILS VIEW MODAL */}
      {isDetailsOpen && selectedWeek && (
        <Modal
          isOpen={true}
          onClose={() => setIsDetailsOpen(false)}
          title={`Session Week ${selectedWeek.weekNumber} Metrics`}
          size="md"
          footer={
            <Button variant="outline" size="sm" onClick={() => setIsDetailsOpen(false)}>
              Close
            </Button>
          }
        >
          <div className="space-y-4 py-2">
            <div className="bg-secondary/35 p-4 rounded-xl border border-border/40 text-center">
              <Calendar className="h-10 w-10 text-primary mx-auto mb-2" />
              <h4 className="text-xs font-black text-foreground uppercase tracking-wide">Academic Frame</h4>
              <p className="text-base font-extrabold text-primary">Week {selectedWeek.weekNumber}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-muted-foreground">
              <div className="flex flex-col">
                <span>Start Date</span>
                <span className="font-bold text-foreground mt-0.5">{selectedWeek.startDate}</span>
              </div>
              <div className="flex flex-col">
                <span>End Date</span>
                <span className="font-bold text-foreground mt-0.5">{selectedWeek.endDate}</span>
              </div>
            </div>

            <div className="border-t border-border/40 pt-3 flex flex-col gap-1">
              <span className="text-xs font-semibold text-muted-foreground">Description & Objectives</span>
              <p className="text-xs font-bold text-foreground bg-secondary/20 p-3 rounded-lg border border-border/20 whitespace-pre-wrap">
                {selectedWeek.description || "No objective or description set for this interval."}
              </p>
            </div>

            <div className="flex justify-between text-[10px] font-bold text-muted-foreground pt-1 border-t border-border/20">
              <span>Created:</span>
              <span className="text-foreground">{new Date(selectedWeek.createdAt).toLocaleString()}</span>
            </div>
          </div>
        </Modal>
      )}
    </CrudPageTemplate>
  );
}
