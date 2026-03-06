import { User, Zap, Code, Layers, Shield, HelpCircle, Sparkles } from "lucide-react";
import { type UserRole, ROLE_LABELS } from "@/hooks/useUserRole";

const ROLE_ICONS: Record<UserRole, React.ElementType> = {
  business: User,
  lowcode: Zap,
  developer: Code,
  architect: Layers,
  admin: Shield,
};

const ROLE_COLORS: Record<UserRole, string> = {
  business: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30",
  lowcode: "from-amber-500/20 to-amber-500/5 border-amber-500/30",
  developer: "from-blue-500/20 to-blue-500/5 border-blue-500/30",
  architect: "from-purple-500/20 to-purple-500/5 border-purple-500/30",
  admin: "from-red-500/20 to-red-500/5 border-red-500/30",
};

const ROLE_ICON_COLORS: Record<UserRole, string> = {
  business: "text-emerald-400",
  lowcode: "text-amber-400",
  developer: "text-blue-400",
  architect: "text-purple-400",
  admin: "text-red-400",
};

interface RoleSelectorProps {
  value: UserRole | null;
  onChange: (role: UserRole | null) => void;
  collapsed?: boolean;
}

export function RoleSelector({ value, collapsed }: RoleSelectorProps) {
  if (collapsed) return null;

  if (!value) {
    return (
      <div className="mx-3 my-2">
        <div className="flex items-center gap-2.5 px-3 py-3 rounded-xl bg-gradient-to-b from-muted/60 to-muted/20 border border-dashed border-border">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <HelpCircle className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-foreground leading-tight">No persona yet</p>
            <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">Chat with AI to discover yours</p>
          </div>
        </div>
      </div>
    );
  }

  const Icon = ROLE_ICONS[value];

  return (
    <div className="mx-3 my-2">
      <div className={`flex items-center gap-2.5 px-3 py-3 rounded-xl bg-gradient-to-b ${ROLE_COLORS[value]} border`}>
        <div className="h-8 w-8 rounded-lg bg-background/50 flex items-center justify-center shrink-0">
          <Icon className={`h-4 w-4 ${ROLE_ICON_COLORS[value]}`} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] text-muted-foreground leading-tight flex items-center gap-1">
            <Sparkles className="h-2.5 w-2.5" /> Your Persona
          </p>
          <p className="text-sm font-semibold text-foreground leading-tight mt-0.5">{ROLE_LABELS[value]}</p>
        </div>
      </div>
    </div>
  );
}
