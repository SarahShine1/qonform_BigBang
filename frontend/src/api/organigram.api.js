import axios from "axios";
const BASE = import.meta.env.VITE_API_URL;

export const organigramApi = {
  getTree:      () => axios.get(`${BASE}/api/organigram/tree/`).then(r => r.data),
  getEmployees: () => axios.get(`${BASE}/api/organigram/employees/`).then(r => r.data),
};