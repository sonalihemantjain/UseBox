import { Brain, BookOpen, Layers, Rocket, Shield, Code, GraduationCap, Sparkles, Database, FileText, type LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  brain: Brain,
  book: BookOpen,
  layers: Layers,
  rocket: Rocket,
  shield: Shield,
  code: Code,
  "graduation-cap": GraduationCap,
  sparkles: Sparkles,
  database: Database,
  "file-text": FileText,
};

export function getArticleIcon(name: string): LucideIcon {
  return iconMap[name] || BookOpen;
}
