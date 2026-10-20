"use client";

import React, { useState } from "react";
import Header from "@/components/header/Header";
import { Sidebar } from "@/components/sidebar/Sidebar";

function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <Header setSidebarOpen={setSidebarOpen} />

      <div className="flex">
        <Sidebar
          open={sidebarOpen}
          setOpen={setSidebarOpen}
        />


        <main className="w-full lg:ml-0 mt-[100px] p-4 md:p-6 overflow-x-auto bg-[#000000]">
          {children}
        </main>
      </div>
    </>
  );
}

export default Layout;