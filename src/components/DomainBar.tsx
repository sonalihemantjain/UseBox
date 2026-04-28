import { useEffect } from "react";
import { useUserRole, type UserRole } from "@/hooks/useUserRole";
import { useUserContextFilters } from "@/hooks/useUserContextFilters";
import { useContextFilterOptions } from "@/hooks/useContextFilterOptions";
import { usePersonaOptions } from "@/hooks/usePersonaOptions";
import { usePageActions } from "@/context/PageActionsContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

export function DomainBar() {
  const { role, setRole } = useUserRole();
  const { functionalArea, industry, setFunctionalArea, setIndustry } = useUserContextFilters();
  const { functionalAreas, industries, loading: filtersLoading, error: filtersError, refetch: refetchFilters } = useContextFilterOptions();
  const { personas, loading: personasLoading } = usePersonaOptions(functionalArea);
  const { pageAction } = usePageActions();

  // Auto-clear persona when the selected one is no longer valid for the new functional area
  useEffect(() => {
    if (!role || personasLoading || personas.length === 0) return;
    const valid = personas.some((p) => p.key === role);
    if (!valid) setRole(null);
  }, [personas, personasLoading, role, setRole]);

  const selectedPersonaLabel = personas.find((p) => p.key === role)?.display_name ?? (role || null);

  return (
    <div className="z-10 border-b border-border/60 bg-background/95 backdrop-blur shrink-0">
      <div className="w-full px-4 sm:px-8 lg:px-12 py-2">
        <div className="flex items-center justify-between gap-2">
          {/* Left: domain dropdowns grouped */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mr-1">
              Domain
            </span>

            {/* Industry */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-gradient-to-b border from-muted/60 to-muted/20 border-dashed border-border hover:opacity-90 transition-opacity min-w-[120px] sm:min-w-[180px]">
                  <span className="text-xs font-semibold text-foreground truncate text-left">
                    {filtersLoading
                      ? "Loading…"
                      : industries.find((i) => i.key === industry)?.display_name || "All Industries"}
                  </span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52 sm:w-56">
                <DropdownMenuItem onClick={() => setIndustry(null)}>All Industries</DropdownMenuItem>
                {filtersError && (
                  <DropdownMenuItem onClick={refetchFilters}>Retry loading options</DropdownMenuItem>
                )}
                {filtersLoading && industries.length === 0 && (
                  <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
                )}
                {industries.map((opt) => (
                  <DropdownMenuItem key={opt.key} onClick={() => setIndustry(opt.key)}>
                    {opt.display_name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Functional Area */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-gradient-to-b border from-muted/60 to-muted/20 border-dashed border-border hover:opacity-90 transition-opacity min-w-[130px] sm:min-w-[200px]">
                  <span className="text-xs font-semibold text-foreground truncate text-left">
                    {filtersLoading
                      ? "Loading…"
                      : functionalAreas.find((f) => f.key === functionalArea)?.display_name || "All Functional Areas"}
                  </span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 sm:w-64">
                <DropdownMenuItem onClick={() => setFunctionalArea(null)}>All Functional Areas</DropdownMenuItem>
                {filtersError && (
                  <DropdownMenuItem onClick={refetchFilters}>Retry loading options</DropdownMenuItem>
                )}
                {filtersLoading && functionalAreas.length === 0 && (
                  <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
                )}
                {functionalAreas.map((opt) => (
                  <DropdownMenuItem key={opt.key} onClick={() => setFunctionalArea(opt.key)}>
                    {opt.display_name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Persona — dynamic based on Functional Area */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-gradient-to-b border from-muted/60 to-muted/20 border-dashed border-border hover:opacity-90 transition-opacity min-w-[120px] sm:min-w-[180px]">
                  <span className="text-xs font-semibold text-foreground truncate text-left">
                    {personasLoading ? "Loading…" : selectedPersonaLabel || "Select Persona"}
                  </span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52 sm:w-56">
                <DropdownMenuItem onClick={() => setRole(null)}>Select Persona</DropdownMenuItem>
                {personasLoading && personas.length === 0 && (
                  <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
                )}
                {personas.map((p) => (
                  <DropdownMenuItem key={p.key} onClick={() => setRole(p.key as UserRole)}>
                    {p.display_name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Right: page-level action slot injected by child pages */}
          {pageAction && <div className="shrink-0">{pageAction}</div>}
        </div>
      </div>
    </div>
  );
}
