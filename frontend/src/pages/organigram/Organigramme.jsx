/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useState } from "react";
import { OrgChart } from "../../components/OrgChart";
import { EmployeeTable } from "../../components/EmployeeTable";
import AppLayout from "../../components/layout/AppLayout";
import OrganizationBuilderModal from "../../components/organigramme/OrganizationBuilderModal";
import OrganizationUnitModal from "../../components/organigramme/OrganizationUnitModal";
import { organigramApi } from "../../api/organigram.api";
import { getProcessusList } from "../../api/processus.api";
import { useAuth } from "../../hooks/useAuth";

function normalizeRole(role) {
  return String(role || "").trim().toUpperCase();
}

function userCanManage(user) {
  const roles = (user?.roles || []).map(normalizeRole);
  return roles.includes("CAQ") || roles.includes("ADMIN");
}

function apiErrorMessage(error) {
  const data = error?.response?.data;
  if (!data) return "Une erreur est survenue.";
  if (typeof data.detail === "string") return data.detail;
  if (typeof data === "string") return data;
  return Object.entries(data)
    .map(([field, value]) => `${field}: ${Array.isArray(value) ? value.join(", ") : value}`)
    .join(" ");
}

function collectTreeNodes(units, depth = 0) {
  return units.flatMap((unit) => [
    { id: unit.id, depth },
    ...collectTreeNodes(unit.children || [], depth + 1),
  ]);
}

async function syncDraftNodes(nodes, parentId, keepIds) {
  for (const node of nodes) {
    const payload = {
      name: node.name.trim(),
      type: node.type,
      parentId,
      title: node.title.trim(),
      displayCode: node.displayCode.trim(),
      responsableId: node.responsableId ? Number(node.responsableId) : null,
    };

    const savedUnit = node.id
      ? await organigramApi.updateUnit(node.id, payload)
      : await organigramApi.createUnit(payload);

    keepIds.add(savedUnit.id);
    await syncDraftNodes(node.children || [], savedUnit.id, keepIds);
  }
}

export default function Organigramme() {
  const { user } = useAuth();
  const canManage = userCanManage(user);

  const [tree, setTree] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [loadingTree, setLoadingTree] = useState(true);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [treeError, setTreeError] = useState("");
  const [builderOpen, setBuilderOpen] = useState(false);
  const [modal, setModal] = useState({ open: false, mode: "create", unit: null, parent: null });
  const [saving, setSaving] = useState(false);
  const [builderSaving, setBuilderSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [builderError, setBuilderError] = useState("");

  const userName = useMemo(() => {
    if (!user) return "";
    return `${user.prenom || ""} ${user.nom || ""}`.trim() || user.email;
  }, [user]);

  const userRole = user?.roles?.[0] || "";

  const { employeeAssignments, unitLookup } = useMemo(() => {
    const assignments = {};
    const units = {};

    const walk = (nodes) => {
      nodes.forEach((node) => {
        units[String(node.id)] = node;
        if (node.responsableId) {
          assignments[String(node.responsableId)] = {
            unitId: node.id,
            unitName: node.name,
            type: node.type,
            title: node.title,
            displayCode: node.displayCode,
          };
        }
        walk(node.children || []);
      });
    };

    walk(tree);
    return { employeeAssignments: assignments, unitLookup: units };
  }, [tree]);

  const loadTree = useCallback(async () => {
    setLoadingTree(true);
    setTreeError("");
    try {
      setTree(await organigramApi.getTree());
    } catch (error) {
      setTreeError(apiErrorMessage(error));
    } finally {
      setLoadingTree(false);
    }
  }, []);

  const loadEmployees = useCallback(async () => {
    setLoadingEmployees(true);
    try {
      setEmployees(await organigramApi.getEmployees());
    } finally {
      setLoadingEmployees(false);
    }
  }, []);

  const loadProcesses = useCallback(async () => {
    try {
      setProcesses(await getProcessusList());
    } catch {
      setProcesses([]);
    }
  }, []);

  useEffect(() => {
    loadTree();
    loadEmployees();
    loadProcesses();
  }, [loadTree, loadEmployees, loadProcesses]);

  const openBuilder = () => {
    setBuilderError("");
    setBuilderOpen(true);
  };

  const openCreate = (parent = null) => {
    if (!parent) {
      openBuilder();
      return;
    }
    setFormError("");
    setModal({ open: true, mode: "create", unit: null, parent });
  };

  const openEdit = (unit) => {
    if (unit.type === "ROOT") {
      openBuilder();
      return;
    }
    setFormError("");
    setModal({ open: true, mode: "edit", unit, parent: null });
  };

  const closeModal = () => {
    if (!saving) setModal((current) => ({ ...current, open: false }));
  };

  const closeBuilder = () => {
    if (!builderSaving) setBuilderOpen(false);
  };

  const saveUnit = async (payload) => {
    setSaving(true);
    setFormError("");
    try {
      if (modal.mode === "edit" && modal.unit) {
        await organigramApi.updateUnit(modal.unit.id, payload);
      } else {
        await organigramApi.createUnit(payload);
      }
      setModal((current) => ({ ...current, open: false }));
      await loadTree();
    } catch (error) {
      setFormError(apiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const saveBuilderTree = async (draftTree) => {
    setBuilderSaving(true);
    setBuilderError("");
    try {
      const keepIds = new Set();
      await syncDraftNodes(draftTree, null, keepIds);

      const removedNodes = collectTreeNodes(tree)
        .filter((node) => !keepIds.has(node.id))
        .sort((left, right) => right.depth - left.depth);

      for (const node of removedNodes) {
        await organigramApi.deleteUnit(node.id);
      }

      setBuilderOpen(false);
      await loadTree();
    } catch (error) {
      setBuilderError(apiErrorMessage(error));
    } finally {
      setBuilderSaving(false);
    }
  };

  const deleteUnit = async (unit) => {
    const confirmed = window.confirm(`Supprimer "${unit.name}" ?`);
    if (!confirmed) return;
    try {
      await organigramApi.deleteUnit(unit.id);
      await loadTree();
    } catch (error) {
      setTreeError(apiErrorMessage(error));
    }
  };

  return (
    <AppLayout pageTitle="Organigramme" userName={userName} userRole={userRole}>
      <div className="space-y-4">
        

        <OrgChart
          tree={tree}
          loading={loadingTree}
          error={treeError}
          canManage={canManage}
          employees={employees}
          processes={processes}
          onManage={canManage ? openBuilder : undefined}
          onCreate={openCreate}
          onEdit={openEdit}
          onDelete={deleteUnit}
        />

        <EmployeeTable
          employees={employees}
          loading={loadingEmployees}
          canManage={canManage}
          employeeAssignments={employeeAssignments}
          unitLookup={unitLookup}
        />
      </div>

      <OrganizationUnitModal
        open={modal.open}
        mode={modal.mode}
        unit={modal.unit}
        parent={modal.parent}
        tree={tree}
        employees={employees}
        saving={saving}
        error={formError}
        onClose={closeModal}
        onSubmit={saveUnit}
      />

      <OrganizationBuilderModal
        open={builderOpen}
        tree={tree}
        employees={employees}
        saving={builderSaving}
        error={builderError}
        onClose={closeBuilder}
        onSubmit={saveBuilderTree}
      />
    </AppLayout>
  );
}
