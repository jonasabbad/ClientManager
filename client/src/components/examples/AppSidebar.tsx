import { AppSidebar } from "../app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Router } from "wouter";
import type { CSSProperties } from "react";

export default function AppSidebarExample() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
    } as CSSProperties;

  return (
    <Router>
      <SidebarProvider style={style}>
        <div className="flex h-screen w-full">
          <AppSidebar />
          <div className="flex-1 p-6">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="mt-6">
              <h1 className="text-2xl font-bold">Sidebar Navigation</h1>
              <p className="text-muted-foreground mt-2">Click the menu items in the sidebar to navigate</p>
            </div>
          </div>
        </div>
      </SidebarProvider>
    </Router>
  );
}
