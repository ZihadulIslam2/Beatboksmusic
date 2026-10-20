"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Eye, Pencil, Plus, Search, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import Pagination from "@/reusable/Pagination";
import DeleteModal from "@/reusable/DeleteModal";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AddPage from "./AddPage";
import BulkAddPage from "./BulkAddPage";
import EditPage from "./EditPage";
import ViewPage from "./ViewPage";

export interface Tag {
  _id: string;
  name: string;
  status: "active" | "inactive" | string;
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalData: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface TagsData {
  tags: Tag[];
  paginationInfo?: PaginationInfo;
}

interface ApiResponse<T> {
  statusCode?: number;
  success: boolean;
  message?: string;
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

type TagStatus = "active" | "inactive";

function getApiBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
  if (!baseUrl) throw new Error("Backend API URL is not configured.");
  return baseUrl.replace(/\/$/, "");
}

function authHeaders(accessToken?: string): HeadersInit {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function TagTableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, index) => (
        <tr key={index}>
          <td className="px-5 py-[18px]">
            <div className="h-4 w-36 animate-pulse rounded-full bg-neutral-800" />
          </td>
          <td className="px-5 py-[18px]">
            <div className="mx-auto h-7 w-20 animate-pulse rounded-full bg-neutral-800" />
          </td>
          <td className="px-5 py-[18px]">
            <div className="mx-auto h-4 w-28 animate-pulse rounded-full bg-neutral-800" />
          </td>
          <td className="px-5 py-[18px]">
            <div className="mx-auto flex justify-center gap-1">
              <div className="h-9 w-9 animate-pulse rounded-md bg-neutral-800" />
              <div className="h-9 w-9 animate-pulse rounded-md bg-neutral-800" />
              <div className="h-9 w-9 animate-pulse rounded-md bg-neutral-800" />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

function TagList() {
  const { data: session } = useSession();
  const accessToken = (session?.user as { accessToken?: string } | undefined)?.accessToken;
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Tag | null>(null);
  const [deleting, setDeleting] = useState<Tag | null>(null);
  const limit = 10;

  const tagsQuery = useQuery({
    queryKey: ["tags", page, limit, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (search.trim()) {
        params.set("search", search.trim());
      }

      const response = await fetch(`${getApiBaseUrl()}/tag?${params.toString()}`, {
        headers: authHeaders(accessToken),
      });

      const data = (await response.json().catch(() => null)) as ApiResponse<TagsData> | null;

      if (!response.ok || data?.success === false || !data?.data) {
        throw new Error(data?.message || "Unable to load tags.");
      }

      return data;
    },
  });

  const tagDetailsQuery = useQuery({
    queryKey: ["tag", viewingId],
    enabled: Boolean(viewingId),
    queryFn: async () => {
      const response = await fetch(`${getApiBaseUrl()}/tag/${viewingId}`, {
        headers: authHeaders(accessToken),
      });

      const data = (await response.json().catch(() => null)) as ApiResponse<Tag> | null;

      if (!response.ok || data?.success === false || !data?.data) {
        throw new Error(data?.message || "Unable to load tag details.");
      }

      return data.data;
    },
  });

  const addTagMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!accessToken) throw new Error("You are not authorized.");

      const response = await fetch(`${getApiBaseUrl()}/tag`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ name }),
      });

      const data = (await response.json().catch(() => null)) as ApiResponse<Tag> | null;

      if (!response.ok || data?.success === false) {
        throw new Error(data?.message || "Unable to add tag.");
      }

      return data;
    },
    onSuccess: async (data) => {
      toast.success(data?.message || "Tag added successfully.");
      setAddOpen(false);
      setPage(1);
      await queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Unable to add tag.");
    },
  });

  const bulkAddTagMutation = useMutation({
    mutationFn: async (names: string[]) => {
      if (!accessToken) throw new Error("You are not authorized.");

      const response = await fetch(`${getApiBaseUrl()}/tag/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ names }),
      });

      const data = (await response.json().catch(() => null)) as ApiResponse<unknown> | null;

      if (!response.ok || data?.success === false) {
        throw new Error(data?.message || "Unable to upload tags.");
      }

      return data;
    },
    onSuccess: async (data) => {
      toast.success(data?.message || "Tags uploaded successfully.");
      setBulkOpen(false);
      setPage(1);
      await queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Unable to upload tags.");
    },
  });

  const editTagMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      if (!accessToken) throw new Error("You are not authorized.");

      const response = await fetch(`${getApiBaseUrl()}/tag/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ name }),
      });

      const data = (await response.json().catch(() => null)) as ApiResponse<Tag> | null;

      if (!response.ok || data?.success === false) {
        throw new Error(data?.message || "Unable to update tag.");
      }

      return data;
    },
    onSuccess: async (data) => {
      toast.success(data?.message || "Tag updated successfully.");
      setEditing(null);
      await queryClient.invalidateQueries({ queryKey: ["tags"] });
      await queryClient.invalidateQueries({ queryKey: ["tag"] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Unable to update tag.");
    },
  });

  const updateTagStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TagStatus }) => {
      if (!accessToken) throw new Error("You are not authorized.");

      const response = await fetch(`${getApiBaseUrl()}/tag/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status }),
      });

      const data = (await response.json().catch(() => null)) as ApiResponse<Tag> | null;

      if (!response.ok || data?.success === false) {
        throw new Error(data?.message || "Unable to update tag status.");
      }

      return data;
    },
    onSuccess: async (data, variables) => {
      toast.success(data?.message || "Tag status updated successfully.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["tags"] }),
        queryClient.invalidateQueries({ queryKey: ["tag", variables.id] }),
      ]);
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to update tag status.",
      );
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!accessToken) throw new Error("You are not authorized.");

      const response = await fetch(`${getApiBaseUrl()}/tag/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = (await response.json().catch(() => null)) as ApiResponse<unknown> | null;

      if (!response.ok || data?.success === false) {
        throw new Error(data?.message || "Unable to delete tag.");
      }

      return data;
    },
    onSuccess: async (data) => {
      toast.success(data?.message || "Tag deleted successfully.");
      setDeleting(null);
      await queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Unable to delete tag.");
    },
  });

  const tags = useMemo(() => tagsQuery.data?.data.tags || [], [tagsQuery.data?.data.tags]);
  const totalItems =
    tagsQuery.data?.data.paginationInfo?.totalData ??
    tagsQuery.data?.meta?.total ??
    tags.length;

  useEffect(() => {
    setPage(1);
  }, [search]);

  return (
    <section className="w-full font-sans text-white">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-neutral-500" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search tags..."
            aria-label="Search tags"
            className="w-full rounded-lg border border-neutral-800 bg-[#161616] py-2.5 pl-11 pr-4 text-[15px] outline-none placeholder:text-sm placeholder:text-neutral-500 focus:border-[#00E625]/50 focus:ring-2 focus:ring-[#00E625]/10"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:self-end lg:self-auto">
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            disabled={!accessToken}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-full bg-[#00E625] px-5 py-2.5 text-sm font-bold text-black hover:bg-[#00cc21] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="h-[18px] w-[18px]" strokeWidth={3} />
            Single Add
          </button>
          <button
            type="button"
            onClick={() => setBulkOpen(true)}
            disabled={!accessToken}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-full border border-[#00E625]/60 bg-[#00E625]/10 px-5 py-2.5 text-sm font-bold text-[#00E625] hover:bg-[#00E625]/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Upload className="h-[18px] w-[18px]" />
            Bulk Upload
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-700 bg-[#0c0c0c] shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-700 bg-[#00EF011A] text-xs font-semibold">
                <th className="px-5 py-4">Tag Name</th>
                <th className="px-5 py-4 text-center">Status</th>
                <th className="px-5 py-4 text-center">Created Date</th>
                <th className="px-5 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-600">
              {tagsQuery.isLoading ? (
                <TagTableSkeleton rows={limit} />
              ) : tagsQuery.error ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-rose-400">
                    {tagsQuery.error instanceof Error ? tagsQuery.error.message : "Unable to load tags."}
                  </td>
                </tr>
              ) : tags.length ? (
                tags.map((tag) => {
                  const isActive = tag.status === "active";
                  const isUpdatingStatus =
                    updateTagStatusMutation.isPending &&
                    updateTagStatusMutation.variables?.id === tag._id;

                  return (
                    <tr key={tag._id} className="hover:bg-white/[0.025]">
                      <td className="px-5 py-[18px] font-semibold">{tag.name}</td>
                      <td className="px-5 py-[18px] text-center">
                        <Select
                          value={tag.status}
                          disabled={!accessToken || isUpdatingStatus}
                          onValueChange={(status: TagStatus) => {
                            if (status === tag.status) return;
                            updateTagStatusMutation.mutate({
                              id: tag._id,
                              status,
                            });
                          }}
                        >
                          <SelectTrigger
                            aria-label={`Update ${tag.name} status`}
                            className={`mx-auto h-9 w-[120px] cursor-pointer text-sm font-semibold capitalize focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                              isActive
                                ? "border-emerald-500/40 bg-[#051a0a]/70 text-[#00E625] focus:border-[#00E625]/70 focus:ring-[#00E625]/10"
                                : "border-rose-500/30 bg-rose-950/20 text-rose-300 focus:border-rose-400/60 focus:ring-rose-400/10"
                            }`}
                          >
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent className="border-neutral-700 bg-[#292929] text-neutral-100">
                            <SelectItem
                              value="active"
                              className="cursor-pointer capitalize text-[#00E625] focus:bg-[#00E625] focus:text-black"
                            >
                              Active
                            </SelectItem>
                            <SelectItem
                              value="inactive"
                              className="cursor-pointer capitalize text-rose-300 focus:bg-rose-500 focus:text-white"
                            >
                              Inactive
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-5 py-[18px] text-center text-neutral-200">
                        {formatDate(tag.createdAt)}
                      </td>
                      <td className="px-5 py-[18px] text-center">
                        <div className="inline-flex gap-1">
                          <button
                            type="button"
                            onClick={() => setViewingId(tag._id)}
                            aria-label={`View ${tag.name}`}
                            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md hover:bg-white/10"
                          >
                            <Eye className="h-[18px] w-[18px]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditing(tag)}
                            aria-label={`Edit ${tag.name}`}
                            disabled={!accessToken}
                            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md hover:bg-[#00E625]/10 hover:text-[#00E625] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Pencil className="h-[18px] w-[18px]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleting(tag)}
                            aria-label={`Delete ${tag.name}`}
                            disabled={!accessToken}
                            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md hover:bg-rose-500/10 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Trash2 className="h-[18px] w-[18px]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-neutral-400">
                    No tags found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        page={page}
        limit={limit}
        total={totalItems}
        currentCount={tags.length}
        onPageChange={setPage}
        disabled={tagsQuery.isFetching}
      />

      <TagFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Single Add Tag"
        description="Create one tag."
      >
        <AddPage
          onCancel={() => setAddOpen(false)}
          onSubmit={(name) => addTagMutation.mutate(name)}
          isSubmitting={addTagMutation.isPending}
        />
      </TagFormDialog>

      <TagFormDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        title="Bulk Upload Tags"
        description="Create many tags."
      >
        <BulkAddPage
          onCancel={() => setBulkOpen(false)}
          onSubmit={(names) => bulkAddTagMutation.mutate(names)}
          isSubmitting={bulkAddTagMutation.isPending}
        />
      </TagFormDialog>

      <TagFormDialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        title="Edit Tag"
        description="Update the tag name."
      >
        {editing && (
          <EditPage
            key={editing._id}
            tag={editing}
            onCancel={() => setEditing(null)}
            onSubmit={(name) => editTagMutation.mutate({ id: editing._id, name })}
            isSubmitting={editTagMutation.isPending}
          />
        )}
      </TagFormDialog>

      <Dialog open={viewingId !== null} onOpenChange={(open) => !open && setViewingId(null)}>
        <DialogContent className="border-neutral-700 bg-[#191919] p-5 text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Tag Details</DialogTitle>
            <DialogDescription className="sr-only">View tag details.</DialogDescription>
          </DialogHeader>
          {tagDetailsQuery.isLoading ? (
            <div className="grid gap-5 border-t border-neutral-700 pt-5 sm:grid-cols-2">
              <div className="h-12 animate-pulse rounded-md bg-neutral-800" />
              <div className="h-12 animate-pulse rounded-md bg-neutral-800" />
              <div className="h-12 animate-pulse rounded-md bg-neutral-800" />
              <div className="h-12 animate-pulse rounded-md bg-neutral-800" />
            </div>
          ) : tagDetailsQuery.error ? (
            <p className="border-t border-neutral-700 pt-5 text-sm text-rose-400">
              {tagDetailsQuery.error instanceof Error
                ? tagDetailsQuery.error.message
                : "Unable to load tag details."}
            </p>
          ) : tagDetailsQuery.data ? (
            <ViewPage tag={tagDetailsQuery.data} />
          ) : null}
        </DialogContent>
      </Dialog>

      <DeleteModal
        open={deleting !== null}
        onClose={() => {
          if (!deleteTagMutation.isPending) setDeleting(null);
        }}
        onConfirm={() => deleting && deleteTagMutation.mutate(deleting._id)}
        title="Delete Tag"
        description={`Are you sure you want to delete ${deleting?.name || "this tag"}? This action cannot be undone.`}
      />
    </section>
  );
}

function TagFormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="border-neutral-700 bg-[#191919] p-5 text-white sm:max-w-xl"
      >
        <DialogHeader>
          <DialogTitle className="text-2xl">{title}</DialogTitle>
          <DialogDescription className="sr-only">{description}</DialogDescription>
        </DialogHeader>
        <DialogClose
          className="absolute right-0 top-0 flex h-11 w-11 cursor-pointer items-center justify-center rounded-bl-xl bg-[#00E625] text-2xl text-black"
          aria-label={`Close ${title}`}
        >
          x
        </DialogClose>
        {children}
      </DialogContent>
    </Dialog>
  );
}

export default TagList;
