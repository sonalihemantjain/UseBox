import { ExternalLink, BookOpen } from "lucide-react";
import type { SourceReference } from "@/lib/chat-stream";

interface SourceLinksProps {
  sources: SourceReference[];
}

export function SourceLinks({ sources }: SourceLinksProps) {
  if (!sources.length) return null;

  return (
    <div className="mt-3 pt-3 border-t border-border">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-2">
        <BookOpen className="h-3.5 w-3.5" />
        Sources from community knowledge
      </div>
      <div className="flex flex-wrap gap-2">
        {sources.map((source) => (
          <a
            key={source.id}
            href={`/article/${source.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/10 text-primary hover:bg-primary/10 hover:border-primary/20 transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            {source.title}
          </a>
        ))}
      </div>
    </div>
  );
}
