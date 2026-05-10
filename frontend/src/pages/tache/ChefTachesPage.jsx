import React, { useEffect, useState } from "react";
import { useMemo } from "react";
import { useAuth } from "../../hooks/useAuth";
import AppLayout from "../../components/layout/AppLayout";

import {
  getTachesPlanifieesChef,
  createTachePlanifieeChef,
  updateTachePlanifieeChef,
  deleteTachePlanifieeChef,
  getUtilisateurs,

} from "./chefTacheService";
function SearchIcon() {
  return (
    <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none">
      <path
        d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M16.8 16.8L21 21"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
function EditIcon() {
  return (
    <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 20H8L18.5 9.5L14.5 5.5L4 16V20Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M13.5 6.5L17.5 10.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}
function PlayIcon() {
  return (
    <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none">
      <path
        d="M8 5L19 12L8 19V5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        fill="currentColor"
      />
    </svg>
  );
}
function DeleteIcon() {
  return (
    <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 7H19"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M10 11V17"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M14 11V17"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M8 7L9 4H15L16 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M7 7L8 20H16L17 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function EyeIcon() {
  return (
    <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none">
      <path
        d="M2.5 12C4.5 7.5 8 5.5 12 5.5C16 5.5 19.5 7.5 21.5 12C19.5 16.5 16 18.5 12 18.5C8 18.5 4.5 16.5 2.5 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none">
      <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CancelIcon() {
  return (
    <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none">
      <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
const initialForm = {
  intitule: "",
  description: "",
  type: "",
  responsable: "",
  dateDebut: "",
  dateFin: "",
  priorite: "Haute",
  observations: "",
};

function formatDate(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR");
}
function getStatutAutomatique(tache) {
  if (tache.statut === "Terminée" || tache.statut === "Annulée") {
    return tache.statut;
  }

  if (!tache.dateDebut || !tache.dateFin) {
    return tache.statut || "Planifiée";
  }

  const today = new Date();
  const debut = new Date(tache.dateDebut);
  const fin = new Date(tache.dateFin);

  today.setHours(0, 0, 0, 0);
  debut.setHours(0, 0, 0, 0);
  fin.setHours(0, 0, 0, 0);

  if (today > fin) {
    return "En retard";
  }

  if (tache.statut === "En cours") {
    return "En cours";
  }

  if (today < debut) {
    return "Planifiée";
  }

  return "En cours";
}
function getStatutStyle(statut) {
  switch (statut) {
    case "Planifiée":
      return "text-blue-700 border-blue-200 bg-blue-50";

    case "En cours":
      return "text-orange-700 border-orange-200 bg-orange-50";

    case "En retard":
      return "text-red-700 border-red-200 bg-red-50";

    case "Terminée":
      return "text-green-700 border-green-200 bg-green-50";

    case "Annulée":
      return "text-gray-700 border-gray-200 bg-gray-100";

    default:
      return "text-[#641ab5] border-[#d8b4fe] bg-[#faf5ff]";
  }
}
function getDaysRemaining(dateFin) {
  const today = new Date();
  const end = new Date(dateFin);

  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const diffMs = end - today;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function getDeadlineInfo(dateFin) {
  if (!dateFin) {
    return {
      label: "Non défini",
      daysText: "Deadline non définie",
      textColor: "text-gray-500",
      bgColor: "bg-gray-100",
      progressColor: "bg-gray-400",
      progressPercent: 0,
    };
  }

  const daysLeft = getDaysRemaining(dateFin);

  if (daysLeft < 0) {
    return {
      label: "Dépassée",
      daysText: `${Math.abs(daysLeft)} j de retard`,
      textColor: "text-red-600",
      bgColor: "bg-red-50",
      progressColor: "bg-red-500",
      progressPercent: 100,
    };
  }

  if (daysLeft <= 2) {
    return {
      label: "Urgente",
      daysText: `${daysLeft} j restants`,
      textColor: "text-red-600",
      bgColor: "bg-red-50",
      progressColor: "bg-red-500",
      progressPercent: 95,
    };
  }

  if (daysLeft <= 5) {
    return {
      label: "Proche",
      daysText: `${daysLeft} j restants`,
      textColor: "text-orange-600",
      bgColor: "bg-orange-50",
      progressColor: "bg-orange-400",
      progressPercent: 70,
    };
  }

  if (daysLeft <= 10) {
    return {
      label: "Moyenne",
      daysText: `${daysLeft} j restants`,
      textColor: "text-yellow-600",
      bgColor: "bg-yellow-50",
      progressColor: "bg-yellow-400",
      progressPercent: 45,
    };
  }

  return {
    label: "OK",
    daysText: `${daysLeft} j restants`,
    textColor: "text-green-600",
    bgColor: "bg-green-50",
    progressColor: "bg-green-500",
    progressPercent: 20,
  };
}

function WrappedCell({ value, maxWidth = "max-w-[160px]" }) {
  return (
    <div
      className={`${maxWidth} whitespace-normal break-words leading-[1.4]`}
      title={value || "-"}
    >
      {value || "-"}
    </div>
  );
}
function TachesYearCalendar({ taches }) {
  const [year, setYear] = useState(new Date().getFullYear());

  const colors = [
    { dark: "bg-purple-500", light: "bg-purple-100", text: "text-purple-700" },
    { dark: "bg-blue-500", light: "bg-blue-100", text: "text-blue-700" },
    { dark: "bg-green-500", light: "bg-green-100", text: "text-green-700" },
    { dark: "bg-orange-400", light: "bg-orange-100", text: "text-orange-700" },
    { dark: "bg-pink-500", light: "bg-pink-100", text: "text-pink-700" },
    { dark: "bg-red-500", light: "bg-red-100", text: "text-red-700" },
  ];

  const months = Array.from({ length: 12 }, (_, i) => i);
  const weekDays = ["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"];

  function normalize(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function getDaysInMonth(month) {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startDay = first.getDay() === 0 ? 6 : first.getDay() - 1;

    const days = [];

    for (let i = 0; i < startDay; i++) days.push(null);

    for (let d = 1; d <= last.getDate(); d++) {
      days.push(new Date(year, month, d));
    }

    return days;
  }

  function getTachesForDay(day) {
    if (!day) return [];

    return taches
      .map((tache, index) => ({ ...tache, color: colors[index % colors.length] }))
      .filter((tache) => {
        if (!tache.dateDebut || !tache.dateFin) return false;

        const current = normalize(day);
        const debut = normalize(tache.dateDebut);
        const fin = normalize(tache.dateFin);

        return current >= debut && current <= fin;
      });
  }

  function isStart(day, tache) {
    return normalize(day).getTime() === normalize(tache.dateDebut).getTime();
  }

  function isEnd(day, tache) {
    return normalize(day).getTime() === normalize(tache.dateFin).getTime();
  }

  return (
    <div className="mb-8 rounded-2xl border border-[#eee] bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-[18px] font-bold text-[#111827]">
          Calendrier des tâches
        </h2>

        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="h-9 rounded-md border border-[#e6e6e9] bg-white px-3 text-[12px] outline-none"
        >
          {[2024, 2025, 2026, 2027, 2028].map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-5 flex flex-wrap gap-4">
        {taches.map((tache, index) => {
          const color = colors[index % colors.length];

          return (
            <div key={tache.id} className="flex items-center gap-2 text-[11px]">
              <span className={`h-3 w-3 rounded-full ${color.dark}`} />
              <span className="text-[#444]">
                {tache.intitule} : {formatDate(tache.dateDebut)} →{" "}
                {formatDate(tache.dateFin)}
              </span>
            </div>
          );
        })}
      </div>

          <div className="grid grid-cols-6 gap-2">
          {months.map((month) => (
          <div key={month} className="rounded-xl border border-[#f0f0f0] p-2">
            <h3 className="mb-3 text-center text-[13px] font-bold text-[#111827]">
              {new Date(year, month).toLocaleDateString("fr-FR", {
                month: "long",
              })}
            </h3>

            <div className="mb-2 grid grid-cols-7 text-center text-[7px] font-semibold text-[#9ca3af]">
              {weekDays.map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-y-2">
              {getDaysInMonth(month).map((day, index) => {
                const tachesDuJour = getTachesForDay(day);
                const mainTache = tachesDuJour[0];

                return (
                  <div
                    key={index}
                    className="relative flex h-6 items-center justify-center"
                  >
                    {day && mainTache && (
                      <div
                        className={`absolute left-0 right-0 h-6 ${
                          mainTache.color.light
                        } ${
                          isStart(day, mainTache) ? "rounded-l-full" : ""
                        } ${isEnd(day, mainTache) ? "rounded-r-full" : ""}`}
                      />
                    )}

                    {day && (
                      <div
                        title={
                          mainTache
                            ? `${mainTache.intitule} : ${formatDate(
                                mainTache.dateDebut
                              )} → ${formatDate(mainTache.dateFin)}`
                            : ""
                        }
                        className={`relative z-10 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold ${
                          mainTache
                            ? isStart(day, mainTache) || isEnd(day, mainTache)
                              ? `${mainTache.color.dark} text-white shadow-sm`
                              : `${mainTache.color.text}`
                            : "text-[#4b5563]"
                        }`}
                      >
                        {day.getDate()}
                      </div>
                    )}

                    {tachesDuJour.length > 1 && (
                      <span className="absolute -bottom-1 right-1 z-20 h-1.5 w-1.5 rounded-full bg-[#111827]" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
function TachesGantt({ taches }) {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const colors = [
    "bg-pink-400",
    "bg-blue-400",
    "bg-orange-400",
    "bg-green-400",
    "bg-cyan-400",
    "bg-purple-400",
  ];

  const jours = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    return date;
  });

  function normalize(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function changerSemaine(value) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + value);
    setStartDate(d);
  }

  return (
    <div className="mb-8 rounded-2xl border border-[#eee] bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-[18px] font-bold text-[#111827]">
          Planning des tâches
        </h2>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => changerSemaine(-14)}
            className="h-8 rounded-md border border-[#e6e6e9] px-3 text-[12px]"
          >
            ◀
          </button>

          <span className="text-[12px] font-medium text-[#555]">
            {formatDate(jours[0])} → {formatDate(jours[jours.length - 1])}
          </span>

          <button
            type="button"
            onClick={() => changerSemaine(14)}
            className="h-8 rounded-md border border-[#e6e6e9] px-3 text-[12px]"
          >
            ▶
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[1050px]">
          <div className="grid grid-cols-[180px_repeat(14,1fr)] border-b border-[#eee] pb-3">
            <div className="text-[12px] font-semibold text-[#9ca3af]">
              Tâches
            </div>

            {jours.map((jour) => (
              <div key={jour.toISOString()} className="text-center">
                <div className="text-[10px] font-semibold text-[#9ca3af]">
                  {jour.toLocaleDateString("fr-FR", { weekday: "short" })}
                </div>
                <div className="text-[12px] font-bold text-[#111827]">
                  {jour.getDate()}
                </div>
              </div>
            ))}
          </div>

          <div className="max-h-[360px] overflow-y-auto pr-2 thin-scrollbar">
            {taches.map((tache, index) => {
              const debut = normalize(tache.dateDebut);
              const fin = normalize(tache.dateFin);
              const color = colors[index % colors.length];

              return (
                <div
                  key={tache.id}
                  className="grid grid-cols-[180px_repeat(14,1fr)] items-center border-b border-[#f4f4f4] py-4"
                >
                  <div className="pr-4">
                    <div className="truncate text-[12px] font-semibold text-[#111827]">
                      {tache.intitule}
                    </div>
                    <div className="text-[10px] text-[#9ca3af]">
                      {formatDate(tache.dateDebut)} → {formatDate(tache.dateFin)}
                    </div>
                  </div>

                  {jours.map((jour) => {
  const current = normalize(jour);
  const active = current >= debut && current <= fin;
  const start = current.getTime() === debut.getTime();
  const end = current.getTime() === fin.getTime();

  return (
    <div
      key={jour.toISOString()}
      className="relative h-12 "
    >
      {active && (
        <div
          className={`absolute top-1/2 h-7 -translate-y-1/2 ${color}
          ${start ? "left-1 rounded-l-md" : "left-0"}
          ${end ? "right-1 rounded-r-md" : "right-0"}
          `}
        />
      )}
    </div>
  );
})}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
function ChefTachesPage() {
  const { user } = useAuth();

  const [taches, setTaches] = useState([]); // Définir taches à un tableau vide

  const userName = user
    ? `${user.prenom || ""} ${user.nom || ""}`.trim() || user.email
    : "";

  const userRole = user?.roles?.[0] || "";
  const role = userRole;

 const utilisateurId =
  user?.id_user ||
  user?.utilisateur?.id_user ||
  localStorage.getItem("id_user") ||
  localStorage.getItem("utilisateurId");


  const [loading, setLoading] = useState(true);
  const [detailTache, setDetailTache] = useState(null);
  const [search, setSearch] = useState("");
  const [prioriteFilter, setPrioriteFilter] = useState("Toutes les priorités");
  const [statutFilter, setStatutFilter] = useState("Tous les statuts");
  const [tacheEnModification, setTacheEnModification] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState("");
  const [utilisateurs, setUtilisateurs] = useState([]);
const tachesFiltrees = (
  role === "CAQ"
    ? taches
    : taches.filter(
        (tache) => String(tache.responsable) === String(utilisateurId)
      )
).filter((tache) => {
  const recherche = search.toLowerCase();

  const intitule = tache.intitule?.toLowerCase() || "";
  const type = tache.type?.toLowerCase() || tache.type_tache?.toLowerCase() || "";
  const responsable = String(
    tache.responsableNom ||
      tache.responsable_nom ||
      tache.responsable ||
      ""
  ).toLowerCase();

  const matchSearch =
    intitule.includes(recherche) ||
    type.includes(recherche) ||
    responsable.includes(recherche);

  const matchPriorite =
    prioriteFilter === "Toutes les priorités" ||
    tache.priorite === prioriteFilter;

  const statutAffiche = getStatutAutomatique(tache);

  const matchStatut =
    statutFilter === "Tous les statuts" ||
    statutAffiche === statutFilter;

  return matchSearch && matchPriorite && matchStatut;
});


useEffect(() => {
  async function chargerUtilisateurs() {
    const data = await getUtilisateurs();
    console.log("UTILISATEURS CHARGÉS:", data);
    setUtilisateurs(data);
  }

  chargerUtilisateurs();
}, []);
  useEffect(() => {
    async function chargerTaches() {
      setLoading(true);
      const data = await getTachesPlanifieesChef();
      setTaches(data);
      setLoading(false);
    }

    chargerTaches();
  }, []);

//   const tachesFiltrees = taches.filter((tache) => {
//     const recherche = search.toLowerCase();

//     const intitule = tache.intitule?.toLowerCase() || "";
//     const type = tache.type?.toLowerCase() || "";
//     const responsable = String(
//         tache.responsableNom || tache.responsable || ""
//       ).toLowerCase();

//     const matchSearch =
//       intitule.includes(recherche) ||
//       type.includes(recherche) ||
//       responsable.includes(recherche);

//     const matchPriorite =
//       prioriteFilter === "Toutes les priorités" ||
//       tache.priorite === prioriteFilter;

//     const statutAutomatique = getStatutAutomatique(tache);

// const statutAffiche = getStatutAutomatique(tache);

// const matchStatut =
//   statutFilter === "Tous les statuts" || statutAffiche === statutFilter;  
//     return matchSearch && matchPriorite && matchStatut;
//   });

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  }
    function ouvrirModification(tache) {
      setTacheEnModification(tache);

      setForm({
        intitule: tache.intitule || "",
        description: tache.description || "",
        type: tache.type || "",
        responsable: tache.responsable || "",
        dateDebut: tache.dateDebut || "",
        dateFin: tache.dateFin || "",
        priorite: tache.priorite || "Haute",
        observations: tache.observations || "",
      });

      setFormError("");
      setModalOpen(true);
    }
async function demarrerTache(tache) {
  const tacheModifiee = await updateTachePlanifieeChef(tache.id, {
    ...tache,
    statut: "En cours",
  });

  setTaches((previousTaches) =>
    previousTaches.map((item) =>
      item.id === tache.id ? tacheModifiee : item
    )
  );
}
async function terminerTache(tache) {
  const tacheModifiee = await updateTachePlanifieeChef(tache.id, {
    ...tache,
    statut: "Terminée",
  });

  setTaches((previousTaches) =>
    previousTaches.map((item) =>
      item.id === tache.id ? tacheModifiee : item
    )
  );
}
 async function annulerTache(tache) {
  const confirmation = window.confirm("Voulez-vous annuler cette tâche ?");

  if (!confirmation) return;

  const tacheModifiee = await updateTachePlanifieeChef(tache.id, {
    ...tache,
    statut: "Annulée",
  });

  setTaches((previousTaches) =>
    previousTaches.map((item) =>
      item.id === tache.id ? tacheModifiee : item
    )
  );
}

 async function handleSubmit(e) {
  e.preventDefault();

  if (
    !form.intitule ||
    !form.type ||
    !form.responsable ||
    !form.dateDebut ||
    !form.dateFin
  ) {
    setFormError("Veuillez remplir les champs obligatoires.");
    return;
  }

  if (new Date(form.dateFin) < new Date(form.dateDebut)) {
    setFormError("La date de fin doit être après la date de début.");
    return;
  }

  const tache = {
    ...form,
    responsable: form.responsable, // L'ID du responsable
  };

  if (tacheEnModification) {
    const tacheModifiee = await updateTachePlanifieeChef(
      tacheEnModification.id,
      tache
    );
    setTaches((previousTaches) =>
      previousTaches.map((tache) =>
        tache.id === tacheEnModification.id ? tacheModifiee : tache
      )
    );
  } else {
    const nouvelleTache = await createTachePlanifieeChef(tache);
    setTaches((previousTaches) => [nouvelleTache, ...previousTaches]);
  }

  setForm(initialForm);
  setFormError("");
  setTacheEnModification(null);
  setModalOpen(false);
}

async function supprimerTache(id) {
  const confirmation = window.confirm(
    "Voulez-vous vraiment supprimer cette tâche ?"
  );

  if (!confirmation) return;

  await deleteTachePlanifieeChef(id);

  setTaches((previousTaches) =>
    previousTaches.filter((tache) => tache.id !== id)
  );
}
  return (
  <AppLayout pageTitle="Planification des tâches" userName={userName} userRole={userRole}>

      <main className="flex-1 min-h-screen bg-white overflow-hidden">
      

        <section className="px-9 ">
          <div className="flex items-center justify-between ">
            <h1 className="text-[22px] font-bold text-[#000000]">
              Tâches planifiées
            </h1>

      {role === "CAQ" && (
  <button
    type="button"
    onClick={() => {
      setTacheEnModification(null);
      setForm({
        intitule: "",
        description: "",
        type: "",
        responsable: "",
        dateDebut: "",
        dateFin: "",
        priorite: "Moyenne",
        statut: "Planifiée",
        observations: "",
      });
      setModalOpen(true);
    }}
    className="h-[34px] px-4 rounded-[7px] bg-[#641ab5] text-white text-[13px] font-medium hover:bg-[#55169d] transition"
  >
    + Planifier une tâche
  </button>
)}
          </div>
          {role === "CAQ" ? (
            <TachesGantt taches={tachesFiltrees} />
          ) : (
            <TachesYearCalendar taches={tachesFiltrees} />
          )} 
         <div className="bg-white">
            

            <div className="flex items-center gap-2 mb-4">
              <div className="w-[280px] h-8 border border-[#e6e6e9] rounded-md flex items-center gap-2 px-3 text-[#9ca3af]">
                <SearchIcon />

                <input
                  type="text"
                  placeholder="Rechercher une tâche..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-full outline-none border-none text-[11px] text-[#333] placeholder:text-[#b3b3bb]"
                />
              </div>

              <select
                value={prioriteFilter}
                onChange={(e) => setPrioriteFilter(e.target.value)}
                className="h-8 border border-[#e6e6e9] rounded-md bg-white text-[#444] text-[11px] px-3 outline-none"
              >
                <option>Toutes les priorités</option>
                <option>Haute</option>
                <option>Moyenne</option>
                <option>Basse</option>
              </select>

              <select
                value={statutFilter}
                onChange={(e) => setStatutFilter(e.target.value)}
                className="h-8 border border-[#e6e6e9] rounded-md bg-white text-[#444] text-[11px] px-3 outline-none"
              >
                <option>Tous les statuts</option>
                <option>Planifiée</option>
                <option>En cours</option>
                <option>En retard</option>
                <option>Terminée</option>
                <option>Annulée</option>
              </select>
            </div>

            <div className="flex items-center justify-between mb-4">
              <p className="text-[12px] text-[#777783]">
                Liste des tâches planifiées
              </p>

              <span className="text-[10px] text-[#777] bg-[#f0eee9] px-2 py-1 rounded-full">
                {tachesFiltrees.length} tâches
              </span>
            </div>

            {loading ? (
              <div className="p-6 text-center text-[13px] text-[#777]">
                Chargement des tâches...
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full border-collapse table-fixed min-w-[1200px]">
                  <thead>
                    <tr className="border-b border-[#f0f0f0]">
                      <th className="text-left text-[12px] font-medium text-[#c0c0c8] py-3 px-3 w-[20%]">
                        Intitulé tâche
                      </th>
                      <th className="text-left text-[12px] font-medium text-[#c0c0c8] py-3 px-3 w-[13%]">
                        Type tâche
                      </th>
                     
                      <th className="text-left text-[12px] font-medium text-[#c0c0c8] py-3 px-3 w-[12%]">
                        Responsable
                      </th>
                      <th className="text-left text-[12px] font-medium text-[#c0c0c8] py-3 px-3 w-[7%]">
                        Date début
                      </th>
                      <th className="text-left text-[12px] font-medium text-[#c0c0c8] py-3 px-3 w-[7%]">
                        Date fin
                      </th>
                      <th className="text-left text-[12px] font-medium text-[#c0c0c8] py-3 px-3 w-[11%]">
                        Deadline
                      </th>
                      <th className="text-left text-[12px] font-medium text-[#c0c0c8] py-3 px-3 w-[7%]">
                        Priorité
                      </th>
                      <th className="text-left text-[12px] font-medium text-[#c0c0c8] py-3 px-3 w-[7%]">
                        Statut
                      </th>
                      <th className="text-left text-[12px] font-medium text-[#c0c0c8] py-3 px-3 w-[8%]">
                        Action
                      </th>
                    </tr>
                  </thead>

                              <tbody>
                    {tachesFiltrees.map((tache) => {
                      const deadlineInfo = getDeadlineInfo(tache.dateFin);

                      return (
                        <tr key={tache.id} className="border-b border-[#f0f0f0]">
                          <td className="text-[12px] font-medium text-[#2c2c2c] py-3 px-3 align-top">
                            <WrappedCell
                              value={tache.intitule}
                              maxWidth="max-w-[245px]"
                            />
                          </td>

                          <td className="text-[12px] font-medium text-[#2c2c2c] py-3 px-3 align-top">
                            <WrappedCell
                              value={tache.type}
                              maxWidth="max-w-[160px]"
                            />
                          </td>

                          
                          <td className="text-[12px] font-medium text-[#2c2c2c] py-3 px-3 align-top">
                            <WrappedCell
                             value={tache.responsableNom || tache.responsable}
                              maxWidth="max-w-[175px]"
                            />
                          </td>

                          <td className="text-[12px] font-medium text-[#2c2c2c] py-3 px-3 whitespace-nowrap align-top">
                            {formatDate(tache.dateDebut)}
                          </td>

                          <td className="text-[12px] font-medium text-[#2c2c2c] py-3 px-3 whitespace-nowrap align-top">
                            {formatDate(tache.dateFin)}
                          </td>

                          <td className="py-3 px-3 align-top">
                            <div className="flex flex-col gap-1 max-w-[165px]">
                              <div
                                className={`inline-flex items-center justify-center rounded-md px-2 py-1 text-[11px] font-medium w-fit ${deadlineInfo.textColor} ${deadlineInfo.bgColor}`}
                              >
                                {deadlineInfo.label}
                              </div>

                              <span
                                className={`text-[11px] ${deadlineInfo.textColor}`}
                              >
                                {deadlineInfo.daysText}
                              </span>

                              <div className="w-full h-[6px] bg-[#ececec] rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${deadlineInfo.progressColor}`}
                                  style={{
                                    width: `${deadlineInfo.progressPercent}%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                          </td>

                          <td className="text-[12px] font-medium text-[#2c2c2c] py-3 px-3 align-top">
                            <WrappedCell
                              value={tache.priorite}
                              maxWidth="max-w-[90px]"
                            />
                          </td>

                          <td className="py-3 px-2 align-top">
                          <span
                            className={`inline-flex items-center justify-center rounded-md text-[12px] font-medium border px-2 py-1 whitespace-normal break-words leading-[1.3] ${getStatutStyle(getStatutAutomatique(tache))}`}
                            title={getStatutAutomatique(tache)}
                          >
                            {getStatutAutomatique(tache)}
                          </span>
                        </td>

                          <td className="py-3 px-3 align-top">
   <div className="flex items-center gap-2">
  <button
    type="button"
    title="Voir détails"
    onClick={() => setDetailTache(tache)}
    className="text-[#111827] hover:text-[#641ab5]"
  >
    <EyeIcon />
  </button>

  {role === "CAQ" ? (
    <>
      <button
        type="button"
        title="Modifier"
        onClick={() => ouvrirModification(tache)}
        className="text-[#111827] hover:text-[#641ab5]"
      >
        <EditIcon />
      </button>

      <button
        type="button"
        title="Supprimer"
        onClick={() => supprimerTache(tache.id)}
        className="text-[#111827] hover:text-red-500"
      >
        <DeleteIcon />
      </button>
    </>
  ) : (
    <>
      {getStatutAutomatique(tache) === "Planifiée" && (
        <button
        type="button"
        title="Démarrer la tâche"
        onClick={() => demarrerTache(tache)}
        className="text-red-600 hover:text-red-500"
      >
        <PlayIcon />
      </button>
      )}

      {getStatutAutomatique(tache) === "En cours" && (
       <button
          type="button"
          title="Terminer la tâche"
          onClick={() => terminerTache(tache)}
          className="text-black hover:text-blue-800"
        >
          <CheckIcon />
        </button>
      )}

      {getStatutAutomatique(tache) !== "Terminée" &&
        getStatutAutomatique(tache) !== "Annulée" && (
          <button
              type="button"
              title="Annuler la tâche"
              onClick={() => annulerTache(tache)}
              className="text-black hover:text-blue-800"
            >
              <CancelIcon />
            </button>
        )}
    </>
  )}
</div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {tachesFiltrees.length === 0 && (
                  <div className="p-6 text-center text-[13px] text-[#777]">
                    Aucune tâche trouvée.
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center">
          <div className="w-[600px] bg-white rounded-xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[16px] font-bold text-[#171717]">
                {tacheEnModification ? "Modifier la tâche" : "Planifier une tâche"}
              </h3>

          <button
          type="button"
          onClick={() => {
            setModalOpen(false);
            setForm(initialForm);
            setFormError("");
            setTacheEnModification(null);
          }}
          className="text-[#777783] hover:text-[#111827] text-xl"
        >
          ×
        </button>
            </div>

            {formError && (
              <div className="mb-4 text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[12px] text-[#555] mb-1">
                  Intitulé de la tâche *
                </label>
                <input
                  name="intitule"
                  value={form.intitule}
                  onChange={handleChange}
                  placeholder="Ex: Audit terrain service informatique"
                  className="w-full h-9 border border-[#e6e6e9] rounded-md px-3 text-[12px] outline-none focus:border-[#641ab5]"
                />
              </div>

              <div>
                <label className="block text-[12px] text-[#555] mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Décrire brièvement le travail à faire..."
                  rows="3"
                  className="w-full border border-[#e6e6e9] rounded-md px-3 py-2 text-[12px] outline-none focus:border-[#641ab5] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] text-[#555] mb-1">
                    Type de tâche *
                  </label>
                  <select
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    className="w-full h-9 border border-[#e6e6e9] rounded-md px-3 text-[12px] outline-none focus:border-[#641ab5]"
                  >
                    <option value="">Choisir un type</option>
                    <option value="Audit">Audit</option>
                    <option value="Documentation">Documentation</option>
                    <option value="Validation">Validation</option>
                    <option value="Correction">Correction</option>
                    <option value="Réunion">Réunion</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] text-[#555] mb-1">
                    Responsable *
                  </label>
               <select
                  name="responsable"
                  value={form.responsable}
                  onChange={handleChange}
                  className="w-full h-9 border border-[#e6e6e9] rounded-md px-3 text-[12px] bg-white text-[#111827] outline-none focus:border-[#641ab5]"
                >
                  <option value="">Sélectionner un responsable</option>

                  {utilisateurs.map((user) => (
                    <option key={user.id || user.id_user} value={user.id || user.id_user}>
                      {user.prenom || user.first_name || ""} {user.nom || user.last_name || ""} {user.email ? `- ${user.email}` : ""}
                    </option>
                  ))}
                </select>
                </div>
                
              </div>

             
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] text-[#555] mb-1">
                    Date début *
                  </label>
                  <input
                    type="date"
                    name="dateDebut"
                    value={form.dateDebut}
                    onChange={handleChange}
                    className="w-full h-9 border border-[#e6e6e9] rounded-md px-3 text-[12px] outline-none focus:border-[#641ab5]"
                  />
                </div>

                <div>
                  <label className="block text-[12px] text-[#555] mb-1">
                    Date fin *
                  </label>
                  <input
                    type="date"
                    name="dateFin"
                    value={form.dateFin}
                    onChange={handleChange}
                    className="w-full h-9 border border-[#e6e6e9] rounded-md px-3 text-[12px] outline-none focus:border-[#641ab5]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] text-[#555] mb-1">
                  Priorité
                </label>
                <select
                  name="priorite"
                  value={form.priorite}
                  onChange={handleChange}
                  className="w-full h-9 border border-[#e6e6e9] rounded-md px-3 text-[12px] outline-none focus:border-[#641ab5]"
                >
                  <option value="Haute">Haute</option>
                  <option value="Moyenne">Moyenne</option>
                  <option value="Basse">Basse</option>
                </select>
              </div>

              <div>
                <label className="block text-[12px] text-[#555] mb-1">
                  Observations
                </label>
                <textarea
                  name="observations"
                  value={form.observations}
                  onChange={handleChange}
                  placeholder="Ajouter une remarque si nécessaire..."
                  rows="3"
                  className="w-full border border-[#e6e6e9] rounded-md px-3 py-2 text-[12px] outline-none focus:border-[#641ab5] resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    setForm(initialForm);
                    setFormError("");
                    setTacheEnModification(null);
                  }}
                  className="h-9 px-4 rounded-md border border-[#e6e6e9] text-[12px] text-[#555] hover:bg-[#f7f7f8]"
                >
                  Annuler
                </button>

               <button
                  type="submit"
                  className="h-9 px-4 rounded-md bg-[#641ab5] text-white text-[12px] font-medium hover:bg-[#55169d]"
                >
                  {tacheEnModification ? "Enregistrer les modifications" : "Planifier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {detailTache && (
  <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center">
    <div className="w-[560px] bg-white rounded-xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[16px] font-bold text-[#171717]">
          Détails de la tâche
        </h3>

        <button
          type="button"
          onClick={() => setDetailTache(null)}
          className="text-[#777783] hover:text-[#111827] text-xl"
        >
          ×
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-[11px] text-[#9ca3af] mb-1">Intitulé</p>
          <p className="text-[13px] font-medium text-[#171717]">
            {detailTache.intitule || "-"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[11px] text-[#9ca3af] mb-1">Type tâche</p>
            <p className="text-[13px] text-[#2c2c2c]">
              {detailTache.type || "-"}
            </p>
          </div>

         
        </div>

        <div>
          <p className="text-[11px] text-[#9ca3af] mb-1">Responsable</p>
          <p className="text-[13px] text-[#2c2c2c]">
            {detailTache.responsableNom || detailTache.responsable || "-"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[11px] text-[#9ca3af] mb-1">Date début</p>
            <p className="text-[13px] text-[#2c2c2c]">
              {formatDate(detailTache.dateDebut)}
            </p>
          </div>

          <div>
            <p className="text-[11px] text-[#9ca3af] mb-1">Date fin</p>
            <p className="text-[13px] text-[#2c2c2c]">
              {formatDate(detailTache.dateFin)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[11px] text-[#9ca3af] mb-1">Priorité</p>
            <p className="text-[13px] text-[#2c2c2c]">
              {detailTache.priorite || "-"}
            </p>
          </div>

          <div>
            <p className="text-[11px] text-[#9ca3af] mb-1">Statut</p>
            {(() => {
          const statutAffiche = getStatutAutomatique(detailTache);
                  return (
                    <span
                      className={`inline-flex items-center justify-center rounded-md text-[12px] font-medium border px-2 py-1 whitespace-normal break-words leading-[1.3] ${getStatutStyle(statutAffiche)}`}
                      title={statutAffiche}
                    >
                      {statutAffiche}
                    </span>
                  );
             })()}
          </div>
        </div>

        <div>
          <p className="text-[11px] text-[#9ca3af] mb-1">Description</p>
          <div className="min-h-[70px] rounded-md border border-[#eeeeee] bg-[#fafafa] px-3 py-2 text-[13px] text-[#2c2c2c] whitespace-pre-wrap">
            {detailTache.description || "Aucune description saisie."}
          </div>
        </div>

        <div>
          <p className="text-[11px] text-[#9ca3af] mb-1">Observations</p>
          <div className="min-h-[70px] rounded-md border border-[#eeeeee] bg-[#fafafa] px-3 py-2 text-[13px] text-[#2c2c2c] whitespace-pre-wrap">
            {detailTache.observations || "Aucune observation saisie."}
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <button
          type="button"
          onClick={() => setDetailTache(null)}
          className="h-9 px-4 rounded-md bg-[#641ab5] text-white text-[12px] font-medium hover:bg-[#55169d]"
        >
          Fermer
        </button>
      </div>
    </div>
  </div>
)}
</AppLayout>
  );
}



export default ChefTachesPage;