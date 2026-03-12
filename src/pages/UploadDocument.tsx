import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Upload, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useKnowledge } from "@/hooks/useKnowledge";
import { toast } from "sonner";

const UploadDocument = () => {
  const navigate = useNavigate();
  const { uploadDocument } = useKnowledge();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
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
    await uploadDocument(file, title, desc, "general", "beginner", tags);
    setUploading(false);
    navigate("/knowledge");
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-4xl">
        {/* Header - consistent with other pages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2">Upload Document</h1>
          <p className="text-muted-foreground text-lg">
            Share your expertise. When others learn from your content, you earn credits.
          </p>
        </motion.div>

        {/* File drop zone */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-6"
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt,.md"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <div
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-xl p-10 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all"
          >
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="h-5 w-5 text-primary" />
                <span className="text-foreground font-medium">{file.name}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="ml-2 p-1 rounded-full hover:bg-secondary transition-colors"
                >
                  <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
            ) : (
              <div>
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-foreground font-medium mb-1">Click to select a file</p>
                <p className="text-sm text-muted-foreground">PDF, DOC, TXT, MD supported</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-5"
        >
          <div>
            <Label htmlFor="upload-title">Title</Label>
            <Input
              id="upload-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your document a clear title"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="upload-desc">Description</Label>
            <Textarea
              id="upload-desc"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Describe what this document covers and who it's for"
              className="mt-1.5"
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="upload-tags">Tags (comma-separated)</Label>
            <Input
              id="upload-tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="ai, tutorial, guide"
              className="mt-1.5"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => navigate("/knowledge")}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={uploading}
              className="flex-1 glow-gold"
            >
              {uploading ? "Uploading…" : "Upload & Share"}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default UploadDocument;
