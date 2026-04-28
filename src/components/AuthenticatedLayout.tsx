import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DomainBar } from "@/components/DomainBar";
import { PageActionsProvider } from "@/context/PageActionsContext";
import useBoxLogo from "@/assets/usebox-logo.png";

export function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageActionsProvider>
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0 min-h-screen">
          {/* Mobile top bar — hidden on md+ where sidebar is always visible */}
          <header className="md:hidden flex items-center gap-3 px-4 h-14 border-b border-border bg-background shrink-0 z-20">
            <SidebarTrigger className="h-8 w-8" />
            <a href="/dashboard" className="flex items-center gap-2">
              <img src={useBoxLogo} alt="Usebox" className="h-7 w-7" />
              <span className="font-display text-base font-bold tracking-tight">
                Use<span className="text-gradient-gold">box</span>
              </span>
            </a>
          </header>
          <DomainBar />
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
    </PageActionsProvider>
  );
}
