import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useKnowledge } from "@/hooks/useKnowledge";
import { toast } from "sonner";

const UploadDocument = () => {
  const navigate = useNavigate();
  const { uploadDocument } = useKnowledge();
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
    await uploadDocument(file, title, desc, category, difficulty, tags);
    setUploading(false);
    navigate("/knowledge");
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Back button */}
          <Button
            variant="ghost"
            onClick={() => navigate("/knowledge")}
            className="mb-6 gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Knowledge
          </Button>

          <h1 className="font-display text-3xl font-bold mb-2">Upload Document</h1>
          <p className="text-muted-foreground mb-8">
            Share your expertise by uploading a document. Once approved, other users can learn from it and you'll earn credits.
          </p>

          <div className="space-y-6 bg-card border border-border rounded-2xl p-6">
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
                className="mt-1 border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/40 transition-colors"
              >
                {file ? (
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-foreground">{file.name}</span>
                    <button onClick={(e) => { e.stopPropagation(); setFile(null); }}>
                      <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Click to select a file (PDF, DOC, TXT, MD)</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="upload-title">Title</Label>
              <Input id="upload-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Document title" className="mt-1" />
            </div>

            <div>
              <Label htmlFor="upload-desc">Description</Label>
              <Textarea id="upload-desc" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Brief description of the content" className="mt-1" rows={3} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
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
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
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
              <Input id="upload-tags" value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="ai, tutorial, guide" className="mt-1" />
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => navigate("/knowledge")} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={uploading} className="flex-1 glow-gold">
                {uploading ? "Uploading…" : "Upload & Save"}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default UploadDocument;
