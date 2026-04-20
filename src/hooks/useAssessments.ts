import { useCallback, useState } from "react";
import {
  api,
  type ApiAssessmentCatalogItem,
  type ApiAssessmentStartResponse,
  type ApiAssessmentSubmitResponse,
  type ApiCertificate,
} from "@/lib/api";

export function useAssessments() {
  const [catalog, setCatalog] = useState<ApiAssessmentCatalogItem[]>([]);
  const [certificates, setCertificates] = useState<ApiCertificate[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadCatalog = useCallback(async (persona?: string | null) => {
    setLoading(true);
    try {
      const res = await api.getAssessmentCatalog(persona);
      setCatalog(res.items || []);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCertificates = useCallback(async (userId: string) => {
    const res = await api.getCertificates(userId);
    setCertificates(res.items || []);
  }, []);

  const start = useCallback(
    async (payload: { user_id: string; assessment_id: string; persona?: string | null }): Promise<ApiAssessmentStartResponse> => {
      return api.startAssessment(payload);
    },
    []
  );

  const submit = useCallback(
    async (
      attemptId: string,
      payload: { user_id: string; answers: Array<{ question_id: string; selected_option: string }> }
    ): Promise<ApiAssessmentSubmitResponse> => {
      setSubmitting(true);
      try {
        return await api.submitAssessment(attemptId, payload);
      } finally {
        setSubmitting(false);
      }
    },
    []
  );

  return {
    catalog,
    certificates,
    loading,
    submitting,
    loadCatalog,
    loadCertificates,
    start,
    submit,
  };
}

