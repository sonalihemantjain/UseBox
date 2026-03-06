import { useState, useRef } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

interface UploadDialogProps {
  onUpload: (file: File, title: string, desc: string, category: string, difficulty: string, tags: string[]) => Promise<void>;
}

export function UploadDialog({ onUpload }: UploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState("general");
  const [difficulty, setDifficulty] = useState("beginner");
  const [tagInput, setTagInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!file || !title.trim()) {
      toast.error("Please provide a file and title");
      return;
    }
    setUploading(true);
    const tags = tagInput.split(",").map((t) => t.trim()).filter(Boolean);
    await onUpload(file, title, desc, category, difficulty, tags);
    setUploading(false);
    setOpen(false);
    setFile(null);
    setTitle("");
    setDesc("");
    setTagInput("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" /> Upload Document
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          {/* File picker */}
          <div>
            <Label>File</Label>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt,.md"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <div
              onClick={() => inputRef.current?.click()}
              className="mt-1 border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/40 transition-colors"
            >
              {file ? (
                <div className="flex items-center justify-center gap-2 text-sm">
                  <span className="text-foreground">{file.name}</span>
                  <button onClick={(e) => { e.stopPropagation(); setFile(null); }}>
                    <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Click to select a file (PDF, DOC, TXT, MD)</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="upload-title">Title</Label>
            <Input id="upload-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Document title" />
          </div>

          <div>
            <Label htmlFor="upload-desc">Description</Label>
            <Input id="upload-desc" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Brief description" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="ai-fundamentals">AI Fundamentals</SelectItem>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="development">Development</SelectItem>
                  <SelectItem value="data">Data</SelectItem>
                  <SelectItem value="governance">Governance</SelectItem>
                  <SelectItem value="learning">Learning</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Difficulty</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="upload-tags">Tags (comma-separated)</Label>
            <Input id="upload-tags" value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="ai, tutorial, guide" />
          </div>

          <Button onClick={handleSubmit} disabled={uploading} className="w-full glow-gold">
            {uploading ? "Uploading…" : "Upload & Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
