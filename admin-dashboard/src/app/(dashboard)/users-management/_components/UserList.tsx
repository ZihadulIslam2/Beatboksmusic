"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Eye, Search } from "lucide-react";
import Pagination from "@/reusable/Pagination";
import ViewUserDetails, { type ManagedUser } from "./ViewUserDetails";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalData: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface UsersData {
  users: ManagedUser[];
  paginationInfo?: PaginationInfo;
}

interface ApiResponse<T> {
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

function getApiBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
  if (!baseUrl) throw new Error("Backend API URL is not configured.");
  return baseUrl.replace(/\/$/, "");
}

function formatDate(date?: string | null) {
  if (!date) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function UserTableSkeleton({ rows = 7 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, index) => (
        <tr key={index}>
          <td className="px-5 py-5">
            <div className="mx-auto h-4 w-32 animate-pulse rounded-full bg-neutral-800" />
          </td>
          <td className="px-5 py-5">
            <div className="mx-auto h-4 w-44 animate-pulse rounded-full bg-neutral-800" />
          </td>
          <td className="px-5 py-5">
            <div className="mx-auto h-6 w-20 animate-pulse rounded-full bg-neutral-800" />
          </td>
          <td className="px-5 py-5">
            <div className="mx-auto h-4 w-28 animate-pulse rounded-full bg-neutral-800" />
          </td>
          <td className="px-5 py-5">
            <div className="mx-auto h-9 w-9 animate-pulse rounded-md bg-neutral-800" />
          </td>
        </tr>
      ))}
    </>
  );
}

function UserList() {
  const { data: session } = useSession();
  const accessToken = (session?.user as { accessToken?: string } | undefined)?.accessToken;
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const limit = 10;

  const usersQuery = useQuery({
    queryKey: ["users", page, limit, search],
    enabled: Boolean(accessToken),
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (search.trim()) {
        params.set("search", search.trim());
      }

      const response = await fetch(`${getApiBaseUrl()}/user/all-users?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = (await response.json().catch(() => null)) as ApiResponse<UsersData> | null;

      if (!response.ok || data?.success === false || !data?.data) {
        throw new Error(data?.message || "Unable to load users.");
      }

      return data;
    },
  });

  const users = useMemo(
    () => usersQuery.data?.data.users || [],
    [usersQuery.data?.data.users],
  );
  const totalUsers =
    usersQuery.data?.data.paginationInfo?.totalData ??
    usersQuery.data?.meta?.total ??
    users.length;

  useEffect(() => {
    setPage(1);
  }, [search]);

  return (
    <section className="w-full text-white">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-neutral-500" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search username or email..."
            aria-label="Search users by username or email"
            className="w-full rounded-lg border border-neutral-800 bg-[#161616] py-2.5 pl-11 pr-4 text-[15px] text-neutral-200 outline-none placeholder:text-sm placeholder:text-neutral-500 focus:border-[#00E625]/50 focus:ring-2 focus:ring-[#00E625]/10"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-700 bg-[#0c0c0c] shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="bg-[#00EF011A] text-center text-xs font-semibold">
                <th className="px-5 py-4">User</th>
                <th className="px-5 py-4">Email</th>
                <th className="px-5 py-4">Subscription</th>
                <th className="px-5 py-4">Joined</th>
                <th className="px-5 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-700">
              {usersQuery.isLoading ? (
                <UserTableSkeleton rows={limit} />
              ) : usersQuery.error ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-rose-400">
                    {usersQuery.error instanceof Error
                      ? usersQuery.error.message
                      : "Unable to load users."}
                  </td>
                </tr>
              ) : users.length ? (
                users.map((user) => (
                  <tr key={user._id} className="text-center transition-colors hover:bg-white/[0.025]">
                    <td className="px-5 py-5 font-medium">{user.name}</td>
                    <td className="px-5 py-5 text-neutral-200">{user.email}</td>
                    <td className="px-5 py-5 font-medium">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                          user.hasActiveSubscription
                            ? "bg-[#00E625] text-black"
                            : "border border-neutral-700 text-neutral-300"
                        }`}
                      >
                        {user.subscription?.status || "N/A"}
                      </span>
                    </td>
                    <td className="px-5 py-5">{formatDate(user.createdAt)}</td>
                    <td className="px-5 py-5">
                      <button
                        type="button"
                        onClick={() => setSelectedUser(user)}
                        aria-label={`View ${user.name}`}
                        className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-white/10"
                      >
                        <Eye className="h-[18px] w-[18px]" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-neutral-400">
                    No users found.
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
        total={totalUsers}
        currentCount={users.length}
        onPageChange={setPage}
        disabled={usersQuery.isFetching}
      />

      <Dialog
        open={selectedUser !== null}
        onOpenChange={(open) => !open && setSelectedUser(null)}
      >
        <DialogContent
          showCloseButton={false}
          className="max-h-[90vh] overflow-y-auto border-neutral-700 bg-[#191919] p-5 text-white sm:max-w-2xl"
        >
          <DialogHeader>
            <DialogTitle className="text-2xl">User Details</DialogTitle>
            <DialogDescription className="sr-only">
              View the selected user&apos;s account information.
            </DialogDescription>
          </DialogHeader>
          <DialogClose
            aria-label="Close user details"
            className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-bl-xl bg-[#00E625] text-2xl text-black hover:bg-[#00cc21]"
          >
            x
          </DialogClose>
          {selectedUser && <ViewUserDetails user={selectedUser} />}
        </DialogContent>
      </Dialog>
    </section>
  );
}

export default UserList;
