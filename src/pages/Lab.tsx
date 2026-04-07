import { FlaskConical } from "lucide-react";

export default function Lab() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      <FlaskConical className="h-12 w-12 text-muted-foreground mb-4" />
      <h1 className="text-2xl font-bold text-foreground mb-2">Lab</h1>
      <p className="text-muted-foreground text-center max-w-md">
        Experimental playground — coming soon.
      </p>
    </div>
  );
}
