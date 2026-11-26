"use client";

import React from "react";
import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import AppFooter from "@/layout/AppFooter";
import { cn } from "@/utils";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded } = useSidebar();

  const mainContentMargin = isExpanded ? "lg:ml-[290px]" : "lg:ml-[90px]";

  return (
    <div className="min-h-dvh bg-gray-50 dark:bg-gray-950">
      {/* SIDEBAR */}
      <AppSidebar />

      {/* MAIN LAYOUT */}
      <div
        className={cn(
          "flex min-h-dvh min-w-0 flex-col",
          "transition-[margin] duration-300 ease-in-out",
          mainContentMargin,
        )}
      >
        {/* HEADER */}
        <AppHeader />

        {/* MAIN CONTENT */}
        <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>

        {/* FOOTER - ALWAYS BOTTOM */}
        <AppFooter />
      </div>
    </div>
  );
}
