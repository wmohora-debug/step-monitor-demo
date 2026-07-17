"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth } from "../../../src/core/context/AuthContext";
import { useToast } from "../../../src/components/ui/Toast";
import { useDebounce } from "../../../src/core/hooks";
import { galleryService } from "../../../src/features/gallery/services/galleryService";
import { schoolService } from "../../../src/features/schools/services/schoolService";
import {
  GalleryResponseDto,
  SchoolResponseDto,
} from "../../../src/core/types";
import {
  Button,
  Input,
  Select,
  Pagination,
  Badge,
  Avatar,
  Modal,
  AlertDialog,
  Skeleton,
} from "../../../src/components/ui";
import {
  Image as ImageIcon,
  Search,
  Calendar,
  School,
  Trash2,
  AlertCircle,
  Clock,
  Layers,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  Upload,
} from "lucide-react";
import { cn } from "../../../src/core/utils/cn";

// Safe helper to format descriptions, handling strings, null/undefined, and objects defensively
const getSafeDescription = (description: any): string => {
  if (!description) return "";
  if (typeof description === "string") return description;
  if (typeof description === "object") {
    if (description.text && typeof description.text === "string") return description.text;
    if (description.content && typeof description.content === "string") return description.content;
    return ""; // Skip general object representation to avoid [object Object]
  }
  return String(description);
};

export default function GalleryPage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const role = user?.role?.slug?.toLowerCase();
  const isSuper = role === "superadmin" || role === "super_admin" || user?.email === "superstep@yopmail.com";
  const isDeptAdmin = role === "admin";

  // Gallery listing states
  const [items, setItems] = useState<GalleryResponseDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(12); // Grid of 3x4
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search, Sorting, and Filters
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  const [sortBy, setSortBy] = useState<"createdAt" | "title" | "updatedAt">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [schools, setSchools] = useState<SchoolResponseDto[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("");

  // Details Modal states
  const [selectedGalleryId, setSelectedGalleryId] = useState<string | null>(null);
  const [detailedItem, setDetailedItem] = useState<GalleryResponseDto | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Delete states
  const [galleryIdToDelete, setGalleryIdToDelete] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Create / Upload states
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadSchoolId, setUploadSchoolId] = useState("");
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // S3 Presigned URLs mapping state
  const [presignedUrls, setPresignedUrls] = useState<Record<string, string>>({});
  const [resolvingUrls, setResolvingUrls] = useState<Record<string, boolean>>({});

  // Batch resolve S3 URIs to presigned URLs
  const resolveS3Uris = useCallback(async (urisToResolve: string[]) => {
    const s3Uris = urisToResolve.filter(
      (uri) => uri && uri.startsWith("s3://") && !presignedUrls[uri] && !resolvingUrls[uri]
    );

    if (s3Uris.length === 0) return;

    // Mark as resolving to prevent duplicate requests
    setResolvingUrls((prev) => {
      const next = { ...prev };
      s3Uris.forEach((u) => {
        next[u] = true;
      });
      return next;
    });

    try {
      const res = await fetch("/api/gallery/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uris: s3Uris }),
      });
      
      if (!res.ok) throw new Error("Failed to sign URLs");
      
      const data = await res.json();
      const newUrls: Record<string, string> = {};
      
      if (data.results && Array.isArray(data.results)) {
        data.results.forEach((item: { uri: string; url?: string; error?: string }) => {
          if (item.url) {
            newUrls[item.uri] = item.url;
          }
        });
      }

      setPresignedUrls((prev) => ({ ...prev, ...newUrls }));
    } catch (err) {
      console.error("Error resolving S3 URLs:", err);
    } finally {
      setResolvingUrls((prev) => {
        const next = { ...prev };
        s3Uris.forEach((u) => {
          delete next[u];
        });
        return next;
      });
    }
  }, [presignedUrls, resolvingUrls]);

  const getDisplayUrl = useCallback((uri: string | null | undefined): string => {
    if (!uri) return "";
    if (!uri.startsWith("s3://")) return uri;
    return presignedUrls[uri] || "";
  }, [presignedUrls]);

  const isUrlResolving = useCallback((uri: string | null | undefined): boolean => {
    if (!uri || !uri.startsWith("s3://")) return false;
    return !presignedUrls[uri];
  }, [presignedUrls]);

  // Automatically trigger S3 URI resolution when list items load
  useEffect(() => {
    const allUris: string[] = [];
    items.forEach((item) => {
      if (item.images && Array.isArray(item.images)) {
        item.images.forEach((img) => {
          if (img) allUris.push(img);
        });
      }
    });
    if (allUris.length > 0) {
      resolveS3Uris(allUris);
    }
  }, [items, resolveS3Uris]);

  // Automatically trigger S3 URI resolution when detailed item loads
  useEffect(() => {
    if (detailedItem && detailedItem.images && Array.isArray(detailedItem.images)) {
      resolveS3Uris(detailedItem.images);
    }
  }, [detailedItem, resolveS3Uris]);
  const previewUrlsRef = useRef<string[]>([]);

  // Preload schools list for Super Admin's school selector filter
  const fetchSchools = useCallback(async () => {
    if (!isSuper) return;
    try {
      const response = await schoolService.findAll({ page: 1, limit: 100 });
      setSchools(response.items || []);
    } catch (err) {
      console.error("Failed to load schools for gallery filter:", err);
    }
  }, [isSuper]);

  // Main data fetching method
  const fetchGalleries = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Determine school scoping: Department Admins are locked into user.schoolId
      const schoolFilter = isDeptAdmin
        ? (user?.schoolId || undefined)
        : (selectedSchoolId || undefined);

      const response = await galleryService.findAll({
        page,
        limit,
        schoolId: schoolFilter,
        search: debouncedSearch || undefined,
        sortBy,
        sortOrder,
      });

      setItems(response.items || []);
      setTotal(response.total || 0);
      setTotalPages(response.totalPages || 1);
    } catch (err: any) {
      setError(err.message || "Failed to load gallery items.");
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, selectedSchoolId, debouncedSearch, sortBy, sortOrder, isDeptAdmin, user]);

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  useEffect(() => {
    fetchGalleries();
  }, [fetchGalleries]);

  // Fetch individual gallery item details on selection
  const handleOpenDetails = async (item: GalleryResponseDto) => {
    setSelectedGalleryId(item.id);
    setIsDetailOpen(true);
    setDetailLoading(true);
    setDetailedItem(null);
    setActiveImageIndex(0);
    try {
      const details = await galleryService.findOne(item.id);
      if (details) {
        setDetailedItem(details);
      } else {
        setDetailedItem(item); // Fallback to list item if detail fails but response was blank
      }
    } catch (err: any) {
      toastError(err.message || "Failed to retrieve gallery item details.");
      // Fallback: render basic listing data in the details view anyway
      setDetailedItem(item);
    } finally {
      setDetailLoading(false);
    }
  };

  // Trigger Delete confirmation
  const handleDeleteTrigger = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setGalleryIdToDelete(id);
    setIsDeleteOpen(true);
  };

  // Perform deletion request
  const handleDeleteConfirm = async () => {
    if (!galleryIdToDelete) return;
    setDeleteLoading(true);
    try {
      await galleryService.remove(galleryIdToDelete);
      success("Gallery item deleted successfully.");
      setIsDeleteOpen(false);
      setGalleryIdToDelete(null);
      
      // Close details if we deleted the currently viewed details item
      if (detailedItem?.id === galleryIdToDelete) {
        setIsDetailOpen(false);
        setDetailedItem(null);
      }

      // If we are on a page with no items left after deletion, move back a page
      if (items.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        fetchGalleries();
      }
    } catch (err: any) {
      toastError(err.message || "Failed to delete gallery item.");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Helper to handle sort sorting inputs
  const handleSortChange = (value: string) => {
    if (value === "newest") {
      setSortBy("createdAt");
      setSortOrder("desc");
    } else if (value === "oldest") {
      setSortBy("createdAt");
      setSortOrder("asc");
    } else if (value === "title-asc") {
      setSortBy("title");
      setSortOrder("asc");
    } else if (value === "title-desc") {
      setSortBy("title");
      setSortOrder("desc");
    }
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedSchoolId("");
    setPage(1);
  };

  // Keep preview URLs ref updated for cleanup on unmount
  useEffect(() => {
    previewUrlsRef.current = filePreviews;
  }, [filePreviews]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      previewUrlsRef.current.forEach((url) => {
        if (url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  const cleanupPreviews = useCallback((urls: string[]) => {
    urls.forEach((url) => {
      if (url.startsWith("blob:")) {
        URL.revokeObjectURL(url);
      }
    });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);
    
    // Validate that they are images
    const validImageFiles = filesArray.filter((file) => file.type.startsWith("image/"));
    if (validImageFiles.length === 0) {
      toastError("Please select valid image files.");
      return;
    }
    
    const newPreviews = validImageFiles.map((file) => URL.createObjectURL(file));
    setSelectedFiles((prev) => [...prev, ...validImageFiles]);
    setFilePreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleRemoveFile = (indexToRemove: number) => {
    if (filePreviews[indexToRemove]) {
      URL.revokeObjectURL(filePreviews[indexToRemove]);
    }
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setFilePreviews((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleCloseUpload = () => {
    setIsUploadOpen(false);
    setUploadSchoolId("");
    setUploadTitle("");
    setUploadDescription("");
    cleanupPreviews(filePreviews);
    setSelectedFiles([]);
    setFilePreviews([]);
    setUploadError(null);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    setUploadError(null);

    if (!uploadSchoolId) {
      setUploadError("Please select a school.");
      return;
    }
    if (!uploadTitle.trim()) {
      setUploadError("Please enter a title.");
      return;
    }
    if (selectedFiles.length === 0) {
      setUploadError("Please select at least one image.");
      return;
    }

    setIsUploading(true);
    try {
      await galleryService.create({
        schoolId: uploadSchoolId,
        title: uploadTitle.trim(),
        description: uploadDescription.trim() || undefined,
        images: selectedFiles,
      });

      success("Gallery entry created successfully!");
      handleCloseUpload();
      
      // Refresh list
      setPage(1);
      fetchGalleries();
    } catch (err: any) {
      toastError(err.message || "Failed to upload gallery entry.");
      setUploadError(err.message || "Failed to create gallery entry.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Page Header Description */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 border-b border-border/40 pb-5">
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
            Verification Assets
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Gallery Workspace
          </h1>
          <p className="text-xs text-muted-foreground">
            Browse and review classroom scan images, QR asset check-in photos, and school network infrastructure verification media.
          </p>
        </div>
        {isSuper && (
          <Button
            onClick={() => setIsUploadOpen(true)}
            className="shrink-0 gap-2 h-10 rounded-lg font-bold shadow-sm self-start lg:self-center cursor-pointer"
          >
            <Upload className="h-4 w-4" /> Upload Photos
          </Button>
        )}
      </div>

      {/* 2. Controls & Search strip */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between bg-card p-4 rounded-xl border border-border/50 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Input
            placeholder="Search by title or description..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="h-10 pl-9 text-xs rounded-lg border-input bg-background/50 pr-8"
          />
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setPage(1);
              }}
              className="absolute right-3 top-3.5 text-[10px] text-muted-foreground hover:text-foreground font-semibold"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filters and Sorting */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* School filter (Super Admin only) */}
          {isSuper && schools.length > 0 && (
            <div className="w-48">
              <Select
                value={selectedSchoolId}
                onChange={(e) => {
                  setSelectedSchoolId(e.target.value);
                  setPage(1);
                }}
                className="h-10 text-xs rounded-lg bg-background/50"
              >
                <option value="">All Schools</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.schoolName}
                  </option>
                ))}
              </Select>
            </div>
          )}

          {/* Sort By Select */}
          <div className="w-40">
            <Select
              onChange={(e) => handleSortChange(e.target.value)}
              className="h-10 text-xs rounded-lg bg-background/50"
              defaultValue="newest"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="title-asc">Title A-Z</option>
              <option value="title-desc">Title Z-A</option>
            </Select>
          </div>
        </div>
      </div>

      {/* 3. Main Workspace Area */}
      {isLoading ? (
        // LOADING STATE: Skeleton Grid
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="border border-border/50 bg-card rounded-xl overflow-hidden shadow-xs space-y-4 p-4">
              <Skeleton className="aspect-[4/3] w-full rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-3 w-1/2 rounded" />
                <Skeleton className="h-3.5 w-full rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        // ERROR STATE: Distinct API Error Message
        <div className="border border-destructive/20 bg-destructive/5 rounded-xl p-8 max-w-2xl mx-auto flex flex-col items-center text-center shadow-xs">
          <div className="h-12 w-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-base font-bold text-foreground mb-1">
            Unable to load gallery
          </h2>
          <p className="text-xs text-muted-foreground max-w-sm mb-6 leading-relaxed">
            We encountered a problem retrieving verification media logs from the server. Please check your network connection and try again.
          </p>
          <Button
            onClick={fetchGalleries}
            variant="outline"
            size="sm"
            className="gap-2 h-9 rounded-lg border-destructive/20 text-destructive hover:bg-destructive/10"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Retry Connection
          </Button>
        </div>
      ) : items.length === 0 ? (
        // TRUE EMPTY STATE: Search/Filter or General Empty
        <div className="border border-border/50 bg-card rounded-xl shadow-xs flex flex-col items-center justify-center p-12 min-h-[350px] max-w-3xl mx-auto">
          <div className="h-12 w-12 rounded-xl bg-secondary/80 border border-border/40 text-muted-foreground flex items-center justify-center mb-4">
            <ImageIcon className="h-5 w-5" />
          </div>

          <h2 className="text-base font-bold text-foreground mb-1">
            {searchQuery || selectedSchoolId
              ? "No matching gallery records"
              : isSuper
              ? "No gallery records yet"
              : "No gallery media available"}
          </h2>
          <p className="text-xs text-muted-foreground text-center max-w-sm leading-relaxed mb-6">
            {searchQuery || selectedSchoolId
              ? "No verification photos match your active search terms or selected school filter. Try clearing or modifying your filter criteria."
              : "Gallery media will appear here when verification records are added by invigilators or scanning devices."}
          </p>

          {searchQuery || selectedSchoolId ? (
            <Button
              onClick={handleResetFilters}
              variant="outline"
              size="sm"
              className="h-9 rounded-lg font-semibold"
            >
              Reset Search & Filters
            </Button>
          ) : (
            isSuper && (
              <Button
                onClick={() => setIsUploadOpen(true)}
                size="sm"
                className="h-9 rounded-lg font-bold gap-2 cursor-pointer"
              >
                <Upload className="h-4 w-4" /> Upload Photos
              </Button>
            )
          )}

          {/* Clean grid silhouette as background context representation */}
          <div className="grid grid-cols-3 gap-3 w-full max-w-md opacity-15 mt-4">
            <div className="aspect-[4/3] rounded-lg border border-dashed border-slate-350 bg-slate-100" />
            <div className="aspect-[4/3] rounded-lg border border-dashed border-slate-350 bg-slate-100" />
            <div className="aspect-[4/3] rounded-lg border border-dashed border-slate-350 bg-slate-100" />
          </div>
        </div>
      ) : (
        // LOADED STATE: Cards Grid
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {items.map((item) => {
              const hasImages = item.images && item.images.length > 0;
              const primaryImage = hasImages ? item.images[0] : null;

              return (
                <div
                  key={item.id}
                  onClick={() => handleOpenDetails(item)}
                  className="group border border-border/60 hover:border-indigo-500/20 bg-card hover:bg-indigo-500/[0.01] shadow-xs rounded-xl overflow-hidden flex flex-col h-full transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                >
                  {/* Thumbnail display */}
                  <div className="aspect-[4/3] relative overflow-hidden bg-slate-950 flex items-center justify-center shrink-0 border-b border-border/30">
                    {primaryImage && !isUrlResolving(primaryImage) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={getDisplayUrl(primaryImage)}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          // Prevent infinite loop if fallback image is missing too
                          (e.target as HTMLImageElement).src = "";
                          (e.target as HTMLImageElement).className = "hidden";
                          const fallbackSpan = e.currentTarget.parentElement?.querySelector(".fallback-media");
                          if (fallbackSpan) fallbackSpan.classList.remove("hidden");
                        }}
                      />
                    ) : null}

                    {/* Loading State */}
                    {primaryImage && isUrlResolving(primaryImage) && (
                      <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                        <RefreshCw className="h-5 w-5 animate-spin text-indigo-400" />
                      </div>
                    )}

                    {/* Placeholder when image is missing or loading fails */}
                    <div className={cn(
                      "fallback-media flex flex-col items-center justify-center text-slate-500 gap-1.5 absolute inset-0 bg-slate-900",
                      primaryImage && !isUrlResolving(primaryImage) ? "hidden" : ""
                    )}>
                      {primaryImage && isUrlResolving(primaryImage) ? null : (
                        <>
                          <ImageIcon className="h-8 w-8 opacity-40 text-slate-400" />
                          <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500">No Image</span>
                        </>
                      )}
                    </div>

                    {/* Multi-images indicator badge */}
                    {item.images && item.images.length > 1 && (
                      <div className="absolute top-3 right-3 bg-slate-950/75 backdrop-blur-xs text-white px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider flex items-center gap-1 border border-white/10">
                        <Layers className="h-3 w-3 text-indigo-400" />
                        {item.images.length} images
                      </div>
                    )}
                  </div>

                  {/* Card description details */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate mb-1" title={item.title}>
                        {item.title}
                      </h3>

                      <div className="text-[9px] text-indigo-500 dark:text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2 leading-none">
                        <School className="h-3 w-3 text-indigo-400" />
                        <span className="truncate max-w-[170px]">{item.schoolName || "Global / Unassigned"}</span>
                      </div>

                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed mb-4">
                        {getSafeDescription(item.description) || "No description provided."}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/40">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-semibold">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[10px] font-bold px-2 rounded-lg cursor-pointer"
                        >
                          Details
                        </Button>
                        {isSuper && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleDeleteTrigger(item.id, e)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pt-6 border-t border-border/30">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      )}

      {/* 4. DETAILS MODAL */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        size="lg"
        title="Gallery Record Details"
        footer={
          <div className="flex justify-between items-center w-full">
            <div>
              {isSuper && detailedItem && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={(e) => handleDeleteTrigger(detailedItem.id, e)}
                  disabled={detailLoading}
                  className="gap-2 rounded-lg cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" /> Delete Asset
                </Button>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDetailOpen(false)}
              className="rounded-lg cursor-pointer"
            >
              Close
            </Button>
          </div>
        }
      >
        {detailLoading ? (
          // Details spinner
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="h-8 w-8 text-primary animate-spin" />
            <span className="text-xs font-semibold text-muted-foreground">Loading file details...</span>
          </div>
        ) : detailedItem ? (
          // Details loaded content
          <div className="space-y-5 py-2">
            {/* Header info */}
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                {detailedItem.title}
              </h2>
              <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-2.5">
                <span className="flex items-center gap-1.5 text-indigo-500 dark:text-indigo-400">
                  <School className="h-3.5 w-3.5" />
                  {detailedItem.schoolName || "Global / Unassigned"}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Created: {new Date(detailedItem.createdAt).toLocaleDateString()}
                </span>
                {detailedItem.updatedAt !== detailedItem.createdAt && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Updated: {new Date(detailedItem.updatedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            {/* Description area */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-border/40">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
                Description
              </h4>
              <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                {getSafeDescription(detailedItem.description) || "No description provided for this verification asset."}
              </p>
            </div>

            {/* Image Viewer */}
            {detailedItem.images && detailedItem.images.length > 0 ? (
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Gallery Assets ({detailedItem.images.length})
                </h4>

                {/* Main Selected Image */}
                <div className="aspect-[16/9] w-full rounded-xl bg-slate-950 overflow-hidden relative border border-border/30 flex items-center justify-center">
                  {!isUrlResolving(detailedItem.images[activeImageIndex]) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={getDisplayUrl(detailedItem.images[activeImageIndex])}
                      alt={`${detailedItem.title} - Active`}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                      <RefreshCw className="h-8 w-8 animate-spin text-indigo-400" />
                    </div>
                  )}
                  
                  {!isUrlResolving(detailedItem.images[activeImageIndex]) && getDisplayUrl(detailedItem.images[activeImageIndex]) && (
                    <a
                      href={getDisplayUrl(detailedItem.images[activeImageIndex])}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute right-3 bottom-3 p-1.5 rounded-lg bg-slate-950/80 hover:bg-slate-950 text-white border border-white/10 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider"
                    >
                      View Source <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                {/* Thumbnails row */}
                {detailedItem.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1.5 pt-0.5">
                    {detailedItem.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className={cn(
                          "aspect-[4/3] w-20 rounded-lg overflow-hidden shrink-0 border-2 bg-slate-950 transition-all cursor-pointer",
                          idx === activeImageIndex
                            ? "border-indigo-500 ring-2 ring-indigo-500/20"
                            : "border-transparent opacity-65 hover:opacity-100"
                        )}
                      >
                        {!isUrlResolving(img) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={getDisplayUrl(img)}
                            alt={`${detailedItem.title} thumbnail ${idx}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-900">
                            <RefreshCw className="h-4 w-4 animate-spin text-indigo-400" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Empty media viewer
              <div className="aspect-[16/9] rounded-xl bg-slate-900 border border-border/40 flex flex-col items-center justify-center text-slate-500 gap-2">
                <ImageIcon className="h-10 w-10 opacity-30" />
                <span className="text-xs font-semibold text-slate-500">No media attachments found.</span>
              </div>
            )}
          </div>
        ) : (
          // Error loading detailed view
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <AlertCircle className="h-8 w-8 text-destructive mb-2" />
            <h4 className="text-sm font-bold text-foreground">Gallery record not found.</h4>
            <p className="text-xs text-muted-foreground max-w-xs mt-1">
              The requested record could not be loaded. It may have been deleted or the link is invalid.
            </p>
          </div>
        )}
      </Modal>

      {/* 5. DELETE CONFIRMATION ALERT DIALOG */}
      {isDeleteOpen && (
        <AlertDialog
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={handleDeleteConfirm}
          title="Delete Verification Asset?"
          description="Are you absolutely sure you want to permanently remove this gallery verification asset record? This operation cannot be undone."
          confirmText="Yes, Delete Record"
          cancelText="Cancel"
          isLoading={deleteLoading}
        />
      )}

      {/* 6. UPLOAD PHOTOS MODAL */}
      <Modal
        isOpen={isUploadOpen}
        onClose={handleCloseUpload}
        size="md"
        title="Upload Verification Photos"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCloseUpload}
              disabled={isUploading}
              className="rounded-lg cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleUploadSubmit}
              disabled={isUploading}
              className="rounded-lg cursor-pointer font-bold gap-2"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Uploading...
                </>
              ) : (
                "Upload & Publish"
              )}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4 py-2">
          {uploadError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* School selection */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Target School <span className="text-rose-500">*</span>
            </label>
            <Select
              value={uploadSchoolId}
              onChange={(e) => setUploadSchoolId(e.target.value)}
              className="h-10 text-xs rounded-lg bg-background/50"
              required
            >
              <option value="" disabled>Select a school...</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.schoolName}
                </option>
              ))}
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Gallery Title <span className="text-rose-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="e.g. Science Lab Equipment Setup"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              className="h-10 text-xs rounded-lg bg-background/50 border-input"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Description / Notes (Optional)
            </label>
            <textarea
              placeholder="Add verification notes, inspection feedback, or item condition details..."
              value={uploadDescription}
              onChange={(e) => setUploadDescription(e.target.value)}
              rows={3}
              className="w-full text-xs p-3 rounded-lg border border-border/80 bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/45 resize-none"
            />
          </div>

          {/* Multi-image upload */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Upload Images <span className="text-rose-500">*</span>
            </label>
            
            <div className="border border-dashed border-border/80 rounded-xl p-6 text-center hover:bg-secondary/20 hover:border-indigo-500/30 transition-all cursor-pointer relative bg-background/30">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isUploading}
              />
              <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                <div className="p-2.5 bg-secondary rounded-lg border border-border/40 text-muted-foreground">
                  <ImageIcon className="h-5 w-5 text-indigo-400" />
                </div>
                <span className="text-xs font-bold text-foreground">Click to browse photos</span>
                <span className="text-[10px] text-muted-foreground">Multiple image files accepted (PNG, JPG, JPEG, WEBP)</span>
              </div>
            </div>

            {/* Selected File Previews */}
            {filePreviews.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Selected Photos ({filePreviews.length})
                </span>
                <div className="grid grid-cols-4 gap-2.5 max-h-[160px] overflow-y-auto p-1.5 border border-border/30 bg-secondary/15 rounded-lg">
                  {filePreviews.map((preview, idx) => (
                    <div key={idx} className="aspect-[4/3] rounded-lg overflow-hidden border border-border/40 relative group bg-slate-950">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={preview} alt={`preview ${idx}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        disabled={isUploading}
                        className="absolute top-1 right-1 p-1 bg-rose-950/80 border border-rose-500/30 hover:bg-rose-900 text-white rounded-md transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </form>
      </Modal>
    </div>
  );
}
