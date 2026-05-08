import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import {
  getTachesPlanifieesChef,
  createTachePlanifieeChef,
  updateTachePlanifieeChef,
  deleteTachePlanifieeChef,
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

function UserIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M4 22C4 17.5817 7.58172 14 12 14C16.4183 14 20 17.5817 20 22"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}
function NotificationIcon() {
  return (
    <svg className="w-[17px] h-[17px]" viewBox="0 0 24 24" fill="none">
      <path
        d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6981 21.5547 10.4458 21.3031 10.27 21"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg className="w-[17px] h-[17px]" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 15.5C13.933 15.5 15.5 13.933 15.5 12C15.5 10.067 13.933 8.5 12 8.5C10.067 8.5 8.5 10.067 8.5 12C8.5 13.933 10.067 15.5 12 15.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M19.4 15C19.2 15.45 19.14 15.95 19.23 16.43C19.32 16.91 19.55 17.35 19.9 17.7L20 17.8L18 20L17.86 19.9C17.51 19.55 17.07 19.32 16.59 19.23C16.11 19.14 15.61 19.2 15.16 19.4C14.72 19.59 14.34 19.9 14.07 20.3C13.8 20.7 13.65 21.18 13.65 21.66V22H10.35V21.66C10.35 21.18 10.2 20.7 9.93 20.3C9.66 19.9 9.28 19.59 8.84 19.4C8.39 19.2 7.89 19.14 7.41 19.23C6.93 19.32 6.49 19.55 6.14 19.9L6 20L4 17.8L4.1 17.7C4.45 17.35 4.68 16.91 4.77 16.43C4.86 15.95 4.8 15.45 4.6 15C4.41 14.56 4.1 14.18 3.7 13.91C3.3 13.64 2.82 13.5 2.34 13.5H2V10.5H2.34C2.82 10.5 3.3 10.36 3.7 10.09C4.1 9.82 4.41 9.44 4.6 9C4.8 8.55 4.86 8.05 4.77 7.57C4.68 7.09 4.45 6.65 4.1 6.3L4 6.2L6 4L6.14 4.1C6.49 4.45 6.93 4.68 7.41 4.77C7.89 4.86 8.39 4.8 8.84 4.6C9.28 4.41 9.66 4.1 9.93 3.7C10.2 3.3 10.35 2.82 10.35 2.34V2H13.65V2.34C13.65 2.82 13.8 3.3 14.07 3.7C14.34 4.1 14.72 4.41 15.16 4.6C15.61 4.8 16.11 4.86 16.59 4.77C17.07 4.68 17.51 4.45 17.86 4.1L18 4L20 6.2L19.9 6.3C19.55 6.65 19.32 7.09 19.23 7.57C19.14 8.05 19.2 8.55 19.4 9C19.59 9.44 19.9 9.82 20.3 10.09C20.7 10.36 21.18 10.5 21.66 10.5H22V13.5H21.66C21.18 13.5 20.7 13.64 20.3 13.91C19.9 14.18 19.59 14.56 19.4 15Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
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

function ChefTachesPage() {
  const [taches, setTaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailTache, setDetailTache] = useState(null);
  const [search, setSearch] = useState("");
  const [prioriteFilter, setPrioriteFilter] = useState("Toutes les priorités");
  const [statutFilter, setStatutFilter] = useState("Tous les statuts");
  const [tacheEnModification, setTacheEnModification] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    async function chargerTaches() {
      setLoading(true);
      const data = await getTachesPlanifieesChef();
      setTaches(data);
      setLoading(false);
    }

    chargerTaches();
  }, []);

  const tachesFiltrees = taches.filter((tache) => {
    const recherche = search.toLowerCase();

    const intitule = tache.intitule?.toLowerCase() || "";
    const type = tache.type?.toLowerCase() || "";
    const responsable = tache.responsable?.toLowerCase() || "";

    const matchSearch =
      intitule.includes(recherche) ||
      type.includes(recherche) ||
      responsable.includes(recherche);

    const matchPriorite =
      prioriteFilter === "Toutes les priorités" ||
      tache.priorite === prioriteFilter;

    const matchStatut =
      statutFilter === "Tous les statuts" || tache.statut === statutFilter;

    return matchSearch && matchPriorite && matchStatut;
  });

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

    if (tacheEnModification) {
      const tacheModifiee = await updateTachePlanifieeChef(
        tacheEnModification.id,
        {
          ...tacheEnModification,
          ...form,
        }
      );

      setTaches((previousTaches) =>
        previousTaches.map((tache) =>
          tache.id === tacheEnModification.id ? tacheModifiee : tache
        )
      );
    } else {
      const nouvelleTache = await createTachePlanifieeChef({
        ...form,
        statut: "Planifiée",
      });

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
    <div className="w-full min-h-screen flex bg-white">
      <Navbar />

      <main className="flex-1 min-h-screen bg-white overflow-hidden">
       <header className="h-[58px] border-b border-[#efefef] flex items-center justify-between px-[21px] bg-white">
        <div></div>

  <div className="flex items-center gap-[14px]">
    <button
      type="button"
      title="Notifications"
      className="relative w-8 h-8 rounded-full  text-[#777783] flex items-center justify-center hover:bg-[#f7f7f8] hover:text-[#641ab5] transition"
    >
      <NotificationIcon />

      <span className="absolute top-[6px] right-[7px] w-[7px] h-[7px] rounded-full bg-red-500 border border-white"></span>
    </button>

    <button
      type="button"
      title="Paramètres"
      className="w-8 h-8 rounded-full  text-[#777783] flex items-center justify-center hover:bg-[#f7f7f8] hover:text-[#641ab5] transition"
    >
      <SettingsIcon />
    </button>

    <div className="w-px h-7 bg-[#eeeeee]"></div>

    <div className="flex items-center gap-[10px]">
      <div className="flex flex-col text-right leading-tight">
        <strong className="text-[12px] text-[#111827] font-bold">
          Ahmed BENAUI
        </strong>
        <span className="text-[10px] text-[#7b7b85] mt-[3px]">
          Chef de projet qualité
        </span>
      </div>

      <div className="w-7 h-7 rounded-full bg-[#e7fff0] text-[#10b981] flex items-center justify-center">
        <UserIcon />
      </div>
    </div>
  </div>
        </header>

        <section className="px-9 py-7">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-[22px] font-bold text-[#000000]">
              Tâches planifiées
            </h1>

         <button
            type="button"
            onClick={() => {
              setTacheEnModification(null);
              setForm(initialForm);
              setFormError("");
              setModalOpen(true);
            }}
            className="h-[34px] px-4 rounded-[7px] bg-[#641ab5] text-white text-[13px] font-medium hover:bg-[#55169d] transition"
          >
            + Planifier une tâche
          </button>
          </div>

          <div className="bg-white">
            

            <div className="flex items-center gap-2 mb-6">
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
                <option>Terminée</option>
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
                      <th className="text-left text-[12px] font-medium text-[#c0c0c8] py-3 px-3 w-[6%]">
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
                              value={tache.responsable}
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

                          <td className="py-3 px-3 align-top">
                            <span
                              className="inline-flex items-center justify-center rounded-md text-[12px] font-medium text-[#641ab5] border border-[#d8b4fe] bg-[#faf5ff] px-2 py-1 whitespace-normal break-words leading-[1.3]"
                              title={tache.statut}
                            >
                              {tache.statut}
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
                <input
                  name="responsable"
                  value={form.responsable}
                  onChange={handleChange}
                  placeholder="Ex: Ahmed BENAUI"
                  className="w-full h-9 border border-[#e6e6e9] rounded-md px-3 text-[12px] outline-none focus:border-[#641ab5]"
                />
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
            {detailTache.responsable || "-"}
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
            <span className="inline-flex items-center justify-center rounded-md text-[12px] font-medium text-[#641ab5] border border-[#d8b4fe] bg-[#faf5ff] px-2 py-1">
              {detailTache.statut || "-"}
            </span>
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
    </div>
  );
}

export default ChefTachesPage;