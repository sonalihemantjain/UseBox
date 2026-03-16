import { useState } from "react";
import { User, Zap, Code, Layers, Shield, HelpCircle, Sparkles, ChevronDown, RotateCcw } from "lucide-react";
import { type UserRole, ROLE_LABELS } from "@/hooks/useUserRole";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ROLE_ICONS: Record<UserRole, React.ElementType> = {
  business: User,
  lowcode: Zap,
  developer: Code,
  architect: Layers,
  admin: Shield,
};

const ROLE_COLORS: Record<UserRole, string> = {
  business: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20",
  lowcode: "from-amber-500/10 to-amber-500/5 border-amber-500/20",
  developer: "from-blue-500/10 to-blue-500/5 border-blue-500/20",
  architect: "from-purple-500/10 to-purple-500/5 border-purple-500/20",
  admin: "from-red-500/10 to-red-500/5 border-red-500/20",
};

const ROLE_ICON_COLORS: Record<UserRole, string> = {
  business: "text-emerald-600",
  lowcode: "text-amber-600",
  developer: "text-blue-600",
  architect: "text-purple-600",
  admin: "text-red-600",
};

const roles: UserRole[] = ["business", "lowcode", "developer", "architect", "admin"];

interface RoleSelectorProps {
  value: UserRole | null;
  onChange: (role: UserRole | null) => void;
  collapsed?: boolean;
}

export function RoleSelector({ value, onChange, collapsed }: RoleSelectorProps) {
  if (collapsed) return null;

  if (!value) {
    return (
      <div className="mx-2 my-1.5">
        <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-gradient-to-b from-muted/60 to-muted/20 border border-dashed border-border">
          <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
            <HelpCircle className="h-3.5 w-3.5 text-primary" />
          </div>
          <p className="text-[11px] font-medium text-muted-foreground leading-tight truncate">No persona yet</p>
        </div>
      </div>
    );
  }

  const Icon = ROLE_ICONS[value];

  return (
    <div className="mx-2 my-1.5">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg bg-gradient-to-b ${ROLE_COLORS[value]} border cursor-pointer hover:opacity-90 transition-opacity`}>
            <div className="h-6 w-6 rounded-md bg-background/50 flex items-center justify-center shrink-0">
              <Icon className={`h-3.5 w-3.5 ${ROLE_ICON_COLORS[value]}`} />
            </div>
            <span className="text-xs font-semibold text-foreground leading-tight truncate flex-1 text-left">{ROLE_LABELS[value]}</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          {roles.map((role) => {
            const RoleIcon = ROLE_ICONS[role];
            const isActive = value === role;
            return (
              <DropdownMenuItem
                key={role}
                onClick={() => onChange(role)}
                className={isActive ? "bg-primary/10 text-primary font-medium" : ""}
              >
                <RoleIcon className={`h-4 w-4 mr-2 ${isActive ? ROLE_ICON_COLORS[role] : ""}`} />
                {ROLE_LABELS[role]}
              </DropdownMenuItem>
            );
          })}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onChange(null)} className="text-muted-foreground">
            <RotateCcw className="h-4 w-4 mr-2" />
            Re-discover via chat
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
