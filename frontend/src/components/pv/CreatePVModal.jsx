import { useEffect, useState, useRef } from "react";
import { X, Upload, AlertCircle, FileText, Check, Users, Calendar, Loader2, ChevronDown } from "lucide-react";
import { pvApi } from "../../api/pv.api";
import { usersApi } from "../../api/users.api";

/* ─── CONFIG ─────────────────────────────────────────────── */

const CATEGORIE_OPTIONS = [
  {
    value: "PV",
    label: "Procès-Verbal",
    description: "Requiert la validation de tous les participants",
    dot: "bg-violet-500",
    activeBg: "bg-violet-50",
    activeBorder: "border-violet-300",
    activeText: "text-violet-700",
    activeDesc: "text-violet-400",
  },
  {
    value: "COMPTE_RENDU",
    label: "Compte Rendu",
    description: "Pas de workflow de validation",
    dot: "bg-amber-400",
    activeBg: "bg-amber-50",
    activeBorder: "border-amber-300",
    activeText: "text-amber-700",
    activeDesc: "text-amber-500",
  },
];

const SOUS_TYPE_OPTIONS = {
  PV: [
    { value: "REVUE_DG", label: "Revue avec DG" },
    { value: "INTERNE_CAQ", label: "Interne CAQ" },
    { value: "REUNION_SERVICE", label: "Réunion de service" },
    { value: "AUTRE", label: "Autre" },
   
  ],
  COMPTE_RENDU: [
    { value: "REUNION_SUIVI", label: "Réunion de suivi" },
    { value: "FORMATION", label: "Formation" },
    { value: "ENQUETE", label: "Enquête" },
    { value: "AUTRE_CR", label: "Autre" },
  ],
};

function FieldLabel({ icon, children, aside }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        {icon && <span className="text-slate-300">{icon}</span>}
        {children}
      </label>
      {aside}
    </div>
  );
}

export default function CreatePVModal({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    categorie: "PV",
    sous_type: "REVUE_DG",
    date: new Date().toISOString().split("T")[0],
    participants: [],
    fichier: null,
  });

  // Quand la catégorie change, reset le sous_type au premier choix disponible
  const handleCategorieChange = (categorie) => {
    const firstSousType = SOUS_TYPE_OPTIONS[categorie][0].value;
    setFormData((prev) => ({ ...prev, categorie, sous_type: firstSousType }));
  };

  useEffect(() => {
    usersApi
      .getUsers()
      .then((data) => setUsers(data.results || data || []))
      .catch(() => setError("Impossible de charger les utilisateurs"))
      .finally(() => setLoadingUsers(false));
  }, []);

  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase();
    return (
      !q ||
      `${u.prenom} ${u.nom}`.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  const handleParticipantToggle = (userId) => {
    if (!userId) return;
    setFormData((prev) => ({
      ...prev,
      participants: prev.participants.includes(userId)
        ? prev.participants.filter((id) => id !== userId)
        : [...prev.participants, userId],
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.includes("pdf")) {
      setError("Seuls les fichiers PDF sont autorisés");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("La taille du fichier ne doit pas dépasser 10 MB");
      return;
    }
    setFormData((prev) => ({ ...prev, fichier: file }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!formData.sous_type) return setError("Veuillez sélectionner un type");
    if (!formData.date) return setError("Veuillez sélectionner une date");
    if (formData.participants.length === 0)
      return setError("Veuillez sélectionner au moins un participant");
    if (!formData.fichier)
      return setError("Veuillez télécharger un fichier PDF");

    setLoading(true);
    try {
      await pvApi.createPV(formData);
      onSuccess();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.sous_type?.[0] ||
          JSON.stringify(err.response?.data) ||
          "Erreur lors de la création"
      );
    } finally {
      setLoading(false);
    }
  };

  const isPV = formData.categorie === "PV";
  const accentColor = isPV ? "#6B21D9" : "#D97706";
  const gradientTop = isPV
    ? "linear-gradient(90deg, #6B21D9 0%, #8B5CF6 100%)"
    : "linear-gradient(90deg, #D97706 0%, #F59E0B 100%)";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(15,23,42,0.55)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="w-full max-w-[650px] bg-white overflow-hidden"
        style={{
          borderRadius: "20px",
          border: "0.5px solid #E9E1F8",
          boxShadow: "0 24px 64px rgba(107,33,217,0.12), 0 4px 16px rgba(0,0,0,0.08)",
        }}
      >
        {/* Bande colorée top */}
        <div className="h-[3px] w-full transition-all duration-300" style={{ background: gradientTop }} />

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5" style={{ borderBottom: "0.5px solid #EEE7FA" }}>
          <div>
            <div
              className="mb-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]"
              style={{ background: "#F3ECFF", color: "#6B21D9", border: "0.5px solid #E9E1F8" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#6B21D9]" />
              Nouveau document
            </div>
            <h2 className="text-[17px] font-semibold text-slate-900 tracking-tight leading-tight">
              Créer un PV / Compte Rendu
            </h2>
            <p className="text-[12px] text-slate-400 mt-0.5">Remplissez les informations ci-dessous</p>
          </div>
          <button
            onClick={onClose}
            className="mt-0.5 w-7 h-7 rounded-[8px] flex items-center justify-center text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-5 max-h-[62vh] overflow-y-auto">

            {error && (
              <div
                className="flex items-start gap-2.5 rounded-[10px] px-4 py-3"
                style={{ background: "#FEF2F2", border: "0.5px solid #FECACA" }}
              >
                <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-[12px] text-red-700 leading-relaxed">{error}</p>
              </div>
            )}

            {/* ── Catégorie ── */}
            <div>
              <FieldLabel>Catégorie</FieldLabel>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIE_OPTIONS.map((opt) => {
                  const isActive = formData.categorie === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleCategorieChange(opt.value)}
                      className={`relative flex items-center gap-3 rounded-[12px] px-4 py-3 border transition-all duration-150 text-left ${
                        isActive
                          ? `${opt.activeBg} ${opt.activeBorder} border`
                          : "bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-white"
                      }`}
                    >
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 transition-colors ${
                          isActive ? opt.dot : "bg-slate-300"
                        }`}
                      />
                      <div className="min-w-0">
                        <p className={`text-[13px] font-semibold leading-tight ${isActive ? opt.activeText : "text-slate-600"}`}>
                          {opt.label}
                        </p>
                        <p className={`text-[10px] mt-0.5 ${isActive ? opt.activeDesc : "text-slate-400"}`}>
                          {opt.description}
                        </p>
                      </div>
                      {isActive && (
                        <div
                          className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                          style={{ background: accentColor }}
                        >
                          <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Sous-type ── */}
            <div>
              <FieldLabel icon={<ChevronDown className="w-3 h-3" />}>Type de réunion</FieldLabel>
              <div className="grid grid-cols-2 gap-2">
                {SOUS_TYPE_OPTIONS[formData.categorie].map((opt) => {
                  const isActive = formData.sous_type === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, sous_type: opt.value }))}
                      className={`rounded-[10px] px-3 py-2.5 text-[12px] font-medium border transition-all text-center ${
                        isActive
                          ? "border-transparent text-white"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                      style={isActive ? { background: accentColor } : {}}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Info workflow PV */}
            {isPV && (
              <div
                className="flex items-start gap-2.5 rounded-[10px] px-4 py-3"
                style={{ background: "#F3ECFF", border: "0.5px solid #E9E1F8" }}
              >
                <FileText className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: "#6B21D9" }} />
                <p className="text-[11px] leading-relaxed" style={{ color: "#6B21D9" }}>
                  Ce PV sera créé en <strong>brouillon</strong>. Vous devrez le soumettre pour que les participants puissent le valider.
                </p>
              </div>
            )}

            {/* ── Date ── */}
            <div>
              <FieldLabel icon={<Calendar className="w-3 h-3" />}>Date</FieldLabel>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                className="w-full h-10 rounded-[10px] px-3.5 text-[13px] text-slate-700 outline-none transition-all"
                style={{ background: "#F8F7FF", border: "0.5px solid #E9E1F8" }}
                onFocus={(e) => { e.target.style.borderColor = "#C4B5FD"; e.target.style.background = "#fff"; }}
                onBlur={(e) => { e.target.style.borderColor = "#E9E1F8"; e.target.style.background = "#F8F7FF"; }}
                required
              />
            </div>

            {/* ── Participants ── */}
            <div>
              <FieldLabel
                icon={<Users className="w-3 h-3" />}
                aside={
                  formData.participants.length > 0 && (
                    <span
                      className="text-[10px] font-semibold rounded-full px-2 py-0.5"
                      style={{ background: "#F3ECFF", color: "#6B21D9" }}
                    >
                      {formData.participants.length} sélectionné{formData.participants.length > 1 ? "s" : ""}
                    </span>
                  )
                }
              >
                Participants
              </FieldLabel>

              <div className="rounded-[12px] overflow-hidden" style={{ border: "0.5px solid #E9E1F8" }}>
                <div
                  className="flex items-center gap-2 px-3 py-2"
                  style={{ borderBottom: "0.5px solid #EEE7FA", background: "#FDFBFF" }}
                >
                  <svg className="w-3 h-3 text-slate-300 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Rechercher un utilisateur…"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="flex-1 text-[12px] bg-transparent outline-none placeholder:text-slate-300 text-slate-700"
                  />
                </div>
                <div className="max-h-44 overflow-y-auto divide-y" style={{ divideColor: "#F5F3FF" }}>
                  {loadingUsers ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-4 h-4 animate-spin text-[#6B21D9]" />
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="py-6 text-center text-[12px] text-slate-400">Aucun utilisateur trouvé</div>
                  ) : (
                    filteredUsers.map((user) => {
                      const isChecked = formData.participants.includes(user.id_user);
                      const initials = `${user.prenom?.[0] || ""}${user.nom?.[0] || ""}`.toUpperCase();
                      return (
                        <div
                          key={user.id_user}
                          onClick={() => handleParticipantToggle(user.id_user)}
                          className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors"
                          style={{ background: isChecked ? "#F3ECFF" : "white" }}
                          onMouseEnter={(e) => { if (!isChecked) e.currentTarget.style.background = "#FDFBFF"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = isChecked ? "#F3ECFF" : "white"; }}
                        >
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                            style={{ background: isChecked ? "#6B21D9" : "#EDE9FE", color: isChecked ? "white" : "#6B21D9" }}
                          >
                            {initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium text-slate-800 truncate leading-tight">
                              {user.prenom} {user.nom}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                          </div>
                          <div
                            className="w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all"
                            style={{ borderColor: isChecked ? "#6B21D9" : "#CBD5E1", background: isChecked ? "#6B21D9" : "transparent" }}
                          >
                            {isChecked && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* ── Fichier ── */}
            <div>
              <FieldLabel
                  icon={<FileText className="w-3 h-3" />}
                  aside={
                    <span
                      className="text-[10px] font-semibold rounded-full px-2 py-0.5"
                      style={{ background: "#FEF2F2", color: "#DC2626", border: "0.5px solid #FECACA" }}
                    >
                      Obligatoire
                    </span>
                  }
                >
                  Fichier PDF
                </FieldLabel>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative rounded-[12px] cursor-pointer transition-all duration-200"
                style={{
                  border: `2px dashed ${formData.fichier ? "#A78BFA" : "#E2E8F0"}`,
                  background: formData.fichier ? "#F3ECFF" : "#F8FAFC",
                }}
                onMouseEnter={(e) => { if (!formData.fichier) { e.currentTarget.style.borderColor = "#C4B5FD"; e.currentTarget.style.background = "#FDFBFF"; } }}
                onMouseLeave={(e) => { if (!formData.fichier) { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.background = "#F8FAFC"; } }}
              >
                <div className="flex flex-col items-center justify-center py-7 px-4">
                  {formData.fichier ? (
                    <>
                      <div className="w-10 h-10 rounded-[12px] flex items-center justify-center mb-3" style={{ background: "#EDE9FE" }}>
                        <FileText className="w-5 h-5" style={{ color: "#6B21D9" }} />
                      </div>
                      <p className="text-[13px] font-semibold text-[#6B21D9] text-center truncate max-w-full px-4">
                        {formData.fichier.name}
                      </p>
                      <p className="text-[11px] mt-1" style={{ color: "#A78BFA" }}>
                        {(formData.fichier.size / (1024 * 1024)).toFixed(2)} MB · <span className="underline">Cliquer pour changer</span>
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-[12px] flex items-center justify-center mb-3" style={{ background: "#EEE7FA" }}>
                        <Upload className="w-5 h-5 text-slate-400" />
                      </div>
                      <p className="text-[13px] font-medium text-slate-600">Importer un fichier PDF</p>
                      <p className="text-[11px] text-slate-400 mt-1">Glissez-déposez ou cliquez · max 10 MB</p>
                      <p className="text-[11px] text-red-500 mt-1.5 font-medium">* Ce champ est requis pour créer le document</p>
                    </>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            className="flex gap-2.5 px-6 py-4"
            style={{ borderTop: "0.5px solid #EEE7FA", background: "#FDFBFF" }}
          >
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-[10px] text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-100"
              style={{ border: "0.5px solid #E2E8F0", background: "white" }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 h-10 rounded-[10px] text-[13px] font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: `linear-gradient(135deg, ${accentColor} 0%, ${isPV ? "#8B5CF6" : "#F59E0B"} 100%)` }}
            >
              {loading ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" />Création…</>
              ) : (
                `Créer le ${isPV ? "PV" : "Compte Rendu"}`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}