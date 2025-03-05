import React from "react"
import { Outlet } from "react-router-dom"
import { Navbar } from "./navbar"
import { Sidebar } from "./sidebar"

export function PageLayout({ children }: { children?: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Üst Navbar */}
      <Navbar />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sol Kenar Çubuğu */}
        <Sidebar />
        
        {/* Ana İçerik */}
        <main className="flex-1 overflow-y-auto p-6">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  )
} 