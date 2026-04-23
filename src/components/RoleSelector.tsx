import { useState } from "react";
import { User, Zap, Code, Layers, Shield, HelpCircle, ChevronDown, RotateCcw, BarChart2, Settings2, Package } from "lucide-react";
import { type UserRole, ROLE_LABELS } from "@/hooks/useUserRole";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ROLE_ICONS: Record<UserRole, React.ElementType> = {
  businessuser:       User,
  citizen_developer:  Zap,
  prodeveloper:       Code,
  data_analyst:       BarChart2,
  operations_manager: Settings2,
  product_manager:    Package,
  architect:          Layers,
  admin:              Shield,
};

const ROLE_COLORS: Record<UserRole, string> = {
  businessuser:       "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20",
  citizen_developer:  "from-teal-500/10 to-teal-500/5 border-teal-500/20",
  prodeveloper:       "from-blue-500/10 to-blue-500/5 border-blue-500/20",
  data_analyst:       "from-cyan-500/10 to-cyan-500/5 border-cyan-500/20",
  operations_manager: "from-orange-500/10 to-orange-500/5 border-orange-500/20",
  product_manager:    "from-pink-500/10 to-pink-500/5 border-pink-500/20",
  architect:          "from-purple-500/10 to-purple-500/5 border-purple-500/20",
  admin:              "from-red-500/10 to-red-500/5 border-red-500/20",
};

const ROLE_ICON_COLORS: Record<UserRole, string> = {
  businessuser:       "text-emerald-600",
  citizen_developer:  "text-teal-600",
  prodeveloper:       "text-blue-600",
  data_analyst:       "text-cyan-600",
  operations_manager: "text-orange-600",
  product_manager:    "text-pink-600",
  architect:          "text-purple-600",
  admin:              "text-red-600",
};

const roles: UserRole[] = [
  "businessuser", "citizen_developer", "prodeveloper",
  "data_analyst", "operations_manager", "product_manager",
  "architect", "admin",
];

interface RoleSelectorProps {
  value: UserRole | null;
  onChange: (role: UserRole | null) => void;
  collapsed?: boolean;
}

export function RoleSelector({ value, onChange, collapsed }: RoleSelectorProps) {
  const [open, setOpen] = useState(false);

  const currentRole = value || "businessuser";
  const Icon = ROLE_ICONS[currentRole];

  return (
    <div className={cn("mx-2 my-1.5", collapsed && "mx-0 px-1.5")}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "w-full flex items-center gap-2 px-2.5 py-2 rounded-lg bg-gradient-to-b border cursor-pointer hover:opacity-90 transition-opacity",
              value ? ROLE_COLORS[value] : "from-muted/60 to-muted/20 border-dashed border-border",
              collapsed && "justify-center px-0 h-10 w-10 mx-auto"
            )}
            title={value ? ROLE_LABELS[value] : "Select Persona"}
          >
            <div className={cn(
              "h-6 w-6 rounded-md flex items-center justify-center shrink-0",
              value ? "bg-background/50" : "bg-primary/10"
            )}>
              {value ? (
                <Icon className={cn("h-3.5 w-3.5", ROLE_ICON_COLORS[value])} />
              ) : (
                <HelpCircle className="h-3.5 w-3.5 text-primary" />
              )}
            </div>
            {!collapsed && (
              <>
                <span className="text-xs font-semibold text-foreground leading-tight truncate flex-1 text-left">
                  {value ? ROLE_LABELS[value] : "Select Persona"}
                </span>
                <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
              </>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={collapsed ? "center" : "start"} side={collapsed ? "right" : "bottom"} className="w-52" sideOffset={10}>
          {roles.map((role) => {
            const RoleIcon = ROLE_ICONS[role];
            const isActive = value === role;
            return (
              <DropdownMenuItem
                key={role}
                onClick={() => onChange(role)}
                className={isActive ? "bg-primary/10 text-primary font-medium" : ""}
              >
                <RoleIcon className={cn("h-4 w-4 mr-2", isActive ? ROLE_ICON_COLORS[role] : "")} />
                {ROLE_LABELS[role]}
              </DropdownMenuItem>
            );
          })}
          {value && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onChange(null)} className="text-muted-foreground">
                <RotateCcw className="h-4 w-4 mr-2" />
                Clear persona
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
