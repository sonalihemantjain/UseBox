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
      <style>{`
        @media print {
          :root {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          html, body {
            background: #ffffff !important;
          }
          @page {
            size: A4;
            margin: 14mm;
          }
          /* Avoid browser adding extra margins/padding */
          body {
            margin: 0 !important;
          }
          /* Ensure shadows/gradients are preserved where possible */
          .print-exact {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
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

        <div className="max-w-5xl mx-auto">
          {/* Bright frame */}
          <div className="print-exact rounded-[28px] p-[1px] bg-gradient-to-r from-amber-300/60 via-yellow-200/60 to-primary/30 shadow-[0_10px_40px_rgba(0,0,0,0.08)] print:shadow-none">
            <div className="relative overflow-hidden rounded-[27px] bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900 border border-amber-200/50 dark:border-slate-800 p-8 sm:p-12">
              {/* Watermark */}
              <div className="pointer-events-none absolute -top-10 -right-10 h-64 w-64 rounded-full bg-gradient-to-br from-amber-300/30 to-primary/10 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-16 -left-16 h-72 w-72 rounded-full bg-gradient-to-tr from-yellow-200/25 to-amber-300/10 blur-2xl" />

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-200/70 to-primary/15 flex items-center justify-center border border-amber-200/60">
                    <Award className="h-6 w-6 text-amber-600 dark:text-amber-300" />
                  </div>
                  <div>
                    <p className="text-[11px] tracking-[0.22em] text-slate-500 dark:text-slate-400 uppercase">
                      Certificate of Achievement
                    </p>
                    <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50">
                      UseBox Certification
                    </h1>
                  </div>
                </div>

                {/* Seal */}
                <div className="shrink-0">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-300 to-yellow-100 border border-amber-200 shadow-sm flex items-center justify-center">
                    <div className="h-8 w-8 rounded-full bg-white/70 border border-amber-200 flex items-center justify-center text-[10px] font-bold text-amber-700">
                      UBX
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-10 text-center space-y-3">
                <p className="text-sm text-slate-600 dark:text-slate-300">This certifies that</p>
                <p className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                  {certificate.user_name || certificate.user_email || user?.email || "Certified User"}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300">has successfully passed the assessment for</p>
                <p className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-50">
                  {certificate.topic}
                </p>
              </div>

              <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-xl border border-slate-200/70 dark:border-slate-800 bg-white/70 dark:bg-slate-950/40 p-4 text-center">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Score</p>
                  <p className="text-lg font-semibold mt-1 text-slate-900 dark:text-slate-50">{certificate.score_percent}%</p>
                </div>
                <div className="rounded-xl border border-slate-200/70 dark:border-slate-800 bg-white/70 dark:bg-slate-950/40 p-4 text-center">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Certificate Code</p>
                  <p className="text-sm font-semibold mt-1 break-all text-slate-900 dark:text-slate-50">{certificate.certificate_code}</p>
                </div>
                <div className="rounded-xl border border-slate-200/70 dark:border-slate-800 bg-white/70 dark:bg-slate-950/40 p-4 text-center">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Issued On</p>
                  <p className="text-sm font-semibold mt-1 text-slate-900 dark:text-slate-50">
                    {new Date(certificate.issued_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              <div className="mt-10 pt-8 border-t border-slate-200/70 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
                <div className="text-center sm:text-left">
                  <div className="h-px w-48 bg-slate-300 dark:bg-slate-700 mx-auto sm:mx-0" />
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">Authorized Signature</p>
                </div>
                <div className="text-center sm:text-right">
                  <div className="inline-flex items-center gap-2 justify-center sm:justify-end px-3 py-1.5 rounded-full bg-amber-100/70 dark:bg-amber-400/10 text-amber-800 dark:text-amber-200 border border-amber-200/70 dark:border-amber-400/20">
                    <span className="text-xs font-medium">Verified by UseBox</span>
                    <span className="text-xs font-semibold">{certificate.certificate_code}</span>
                  </div>
                </div>
              </div>

              <p className="mt-8 text-center text-[11px] text-slate-500 dark:text-slate-400">
                This certificate is issued digitally and is valid upon verification with the certificate code.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

