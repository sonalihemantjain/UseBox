import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2 } from "lucide-react";

interface Props {
  generating: boolean;
  onGenerate: (goal: string, role: string, level: string) => Promise<void>;
}

export function GeneratePathDialog({ generating, onGenerate }: Props) {
  const [open, setOpen] = useState(false);
  const [goal, setGoal] = useState("");
  const [role, setRole] = useState("");
  const [level, setLevel] = useState("beginner");

  const handleSubmit = async () => {
    if (!goal.trim()) return;
    await onGenerate(goal, role, level);
    setOpen(false);
    setGoal("");
    setRole("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Sparkles className="h-4 w-4" />
          Generate AI Path
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Generate a Learning Path</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>What do you want to learn?</Label>
            <Input
              placeholder="e.g. Build production-ready RAG systems"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Your current role (optional)</Label>
            <Input
              placeholder="e.g. Product Manager, Developer"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Experience level</Label>
            <Select value={level} onValueChange={setLevel}>
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
          <Button onClick={handleSubmit} disabled={generating || !goal.trim()} className="w-full gap-2">
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {generating ? "Generating..." : "Generate Path"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
