import { auditExecutionMock } from "../data/auditExecution.mock";

export const auditApi = {
  getExecution: async (auditId) => {
    // TODO(audit-api): replace this mock with GET /api/v1/audit/executions/:auditId/
    return {
      ...structuredClone(auditExecutionMock),
      audit: {
        ...auditExecutionMock.audit,
        id: auditId || auditExecutionMock.audit.id,
        code: auditId || auditExecutionMock.audit.code,
      },
    };
  },
  saveDraft: async (payload) => {
    // TODO(audit-api): replace this mock with POST /api/v1/audit/executions/:auditId/draft/
    return { ok: true, payload };
  },
  completeExecution: async (payload) => {
    // TODO(audit-api): replace this mock with POST /api/v1/audit/executions/:auditId/complete/
    return { ok: true, status: "Publié", payload };
  },
};
