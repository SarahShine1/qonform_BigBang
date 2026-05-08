// frontend/src/api/documents.js
// Remplace le fichier mock par celui-ci quand le backend est prêt

import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const authHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('access_token')}`,
  },
});

// GET /api/documents/?search=xxx
export const fetchDocuments = (params = {}) =>
  axios.get(`${API_BASE}/documents/`, { ...authHeaders(), params });

// GET /api/documents/:id/
export const fetchDocument = (id) =>
  axios.get(`${API_BASE}/documents/${id}/`, authHeaders());

// POST /api/documents/upload/  (multipart/form-data)
export const uploadDocument = (formData) =>
  axios.post(`${API_BASE}/documents/upload/`, formData, {
    headers: {
      ...authHeaders().headers,
      'Content-Type': 'multipart/form-data',
    },
  });

// GET /api/documents/:id/download/  → blob PDF
export const downloadDocument = (id) =>
  axios.get(`${API_BASE}/documents/${id}/download/`, {
    ...authHeaders(),
    responseType: 'blob',
  });