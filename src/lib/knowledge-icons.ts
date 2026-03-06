import { Brain, BookOpen, Layers, Rocket, Shield, Code, GraduationCap, Sparkles, Database, FileText, MessageSquare, Target, Route, type LucideIcon } from "lucide-react";

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
  "message-square": MessageSquare,
  target: Target,
  route: Route,
};

export function getArticleIcon(name: string): LucideIcon {
  return iconMap[name] || BookOpen;
}

export function getKnowledgeIcon(name: string): LucideIcon {
  return iconMap[name] || BookOpen;
}
