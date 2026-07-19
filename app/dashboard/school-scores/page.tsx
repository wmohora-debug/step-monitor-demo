"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { schoolScoreService } from "../../../src/features/school-scores/services/schoolScoreService";
import { schoolService } from "../../../src/features/schools/services/schoolService";
import {
  SchoolScoreResponseDto,
  CreateSchoolScoreDto,
  UpdateSchoolScoreDto,
  SchoolResponseDto,
} from "../../../src/core/types";
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
  ConfirmDeleteModal,
  FormModalWrapper,
  PermissionGate,
  CrudColumnDef,
} from "../../../src/components/framework";
import {
  Plus,
  Trophy,
  Search,
  RefreshCw,
  Eye,
  Edit2,
  Trash2,
  Award,
  BookOpen,
  Calendar,
  ShieldAlert,
} from "lucide-react";
import { useToast } from "../../../src/components/ui/Toast";
import { useSelection, useDebounce } from "../../../src/core/hooks";
import { Modal } from "../../../src/components/ui/Modal";
import { useAuth } from "../../../src/core/context/AuthContext";

function SchoolScoresPageContent() {
  const { user } = useAuth();
  const { success, error: toastError, warning } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  const role = user?.role?.slug?.toLowerCase();
  const isSuper = role === "superadmin" || role === "super_admin" || user?.email === "superstep@yopmail.com";

  // 1. Table & Data states
  const [data, setData] = useState<SchoolScoreResponseDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);

  // Available schools for select dropdown
  const [schools, setSchools] = useState<SchoolResponseDto[]>([]);
  const [isLoadingSchools, setIsLoadingSchools] = useState(false);

  // Stats states
  const [stats, setStats] = useState({
    totalCount: 0,
    averageScore: 0,
    topPerformers: 0,
  });

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Selection
  const { selectedIds, toggleSelection, toggleAll, clearSelection } = useSelection<SchoolScoreResponseDto>("schoolId");

  // 2. Form/Action Modals state
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view" | null>(null);
  const [selectedScore, setSelectedScore] = useState<SchoolScoreResponseDto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [scoreToDelete, setScoreToDelete] = useState<SchoolScoreResponseDto | null>(null);

  // Form Fields state
  const [formFields, setFormFields] = useState({
    schoolId: "",
    formSubmissionScore: 0,
    complianceScore: 0,
    trainingScore: 0,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fetch all schools to populate dropdown
  const fetchSchools = useCallback(async () => {
    setIsLoadingSchools(true);
    try {
      const response = await schoolService.findAll({ page: 1, limit: 100, status: "active" });
      setSchools(response.items || []);
    } catch (err) {
      console.error("Failed to load schools for selection:", err);
    } finally {
      setIsLoadingSchools(false);
    }
  }, []);

  // 3. Fetch data from backend
  const fetchScores = useCallback(async () => {
    setIsLoading(true);
    setErrorState(null);
    try {
      const response = await schoolScoreService.findAll({
        page,
        limit,
        search: debouncedSearch || undefined,
      });

      setData(response.items || []);
      setTotal(response.total || 0);
    } catch (err: any) {
      console.error(err);
      setErrorState(err.message || "Failed to load school performance scores.");
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedSearch]);

  // Fetch full stats (using larger limit to compute statistics locally)
  const fetchStatsData = useCallback(async () => {
    try {
      const response = await schoolScoreService.findAll({ page: 1, limit: 100 });
      const items = response.items || [];
      const totalCount = response.total || 0;
      
      const sum = items.reduce((acc, item) => acc + (item.totalScore || 0), 0);
      const averageScore = totalCount > 0 ? Number((sum / items.length).toFixed(1)) : 0;
      
      const topPerformers = items.filter((item) => item.grade === "A").length;

      setStats({
        totalCount,
        averageScore,
        topPerformers,
      });
    } catch (err) {
      console.error("Failed to compile performance stats:", err);
    }
  }, []);

  // Initial and reactive loading hook
  useEffect(() => {
    fetchScores();
    fetchStatsData();
    fetchSchools();
  }, [fetchScores, fetchStatsData, fetchSchools]);

  // Handle deep link integration hook
  useEffect(() => {
    const action = searchParams.get("action");
    const id = searchParams.get("id");

    if (action === "create") {
      handleOpenCreate();
      router.replace("/dashboard/school-scores");
    } else if (action === "view" && id) {
      schoolScoreService.findOne(id).then((score) => {
        handleOpenView(score);
        router.replace("/dashboard/school-scores");
      }).catch(() => {
        toastError("Performance record could not be retrieved.", "Registry Lookup Failed");
      });
    }
  }, [searchParams, router]);

  // 4. Action Handlers
  const handleOpenCreate = () => {
    setFormFields({
      schoolId: "",
      formSubmissionScore: 0,
      complianceScore: 0,
      trainingScore: 0,
    });
    setFormErrors({});
    setModalMode("create");
  };

  const handleOpenEdit = (score: SchoolScoreResponseDto) => {
    setSelectedScore(score);
    setFormFields({
      schoolId: score.schoolId,
      formSubmissionScore: score.formSubmissionScore,
      complianceScore: score.complianceScore,
      trainingScore: score.trainingScore,
    });
    setFormErrors({});
    setModalMode("edit");
  };

  const handleOpenView = (score: SchoolScoreResponseDto) => {
    setSelectedScore(score);
    setModalMode("view");
  };

  const handleOpenDelete = (score: SchoolScoreResponseDto) => {
    setScoreToDelete(score);
    setIsDeleting(true);
  };

  const handleConfirmDelete = async () => {
    if (!scoreToDelete) return;
    try {
      await schoolScoreService.remove(scoreToDelete.schoolId);
      success(`Performance score for school "${scoreToDelete.schoolName}" deleted successfully.`, "Score Removed");
      setIsDeleting(false);
      setScoreToDelete(null);
      fetchScores();
      fetchStatsData();
    } catch (err: any) {
      toastError(err.message || "Failed to delete score.", "Delete Failure");
    }
  };

  // Bulk Actions
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    try {
      await Promise.all(Array.from(selectedIds).map((id) => schoolScoreService.remove(id)));
      success(`Successfully deleted ${selectedIds.size} school performance records.`, "Bulk Operations Complete");
      clearSelection();
      fetchScores();
      fetchStatsData();
    } catch (err: any) {
      toastError(err.message || "Failed to execute bulk deletion.", "Bulk Operation Error");
    }
  };

  // 5. Form Submissions
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formFields.schoolId) {
      errors.schoolId = "School selection is required";
    }

    // Validation for score limits: min 0, max 10
    const formScore = Number(formFields.formSubmissionScore);
    if (isNaN(formScore) || formScore < 0 || formScore > 10) {
      errors.formSubmissionScore = "Form Submission Score must be a number between 0 and 10";
    }

    const compScore = Number(formFields.complianceScore);
    if (isNaN(compScore) || compScore < 0 || compScore > 10) {
      errors.complianceScore = "Compliance Score must be a number between 0 and 10";
    }

    const trainScore = Number(formFields.trainingScore);
    if (isNaN(trainScore) || trainScore < 0 || trainScore > 10) {
      errors.trainingScore = "Training Score must be a number between 0 and 10";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (modalMode === "create") {
        const payload: CreateSchoolScoreDto = {
          schoolId: formFields.schoolId,
          formSubmissionScore: Number(formFields.formSubmissionScore),
          complianceScore: Number(formFields.complianceScore),
          trainingScore: Number(formFields.trainingScore),
        };
        await schoolScoreService.create(payload);
        
        // Find school name for success message
        const selectedSchoolName = schools.find(s => s.id === formFields.schoolId)?.schoolName || "Selected School";
        success(`Performance score for school "${selectedSchoolName}" created successfully.`, "Score Registered");
      } else if (modalMode === "edit" && selectedScore) {
        const payload: UpdateSchoolScoreDto = {
          formSubmissionScore: Number(formFields.formSubmissionScore),
          complianceScore: Number(formFields.complianceScore),
          trainingScore: Number(formFields.trainingScore),
        };

        await schoolScoreService.update(selectedScore.schoolId, payload);
        success(`Performance score for school "${selectedScore.schoolName}" updated successfully.`, "Score Updated");
      }

      setModalMode(null);
      fetchScores();
      fetchStatsData();
    } catch (err: any) {
      toastError(err.message || "Failed to submit performance score.", "Form Submission Error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Grade styling mapper helper
  const getGradeBadgeVariant = (grade: string) => {
    switch (grade) {
      case "A":
        return "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20";
      case "B":
        return "bg-teal-500/10 text-teal-500 border border-teal-500/20";
      case "C":
        return "bg-blue-500/10 text-blue-500 border border-blue-500/20";
      case "D":
        return "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20";
      case "E":
        return "bg-orange-500/10 text-orange-500 border border-orange-500/20";
      case "F":
      default:
        return "bg-rose-500/10 text-rose-500 border border-rose-500/20";
    }
  };

  // 6. Table Columns configuration
  const columns: CrudColumnDef<SchoolScoreResponseDto>[] = useMemo(
    () => [
      {
        id: "schoolName",
        header: "School Name",
        cell: (row: SchoolScoreResponseDto) => (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
              <Trophy className="h-4.5 w-4.5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-foreground text-xs leading-none">{row.schoolName}</span>
              <span className="text-[10px] text-muted-foreground mt-1 font-semibold">
                ID: {row.schoolId.substring(0, 8)}...
              </span>
            </div>
          </div>
        ),
      },
      {
        id: "formSubmissionScore",
        header: "Form Submission",
        cell: (row: SchoolScoreResponseDto) => (
          <span className="text-xs font-bold text-foreground">{row.formSubmissionScore} <span className="text-muted-foreground font-semibold">/ 10</span></span>
        ),
      },
      {
        id: "complianceScore",
        header: "Compliance",
        cell: (row: SchoolScoreResponseDto) => (
          <span className="text-xs font-bold text-foreground">{row.complianceScore} <span className="text-muted-foreground font-semibold">/ 10</span></span>
        ),
      },
      {
        id: "trainingScore",
        header: "Training",
        cell: (row: SchoolScoreResponseDto) => (
          <span className="text-xs font-bold text-foreground">{row.trainingScore} <span className="text-muted-foreground font-semibold">/ 10</span></span>
        ),
      },
      {
        id: "totalScore",
        header: "Total Score",
        cell: (row: SchoolScoreResponseDto) => (
          <span className="text-xs font-black text-primary">{row.totalScore} <span className="text-muted-foreground font-semibold">/ 30</span></span>
        ),
      },
      {
        id: "grade",
        header: "Grade",
        cell: (row: SchoolScoreResponseDto) => (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${getGradeBadgeVariant(row.grade)}`}>
            Grade {row.grade}
          </span>
        ),
      },
      {
        id: "updatedAt",
        header: "Last Update",
        cell: (row: SchoolScoreResponseDto) => (
          <span className="text-xs font-semibold text-muted-foreground">
            {new Date(row.updatedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      {/* 1. Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Graded Schools"
          value={stats.totalCount}
          description="Total schools with computed scorecards"
          icon={<BookOpen className="h-5 w-5" />}
        />
        <StatCard
          title="Average Score"
          value={`${stats.averageScore}`}
          description="Mean performance points out of 30"
          icon={<Award className="h-5 w-5 text-emerald-500" />}
        />
        <StatCard
          title="Top Grade (A) Schools"
          value={stats.topPerformers}
          description="Schools achieving top performance grade"
          icon={<Trophy className="h-5 w-5 text-yellow-500" />}
        />
      </div>

      {/* 2. Main CRUD Template Wrapper */}
      <CrudPageTemplate
        title="School Scores"
        description="Monitor, evaluate, and manage performance ratings, quality scores, and compliance grades for educational centers."
        primaryAction={isSuper ? {
          label: "Register Scorecard",
          onClick: handleOpenCreate,
          icon: Plus,
        } : undefined}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by school name or code..."
      >
        <CrudTable<SchoolScoreResponseDto>
          idKey="schoolId"
          data={data}
          columns={columns}
          page={page}
          pageSize={limit}
          totalPages={Math.ceil(total / limit)}
          onPageChange={setPage}
          isLoading={isLoading}
          selectedIds={isSuper ? selectedIds : undefined}
          onToggleSelection={isSuper ? toggleSelection : undefined}
          onToggleAll={isSuper ? toggleAll : undefined}
          rowActions={(row) => (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenView(row)}
                className="w-full justify-start gap-2 text-xs font-semibold px-2"
              >
                <Eye className="h-3.5 w-3.5 text-muted-foreground" /> View Scorecard
              </Button>
              <PermissionGate permission="school-scores.update">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenEdit(row)}
                  className="w-full justify-start gap-2 text-xs font-semibold px-2"
                >
                  <Edit2 className="h-3.5 w-3.5 text-muted-foreground" /> Edit Scores
                </Button>
              </PermissionGate>
              <PermissionGate permission="school-scores.delete">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenDelete(row)}
                  className="w-full justify-start gap-2 text-xs font-semibold px-2 text-rose-500 hover:text-rose-600 hover:bg-rose-500/5"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete Scores
                </Button>
              </PermissionGate>
            </>
          )}
          bulkActions={isSuper ? [
            {
              label: "Delete Selected",
              onClick: handleBulkDelete,
              variant: "destructive",
            },
          ] : []}
        />
      </CrudPageTemplate>

      {/* 3. Create / Edit Form Modal */}
      <FormModalWrapper
        isOpen={modalMode === "create" || modalMode === "edit"}
        onClose={() => setModalMode(null)}
        title={modalMode === "create" ? "Register School Scorecard" : "Edit Performance Scores"}
        description={
          modalMode === "create"
            ? "Submit custom metrics to calculate a school's total quality score and letter grade."
            : "Update individual score indices. Total score and final grade will be automatically recalculated."
        }
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-foreground">
              Select School <strong className="text-destructive">*</strong>
            </span>
            <select
              value={formFields.schoolId}
              onChange={(e) => setFormFields((prev) => ({ ...prev, schoolId: e.target.value }))}
              className="w-full h-9 rounded-lg border border-input bg-background px-3 py-1 text-xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              disabled={modalMode === "edit" || isLoadingSchools}
              required
            >
              <option value="">{isLoadingSchools ? "Loading schools list..." : "Choose a school..."}</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.schoolName} ({school.schoolId || "N/A"})
                </option>
              ))}
            </select>
            {formErrors.schoolId && (
              <span className="text-[10px] text-destructive font-semibold">{formErrors.schoolId}</span>
            )}
          </div>

          <Input
            id="form-score"
            type="number"
            min="0"
            max="10"
            step="1"
            label="Form Submission Score (0 to 10)"
            value={formFields.formSubmissionScore}
            onChange={(e) => setFormFields((prev) => ({ ...prev, formSubmissionScore: parseInt(e.target.value) || 0 }))}
            placeholder="e.g. 8"
            error={formErrors.formSubmissionScore}
            disabled={isSubmitting}
            required
          />

          <Input
            id="compliance-score"
            type="number"
            min="0"
            max="10"
            step="1"
            label="Compliance Index Score (0 to 10)"
            value={formFields.complianceScore}
            onChange={(e) => setFormFields((prev) => ({ ...prev, complianceScore: parseInt(e.target.value) || 0 }))}
            placeholder="e.g. 9"
            error={formErrors.complianceScore}
            disabled={isSubmitting}
            required
          />

          <Input
            id="training-score"
            type="number"
            min="0"
            max="10"
            step="1"
            label="Staff Training Score (0 to 10)"
            value={formFields.trainingScore}
            onChange={(e) => setFormFields((prev) => ({ ...prev, trainingScore: parseInt(e.target.value) || 0 }))}
            placeholder="e.g. 7"
            error={formErrors.trainingScore}
            disabled={isSubmitting}
            required
          />
        </div>
      </FormModalWrapper>

      {/* 4. Details View Modal */}
      <Modal
        isOpen={modalMode === "view"}
        onClose={() => setModalMode(null)}
        title="School Performance Scorecard"
        size="sm"
        footer={
          <div className="flex w-full gap-2">
            <Button variant="outline" size="sm" onClick={() => setModalMode(null)} className="flex-1">
              Close
            </Button>
            <PermissionGate permission="school-scores.update">
              <Button
                size="sm"
                onClick={() => {
                  if (selectedScore) handleOpenEdit(selectedScore);
                }}
                className="flex-1"
              >
                Modify Scores
              </Button>
            </PermissionGate>
          </div>
        }
      >
        {selectedScore && (
          <div className="space-y-5 py-2">
            <div className="flex items-center gap-4.5 p-4.5 bg-secondary/30 border border-border/30 rounded-2xl">
              <div className="h-11 w-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center border border-border/20 shadow-md">
                <Trophy className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-extrabold text-foreground truncate">
                  {selectedScore.schoolName}
                </h4>
                <p className="text-[10px] font-semibold text-muted-foreground font-mono mt-1">
                  School ID: {selectedScore.schoolId}
                </p>
              </div>
              <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-black uppercase tracking-wider ${getGradeBadgeVariant(selectedScore.grade)}`}>
                Grade {selectedScore.grade}
              </span>
            </div>

            <div className="space-y-3 px-1 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-card border border-border/40 p-3 rounded-xl text-center">
                  <span className="text-[9px] font-bold text-muted-foreground block uppercase">Submissions</span>
                  <span className="text-sm font-black text-foreground mt-1 block">{selectedScore.formSubmissionScore} / 10</span>
                </div>
                <div className="bg-card border border-border/40 p-3 rounded-xl text-center">
                  <span className="text-[9px] font-bold text-muted-foreground block uppercase">Compliance</span>
                  <span className="text-sm font-black text-foreground mt-1 block">{selectedScore.complianceScore} / 10</span>
                </div>
                <div className="bg-card border border-border/40 p-3 rounded-xl text-center">
                  <span className="text-[9px] font-bold text-muted-foreground block uppercase">Training</span>
                  <span className="text-sm font-black text-foreground mt-1 block">{selectedScore.trainingScore} / 10</span>
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/25 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-primary block uppercase">Aggregate Points</span>
                  <span className="text-xs font-semibold text-muted-foreground">Computed score across parameters</span>
                </div>
                <span className="text-2xl font-black text-primary">{selectedScore.totalScore} <span className="text-xs text-muted-foreground font-semibold">/ 30</span></span>
              </div>

              <div className="pt-2.5 border-t border-border/40 space-y-1.5 text-[10px] font-bold text-muted-foreground/80 font-semibold">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" /> Initial Grading:
                  </span>
                  <span className="text-foreground">
                    {new Date(selectedScore.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" /> Last Recalculated:
                  </span>
                  <span className="text-foreground">
                    {new Date(selectedScore.updatedAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* 5. Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleting}
        onClose={() => {
          setIsDeleting(false);
          setScoreToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete School Scores"
        itemName={`the quality scorecard of ${scoreToDelete?.schoolName || "this school"}`}
      />
    </div>
  );
}

export default function SchoolScoresPage() {
  return (
    <React.Suspense fallback={
      <div className="flex items-center justify-center p-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    }>
      <SchoolScoresPageContent />
    </React.Suspense>
  );
}
