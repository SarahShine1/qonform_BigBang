import { useCallback, useEffect, useMemo, useState } from "react";
import AppLayout from "../../components/layout/AppLayout";
import NewProcessForm from "../../components/audit/NewProcessForm";
import PreAuditSteps from "../../components/audit/PreAuditSteps";
import ProcessTable from "../../components/audit/ProcessTable";
import { useAuth } from "../../hooks/useAuth";
import {
  createProcess,
  deleteProcess,
  fetchOrganigrammeDepartments,
  fetchProcesses,
} from "../../api/preAudit.api";

const PAGE_SIZE = 6;

function getProcessTitle(process) {
  return process.processus || process.nom || process.name || process.intitule || process.title || "";
}

function getDepartmentName(process) {
  if (typeof process.departement === "string") return process.departement;
  if (process.departement?.nom) return process.departement.nom;
  return process.department || process.departement_nom || process.service || "";
}

function asArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function getUnitChildren(unit) {
  return unit?.children ?? unit?.enfants ?? unit?.nodes ?? [];
}

function flattenUnits(units = [], parentName = "") {
  if (!Array.isArray(units)) return [];

  return units.flatMap((unit) => {
    const normalized = {
      id: unit.id ?? unit.id_departement ?? unit.id_organigramme,
      name: unit.name ?? unit.nom ?? unit.label ?? "Departement sans nom",
      code: unit.displayCode ?? unit.code ?? "",
      type: String(unit.type ?? "").toUpperCase(),
      parentName,
    };

    return [normalized, ...flattenUnits(getUnitChildren(unit), normalized.name)];
  });
}

function normalizeDepartments(tree = []) {
  return flattenUnits(tree)
    .filter((unit) => unit.id)
    .filter((unit) => ["DIRECTION", "DEPARTMENT", "DEPARTEMENT", "SERVICE", "CELLULE"].includes(unit.type))
    .map((unit) => ({
      id: unit.id,
      label: unit.parentName ? `${unit.name} - ${unit.parentName}` : unit.name,
      code: unit.code,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "fr"));
}

export default function PreAuditPage() {
  const { user } = useAuth();
  const [processes, setProcesses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [requestedPage, setRequestedPage] = useState(1);

  const userName = `${user?.prenom || ""} ${user?.nom || ""}`.trim() || user?.email || "Utilisateur";
  const userRole = user?.roles?.[0] || "Auditeur";

  const loadProcesses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProcesses();
      setProcesses(asArray(data));
    } catch {
      setError("Impossible de charger les processus identifies.");
      setProcesses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDepartments = useCallback(async () => {
    try {
      const data = await fetchOrganigrammeDepartments();
      setDepartments(normalizeDepartments(asArray(data)));
    } catch {
      setDepartments([]);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadProcesses();
      loadDepartments();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadDepartments, loadProcesses]);

  const filteredProcesses = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return processes;

    return processes.filter((process) => {
      const title = getProcessTitle(process).toLowerCase();
      const department = getDepartmentName(process).toLowerCase();
      const code = String(process.code_process || process.code || process.code_processus || process.reference || "").toLowerCase();
      return title.includes(term) || department.includes(term) || code.includes(term);
    });
  }, [processes, search]);

  const totalPages = Math.max(1, Math.ceil(filteredProcesses.length / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);

  const paginatedProcesses = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredProcesses.slice(start, start + PAGE_SIZE);
  }, [filteredProcesses, page]);

  const handleCreate = async (newProcess) => {
    setSaving(true);
    setError(null);
    try {
      await createProcess(newProcess);
      await loadProcesses();
    } catch {
      setError("Impossible d'enregistrer le processus.");
      throw new Error("PROCESS_CREATE_FAILED");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (process) => {
    const processLabel = process?.nom || process?.name || process?.intitule || "ce processus";
    const confirmed = window.confirm(
      `Attention: vous allez supprimer ${processLabel}. Cette action est irreversible. Continuer ?`,
    );

    if (!confirmed) return;

    setError(null);
    try {
      await deleteProcess(process.id_processus || process.id);
      await loadProcesses();
    } catch {
      setError("Impossible de supprimer le processus.");
    }
  };

  return (
    <AppLayout pageTitle="Pre-audit" userName={userName} userRole={userRole}>
      <div className="mx-auto flex min-h-full max-w-[1180px] flex-col gap-2.5">
    
        <PreAuditSteps />

        {error && (
          <div className="rounded-[8px] border border-red-100 bg-red-50 px-4 py-2.5 text-[11.5px] font-medium text-red-500">
            {error}
          </div>
        )}

        <div className="grid items-start gap-2.5 lg:grid-cols-[minmax(0,1.2fr)_300px]">
          <ProcessTable
            processes={paginatedProcesses}
            loading={loading}
            search={search}
            onSearchChange={(value) => {
              setSearch(value);
              setRequestedPage(1);
            }}
            page={page}
            totalPages={totalPages}
            onPrevPage={() => setRequestedPage((current) => Math.max(1, current - 1))}
            onNextPage={() => setRequestedPage((current) => Math.min(totalPages, current + 1))}
            onDelete={handleDelete}
          />
          <NewProcessForm
            onCreate={handleCreate}
            departments={departments}
            processes={processes}
            saving={saving}
          />
        </div>
      </div>
    </AppLayout>
  );
}
