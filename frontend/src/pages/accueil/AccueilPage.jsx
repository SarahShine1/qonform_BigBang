import { useEffect, useMemo, useState } from "react";
import AppLayout from "../../components/layout/AppLayout";
import { fetchAccueilResources, fetchAccueilTasks } from "../../api/accueil.api";
import DemingWheel from "../../components/accueil/DemingWheel";
import TodayTasksCard from "../../components/accueil/TodayTasksCard";
import AuditResourcesCard from "../../components/accueil/AuditResourcesCard";
import { useAuth } from "../../hooks/useAuth";

function normalizeRole(role) {
  return String(role || "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function isSameDay(value, reference) {
  const date = new Date(value);
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth() &&
    date.getDate() === reference.getDate()
  );
}

function isDateInRange(value, start, end) {
  if (!value || !start || !end) return false;
  const current = new Date(value);
  const from = new Date(start);
  const to = new Date(end);
  current.setHours(0, 0, 0, 0);
  from.setHours(0, 0, 0, 0);
  to.setHours(0, 0, 0, 0);
  return current >= from && current <= to;
}

function getTaskPriorityWeight(task, today) {
  if (String(task?.statut || "").toUpperCase().includes("TERM")) return 5;
  if (String(task?.statut || "").toUpperCase().includes("ANNUL")) return 6;
  if (isSameDay(task?.dateDebut, today) || isSameDay(task?.dateFin, today)) return 0;
  if (isDateInRange(today, task?.dateDebut, task?.dateFin)) return 1;
  if (task?.dateDebut && new Date(task.dateDebut) > today) return 2;
  if (task?.dateFin && new Date(task.dateFin) < today) return 3;
  return 4;
}

export default function AccueilPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [resources, setResources] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [tasksError, setTasksError] = useState("");
  const [resourcesError, setResourcesError] = useState("");
  const userName = `${user?.prenom || ""} ${user?.nom || ""}`.trim() || user?.email || "Utilisateur";
  const userRole = user?.roles?.[0] || "CAQ";
  const userRoles = useMemo(
    () => (user?.roles || []).map(normalizeRole),
    [user?.roles],
  );
  const userId = user?.id_user || user?.utilisateur?.id_user || null;

  useEffect(() => {
    let active = true;

    async function loadTasks() {
      setTasksLoading(true);
      setTasksError("");
      try {
        const data = await fetchAccueilTasks();
        if (!active) return;
        setTasks(data);
      } catch (error) {
        if (!active) return;
        setTasksError(
          error?.response?.data?.detail || "Impossible de charger les taches."
        );
      } finally {
        if (active) {
          setTasksLoading(false);
        }
      }
    }

    async function loadResources() {
      setResourcesLoading(true);
      setResourcesError("");
      try {
        const data = await fetchAccueilResources();
        if (!active) return;
        setResources(data.items || []);
      } catch (error) {
        if (!active) return;
        setResourcesError(
          error?.response?.data?.detail ||
            "Impossible de charger les ressources documentaires."
        );
      } finally {
        if (active) {
          setResourcesLoading(false);
        }
      }
    }

    loadTasks();
    loadResources();

    return () => {
      active = false;
    };
  }, []);

  const visibleTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const personalTasks = userId
      ? tasks.filter((task) => String(task.responsable) === String(userId))
      : [];
    const managementFallbackRoles = new Set([
      "CAQ",
      "ADMIN",
      "CHEF CELLULE QUALITE",
      "DG",
      "DIRECTION GENERALE",
      "AUDITEUR",
      "AUDITEUR INTERNE",
    ]);
    const canUseGlobalFallback = userRoles.some((role) =>
      managementFallbackRoles.has(role)
    );

    const source = personalTasks.length > 0 || !canUseGlobalFallback ? personalTasks : tasks;

    return source
      .slice()
      .sort((left, right) => {
        const weightDiff =
          getTaskPriorityWeight(left, today) - getTaskPriorityWeight(right, today);
        if (weightDiff !== 0) return weightDiff;

        const leftDate = new Date(left.dateFin || left.dateDebut || 0).getTime();
        const rightDate = new Date(right.dateFin || right.dateDebut || 0).getTime();
        return leftDate - rightDate;
      })
      .slice(0, 4);
  }, [tasks, userId, userRoles]);

  return (
    <AppLayout pageTitle="Accueil" userName={userName} userRole={userRole}>
      <div className="grid gap-3 pb-1">
        <section className="rounded-[12px] border border-[#EEE7FA] bg-[radial-gradient(circle_at_top_left,rgba(107,33,217,0.08),transparent_30%),linear-gradient(180deg,#FFFFFF_0%,#FBF9FF_100%)] px-4 py-2.5 shadow-[0_12px_24px_rgba(60,16,120,0.05)]">
          <h1 className="m-0 text-[clamp(23px,1.8vw,27px)] font-semibold tracking-[-0.04em] text-slate-900">
            Bienvenue sur <span className="text-[#58148E]">Qonform</span>
          </h1>
          <p className="mt-0.5 max-w-3xl text-[13px] leading-[18px] text-slate-500">
            Votre espace d'aide a la preparation de la certification ISO 9001:2015
          </p>
        </section>

        <DemingWheel />

        <section className="grid gap-3 lg:grid-cols-2">
          <TodayTasksCard
            tasks={visibleTasks}
            loading={tasksLoading}
            error={tasksError}
          />
          <AuditResourcesCard
            resources={resources}
            loading={resourcesLoading}
            error={resourcesError}
          />
        </section>
      </div>
    </AppLayout>
  );
}
