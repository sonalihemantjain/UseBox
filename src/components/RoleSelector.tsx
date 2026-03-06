import { User, Zap, Code, Layers, Shield, HelpCircle } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { type UserRole, ROLE_LABELS } from "@/hooks/useUserRole";

const ROLE_ICONS: Record<UserRole, React.ElementType> = {
  business: User,
  lowcode: Zap,
  developer: Code,
  architect: Layers,
  admin: Shield,
};

const roles: UserRole[] = ["business", "lowcode", "developer", "architect", "admin"];

interface RoleSelectorProps {
  value: UserRole | null;
  onChange: (role: UserRole | null) => void;
  collapsed?: boolean;
}

export function RoleSelector({ value, onChange, collapsed }: RoleSelectorProps) {
  if (collapsed) return null;

  return (
    <div className="px-3 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5 px-1">
        Your Persona
      </p>
      {!value && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 border border-dashed border-border mb-2">
          <HelpCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Start a chat to discover your persona</span>
        </div>
      )}
      <RadioGroup value={value || ""} onValueChange={(v) => onChange(v as UserRole)}>
        {roles.map((role) => {
          const Icon = ROLE_ICONS[role];
          const isActive = value === role;
          return (
            <Label
              key={role}
              htmlFor={`role-${role}`}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all text-sm
                ${isActive
                  ? "bg-primary/10 text-primary border border-primary/30"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-transparent"
                }`}
            >
              <RadioGroupItem value={role} id={`role-${role}`} className="sr-only" />
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{ROLE_LABELS[role]}</span>
              {isActive && <span className="h-2 w-2 rounded-full bg-primary" />}
            </Label>
          );
        })}
      </RadioGroup>
    </div>
  );
}
