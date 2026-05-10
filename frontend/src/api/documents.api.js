import { apiClient } from "./auth";

export const getDocuments = (versionId) =>
  apiClient.get("/documents/", { params: { id_version: versionId } }).then((r) => r.data);

export const uploadDocument = (versionId, typeDocument, file, userId) => {
  const form = new FormData();
  form.append("file", file);
  form.append("id_version", versionId);
  form.append("type_document", typeDocument);
  if (userId) form.append("id_uploader", userId);
  return apiClient.post("/documents/upload/", form, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then((r) => r.data);
};

export const deleteDocument = (id) =>
  apiClient.delete(`/documents/${id}/`);
