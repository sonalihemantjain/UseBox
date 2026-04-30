import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CustomSelectDropdown } from "@/components/CustomSelectDropdown";
import { useCustomOptions } from "@/hooks/useCustomOptions";
import { useUserContext } from "@/hooks/useUserContext";
import { useUserContextFilters } from "@/hooks/useUserContextFilters";
import { useContextFilterOptions } from "@/hooks/useContextFilterOptions";
import { usePersonaOptions } from "@/hooks/usePersonaOptions";
import type { UserRole } from "@/hooks/useUserRole";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContextEditDialog({ open, onOpenChange }: Props) {
  const { role, setRole } = useUserContext();
  const { functionalArea, industry, setFunctionalArea, setIndustry } = useUserContextFilters();
  const { functionalAreas, industries, loading: filtersLoading } = useContextFilterOptions();
  const { personas, loading: personasLoading } = usePersonaOptions(functionalArea);
  const { getByType, addOption, deleteOption, editOption } = useCustomOptions();

  const customIndustries = getByType("industry");
  const customFAs = getByType("functionalArea");
  const customPersonas = getByType("persona");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display">Your Context</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Industry</Label>
            <CustomSelectDropdown
              label="Industry"
              fieldName="industry"
              inputPlaceholder="e.g. Aerospace"
              options={industries}
              customOptions={customIndustries}
              value={industry}
              noneLabel="All Industries"
              loading={filtersLoading}
              onChange={setIndustry}
              onAdd={name => addOption("industry", name)}
              onDelete={deleteOption}
              onEdit={editOption}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Functional Area</Label>
            <CustomSelectDropdown
              label="Functional Area"
              fieldName="functional area"
              inputPlaceholder="e.g. Operations"
              options={functionalAreas}
              customOptions={customFAs}
              value={functionalArea}
              noneLabel="All Functional Areas"
              loading={filtersLoading}
              onChange={setFunctionalArea}
              onAdd={name => addOption("functionalArea", name)}
              onDelete={deleteOption}
              onEdit={editOption}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Persona</Label>
            <CustomSelectDropdown
              label="Persona"
              fieldName="persona"
              inputPlaceholder="e.g. Sales Manager"
              options={personas}
              customOptions={customPersonas}
              value={role}
              noneLabel="No Persona"
              loading={personasLoading}
              onChange={v => setRole(v as UserRole | null)}
              onAdd={name => addOption("persona", name)}
              onDelete={deleteOption}
              onEdit={editOption}
            />
          </div>
          <div className="flex justify-end pt-1">
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
