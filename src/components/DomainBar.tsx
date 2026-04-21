import { useUserRole, ROLE_LABELS, type UserRole } from "@/hooks/useUserRole";
import { useUserContextFilters } from "@/hooks/useUserContextFilters";
import { useContextFilterOptions } from "@/hooks/useContextFilterOptions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

const roleOptions: UserRole[] = ["businessuser", "prodeveloper", "architect", "admin"];

const ROLE_COLORS: Record<UserRole, string> = {
  businessuser: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20",
  prodeveloper: "from-blue-500/10 to-blue-500/5 border-blue-500/20",
  architect: "from-purple-500/10 to-purple-500/5 border-purple-500/20",
  admin: "from-red-500/10 to-red-500/5 border-red-500/20",
};

export function DomainBar() {
  const { role, setRole } = useUserRole();
  const { functionalArea, industry, setFunctionalArea, setIndustry } = useUserContextFilters();
  const { functionalAreas, industries, loading: filtersLoading, error: filtersError, refetch: refetchFilters } = useContextFilterOptions();

  return (
    <div className="z-10 border-b border-border/60 bg-background/95 backdrop-blur shrink-0">
      <div className="w-full px-4 sm:px-8 lg:px-12 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mr-1">
            Domain
          </span>

          {/* Persona */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={[
                  "flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-gradient-to-b border",
                  role ? ROLE_COLORS[role] : "from-muted/60 to-muted/20 border-dashed border-border",
                  "hover:opacity-90 transition-opacity min-w-[180px]",
                ].join(" ")}
              >
                <span className="text-xs font-semibold text-foreground truncate text-left">
                  {role ? ROLE_LABELS[role] : "Select Persona"}
                </span>
                <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem onClick={() => setRole(null)}>Select Persona</DropdownMenuItem>
              {roleOptions.map((r) => (
                <DropdownMenuItem key={r} onClick={() => setRole(r)}>
                  {ROLE_LABELS[r]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Functional Area */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-gradient-to-b border from-muted/60 to-muted/20 border-dashed border-border hover:opacity-90 transition-opacity min-w-[200px]">
                <span className="text-xs font-semibold text-foreground truncate text-left">
                  {filtersLoading
                    ? "Loading…"
                    : functionalAreas.find((f) => f.key === functionalArea)?.display_name || "All Functional Areas"}
                </span>
                <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuItem onClick={() => setFunctionalArea(null)}>All Functional Areas</DropdownMenuItem>
              {filtersError && (
                <DropdownMenuItem onClick={refetchFilters}>
                  Retry loading options
                </DropdownMenuItem>
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

          {/* Industry */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-gradient-to-b border from-muted/60 to-muted/20 border-dashed border-border hover:opacity-90 transition-opacity min-w-[180px]">
                <span className="text-xs font-semibold text-foreground truncate text-left">
                  {filtersLoading
                    ? "Loading…"
                    : industries.find((i) => i.key === industry)?.display_name || "All Industries"}
                </span>
                <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem onClick={() => setIndustry(null)}>All Industries</DropdownMenuItem>
              {filtersError && (
                <DropdownMenuItem onClick={refetchFilters}>
                  Retry loading options
                </DropdownMenuItem>
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
        </div>
      </div>
    </div>
  );
}
