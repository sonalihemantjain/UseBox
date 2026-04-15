import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Download, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, type ApiCertificate } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function CertificateDetail() {
  const { certificateId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [certificate, setCertificate] = useState<ApiCertificate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!certificateId) {
        toast.error("Certificate not found");
        navigate("/assessment");
        return;
      }
      try {
        const data = await api.getCertificateById(certificateId);
        setCertificate(data);
      } catch (e) {
        console.error(e);
        toast.error("Failed to load certificate");
        navigate("/assessment");
      } finally {
        setLoading(false);
      }
    })();
  }, [certificateId, navigate]);

  if (loading) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="w-full px-4 sm:px-8 lg:px-12 py-8 text-sm text-muted-foreground">Loading certificate...</div>
      </div>
    );
  }

  if (!certificate) return null;

  return (
    <div className="h-full overflow-y-auto">
      <div className="w-full px-4 sm:px-8 lg:px-12 py-8 space-y-6">
        <div className="print:hidden flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/assessment")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Assessment
          </Button>
          <Button onClick={() => window.print()}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>

        <div className="max-w-4xl mx-auto border border-border rounded-2xl bg-card p-8 sm:p-12">
          <div className="text-center space-y-3">
            <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Award className="h-7 w-7 text-primary" />
            </div>
            <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">Certificate of Completion</p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold">UseBox Certification</h1>
          </div>

          <div className="mt-10 text-center space-y-3">
            <p className="text-sm text-muted-foreground">This certifies that</p>
            <p className="text-2xl font-semibold">{certificate.user_name || certificate.user_email || user?.email || "Certified User"}</p>
            <p className="text-sm text-muted-foreground">has successfully passed the assessment for</p>
            <p className="text-xl font-semibold">{certificate.topic}</p>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="rounded-lg border border-border p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Score</p>
              <p className="text-lg font-semibold mt-1">{certificate.score_percent}%</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Certificate Code</p>
              <p className="text-sm font-semibold mt-1 break-all">{certificate.certificate_code}</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Issued On</p>
              <p className="text-sm font-semibold mt-1">
                {new Date(certificate.issued_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "2-digit",
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

