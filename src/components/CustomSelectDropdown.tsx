import { useState, useRef } from "react";
import { ChevronDown, Plus, Check, X, Pencil, Trash2 } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { CustomOption } from "@/hooks/useCustomOptions";

export interface SelectOption {
  key: string;
  display_name: string;
}

interface Props {
  label: string;
  fieldName: string;       // e.g. "industry", "functional area", "persona"
  inputPlaceholder: string; // e.g. "e.g. Aerospace"
  options: SelectOption[];
  customOptions: CustomOption[];
  value: string | null;
  noneLabel: string;
  loading?: boolean;
  onChange: (key: string | null) => void;
  onAdd: (name: string) => CustomOption;
  onDelete: (id: string) => void;
  onEdit: (id: string, name: string) => void;
}

export function CustomSelectDropdown({
  fieldName, inputPlaceholder, options, customOptions, value, noneLabel,
  loading, onChange, onAdd, onDelete, onEdit,
}: Props) {
  const [open, setOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addValue, setAddValue] = useState("");
  const [addError, setAddError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editError, setEditError] = useState("");
  const addInputRef = useRef<HTMLInputElement>(null);

  const allOptions = [...options, ...customOptions];
  const selectedLabel = allOptions.find(o => o.key === value)?.display_name ?? null;

  const allNames = allOptions.map(o => o.display_name.trim().toLowerCase());

  const closeDropdown = () => {
    setOpen(false);
    setIsAdding(false);
    setAddValue("");
    setAddError("");
    setEditingId(null);
    setEditValue("");
    setEditError("");
  };

  const handleSelect = (key: string | null) => {
    onChange(key);
    closeDropdown();
  };

  const handleAdd = () => {
    const trimmed = addValue.trim();
    if (!trimmed) return;
    if (allNames.includes(trimmed.toLowerCase())) {
      setAddError("Already exists");
      return;
    }
    const entry = onAdd(trimmed);
    onChange(entry.key);
    setIsAdding(false);
    setAddValue("");
    setAddError("");
    setOpen(false);
  };

  const startEdit = (entry: CustomOption) => {
    setEditingId(entry.id);
    setEditValue(entry.display_name);
    setEditError("");
  };

  const handleEditSave = (id: string) => {
    const trimmed = editValue.trim();
    if (!trimmed) return;
    const original = customOptions.find(e => e.id === id)?.display_name.toLowerCase();
    const others = allNames.filter(n => n !== original);
    if (others.includes(trimmed.toLowerCase())) {
      setEditError("Already exists");
      return;
    }
    onEdit(id, trimmed);
    setEditingId(null);
    setEditValue("");
    setEditError("");
  };

  const handleDelete = (id: string) => {
    onDelete(id);
    const opt = customOptions.find(e => e.id === id);
    if (opt && value === opt.key) onChange(null);
  };

  return (
    <Popover open={open} onOpenChange={v => { if (!v) closeDropdown(); else setOpen(true); }}>
      <PopoverTrigger asChild>
        <button className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border border-border bg-muted/40 hover:bg-muted/60 transition-colors text-sm">
          <span className={selectedLabel ? "text-foreground" : "text-muted-foreground"}>
            {loading ? "Loading…" : selectedLabel || noneLabel}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={4}
        className="p-0 w-[var(--radix-popover-trigger-width)] max-h-72 overflow-y-auto rounded-lg border border-border bg-popover shadow-md"
        style={{ minWidth: 220 }}
      >
        {/* None */}
        <button
          className={cn(
            "w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors flex items-center gap-2",
            !value && "text-primary font-medium"
          )}
          onClick={() => handleSelect(null)}
        >
          {noneLabel}
          {!value && <Check className="h-3.5 w-3.5 ml-auto text-primary shrink-0" />}
        </button>

        {/* Predefined section */}
        {options.length > 0 && (
          <>
            <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
              Predefined
            </div>
            {options.map(opt => (
              <button
                key={opt.key}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors flex items-center gap-2",
                  value === opt.key && "text-primary font-medium"
                )}
                onClick={() => handleSelect(opt.key)}
              >
                <span className="flex-1 truncate">{opt.display_name}</span>
                {value === opt.key && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
              </button>
            ))}
          </>
        )}

        {/* Custom section */}
        {customOptions.length > 0 && (
          <>
            <div className="mx-2 my-1 h-px bg-border/50" />
            <div className="px-3 pt-1 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
              Custom
            </div>
            {customOptions.map(entry => (
              <div key={entry.id}>
                {editingId === entry.id ? (
                  <div className="px-3 py-2 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <input
                        value={editValue}
                        onChange={e => { setEditValue(e.target.value); setEditError(""); }}
                        onKeyDown={e => {
                          if (e.key === "Enter") handleEditSave(entry.id);
                          if (e.key === "Escape") { setEditingId(null); setEditError(""); }
                        }}
                        className="flex-1 text-sm px-2 py-1 rounded-md bg-background outline-none"
                        style={{ border: "1.5px solid #AFA9EC" }}
                        autoFocus
                      />
                      <button
                        onClick={() => handleEditSave(entry.id)}
                        disabled={!editValue.trim()}
                        className="text-xs px-2.5 py-1 rounded-md text-white disabled:opacity-50 transition-opacity"
                        style={{ background: "#534AB7" }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => { setEditingId(null); setEditError(""); }}
                        className="p-1 rounded hover:bg-muted text-muted-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    {editError && <p className="text-xs text-destructive">{editError}</p>}
                  </div>
                ) : (
                  <div
                    className={cn(
                      "group w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors cursor-pointer",
                      value === entry.key && "text-primary font-medium"
                    )}
                    onClick={() => handleSelect(entry.key)}
                  >
                    <span className="flex-1 truncate">{entry.display_name}</span>
                    <span
                      className="shrink-0 text-[9px] font-semibold px-1.5 py-0.5 rounded"
                      style={{ background: "#EEEDFE", color: "#3C3489" }}
                    >
                      Custom
                    </span>
                    {value === entry.key && (
                      <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                    )}
                    <div
                      className="hidden group-hover:flex items-center gap-0.5 shrink-0"
                      onClick={e => e.stopPropagation()}
                    >
                      <button
                        onClick={() => startEdit(entry)}
                        className="p-1 rounded hover:bg-muted"
                        title="Edit"
                      >
                        <Pencil className="h-3 w-3 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="p-1 rounded hover:bg-destructive/10 text-destructive"
                        title="Delete"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {/* Add custom row */}
        <div className="mx-2 my-1 h-px bg-border/50" />
        {isAdding ? (
          <div className="px-3 py-2 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <input
                ref={addInputRef}
                value={addValue}
                onChange={e => { setAddValue(e.target.value); setAddError(""); }}
                onKeyDown={e => {
                  if (e.key === "Enter") handleAdd();
                  if (e.key === "Escape") { setIsAdding(false); setAddValue(""); setAddError(""); }
                }}
                placeholder={inputPlaceholder}
                className="flex-1 text-sm px-2 py-1 rounded-md bg-background outline-none"
                style={{ border: "1.5px solid #AFA9EC" }}
                autoFocus
              />
              <button
                onClick={handleAdd}
                disabled={!addValue.trim()}
                className="text-xs px-2.5 py-1 rounded-md text-white disabled:opacity-50 transition-opacity"
                style={{ background: "#534AB7" }}
              >
                Add
              </button>
              <button
                onClick={() => { setIsAdding(false); setAddValue(""); setAddError(""); }}
                className="p-1 rounded hover:bg-muted text-muted-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            {addError && <p className="text-xs text-destructive">{addError}</p>}
          </div>
        ) : (
          <button
            className="w-full text-left px-3 py-2 text-sm font-medium flex items-center gap-1.5 hover:bg-primary/5 transition-colors"
            style={{ color: "#534AB7" }}
            onClick={e => { e.stopPropagation(); setIsAdding(true); }}
          >
            <Plus className="h-3.5 w-3.5" />
            Add custom {fieldName}
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}
