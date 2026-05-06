/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useState } from "react";
import { OrgChart } from "../../components/OrgChart";
import { EmployeeTable } from "../../components/EmployeeTable";
import AppLayout from "../../components/layout/AppLayout";
import OrganizationUnitModal from "../../components/organigramme/OrganizationUnitModal";
import { organigramApi } from "../../api/organigram.api";
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

export default function Organigramme() {
  const { user } = useAuth();
  const canManage = userCanManage(user);

  const [tree, setTree] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loadingTree, setLoadingTree] = useState(true);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [treeError, setTreeError] = useState("");
  const [modal, setModal] = useState({ open: false, mode: "create", unit: null, parent: null });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const userName = useMemo(() => {
    if (!user) return "";
    return `${user.prenom || ""} ${user.nom || ""}`.trim() || user.email;
  }, [user]);

  const userRole = user?.roles?.[0] || "";

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

  useEffect(() => {
    loadTree();
    loadEmployees();
  }, [loadTree, loadEmployees]);

  const openCreate = (parent = null) => {
    setFormError("");
    setModal({ open: true, mode: "create", unit: null, parent });
  };

  const openEdit = (unit) => {
    setFormError("");
    setModal({ open: true, mode: "edit", unit, parent: null });
  };

  const closeModal = () => {
    if (!saving) setModal((current) => ({ ...current, open: false }));
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
      <div className="space-y-6">
        <OrgChart
          tree={tree}
          loading={loadingTree}
          error={treeError}
          canManage={canManage}
          onCreate={openCreate}
          onEdit={openEdit}
          onDelete={deleteUnit}
        />
        <EmployeeTable
          employees={employees}
          loading={loadingEmployees}
          canManage={canManage}
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
    </AppLayout>
  );
}
