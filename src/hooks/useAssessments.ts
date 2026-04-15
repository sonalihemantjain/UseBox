import { useCallback, useState } from "react";
import {
  api,
  type ApiAssessmentEligibleItem,
  type ApiAssessmentStartResponse,
  type ApiAssessmentSubmitResponse,
  type ApiCertificate,
} from "@/lib/api";

export function useAssessments() {
  const [eligible, setEligible] = useState<ApiAssessmentEligibleItem[]>([]);
  const [certificates, setCertificates] = useState<ApiCertificate[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadEligible = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const res = await api.getEligibleAssessments(userId);
      setEligible(res.items || []);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCertificates = useCallback(async (userId: string) => {
    const res = await api.getCertificates(userId);
    setCertificates(res.items || []);
  }, []);

  const start = useCallback(
    async (payload: { user_id: string; lab_id: string; topic?: string }): Promise<ApiAssessmentStartResponse> => {
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
    eligible,
    certificates,
    loading,
    submitting,
    loadEligible,
    loadCertificates,
    start,
    submit,
  };
}

