import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FlaskConical, Loader2 } from "lucide-react";

interface Props {
  generating: boolean;
  onGenerate: (topic: string, difficulty: string) => Promise<string | undefined>;
  triggerLabel?: string;
  defaultTopic?: string;
}

export function CreateLabDialog({ generating, onGenerate, triggerLabel = "Create Lab", defaultTopic = "" }: Props) {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState(defaultTopic);
  const [difficulty, setDifficulty] = useState("intermediate");

  const handleSubmit = async () => {
    if (!topic.trim()) return;
    const id = await onGenerate(topic.trim(), difficulty);
    if (id) {
      setOpen(false);
      setTopic("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2" size="sm">
          <FlaskConical className="h-4 w-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Hands-on Lab</DialogTitle>
          <DialogDescription>AI will generate a practical lab with tasks and steps for your topic.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Topic</Label>
            <Input
              placeholder="e.g., Design scalable Copilot architecture"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>
          <div className="space-y-2">
            <Label>Difficulty</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!topic.trim() || generating} className="gap-2">
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
            {generating ? "Generating..." : "Generate Lab"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
