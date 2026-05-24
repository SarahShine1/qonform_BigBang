import { AlertCircle, ArrowRight, BookOpen, ChevronRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { getDownloadUrl } from "../../api/documents";

const TYPE_SUPPORT_STYLES = {
  Guide: "bg-blue-50 text-blue-700",
  Reglementation: "bg-amber-50 text-amber-700",
  Norme: "bg-emerald-50 text-emerald-700",
};

function formatDate(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function AuditResourcesCard({
  resources = [],
  loading = false,
  error = "",
}) {
  const [openingId, setOpeningId] = useState(null);

  async function handleOpenResource(resource) {
    if (!resource?.id_document) return;

    setOpeningId(resource.id_document);
    try {
      const data = await getDownloadUrl(resource.id_document);
      if (data?.url) {
        window.open(data.url, "_blank", "noopener,noreferrer");
      }
    } catch {
      window.location.assign("/documents");
    } finally {
      setOpeningId(null);
    }
  }

  return (
    <section className="flex h-full flex-col rounded-[12px] border border-[#E9E1F8] bg-white p-2.5 shadow-[0_10px_20px_rgba(48,16,103,0.07)]">
      <div className="flex items-center gap-2.5">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#F3ECFF] text-[#6B21D9]">
          <BookOpen className="h-3.5 w-3.5" />
        </div>
        <div>
          <h3 className="text-[12px] font-semibold text-slate-900">Ressources documentaires</h3>
          <span className="mt-0.5 block h-[2px] w-7 bg-[#F4B740]" />
        </div>
      </div>

      <div className="mt-1.5 space-y-0">
        {loading ? (
          <div className="flex items-center gap-2 rounded-[10px] border border-dashed border-[#E9E1F8] px-2.5 py-3 text-[11px] text-slate-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Chargement des ressources...
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 rounded-[10px] border border-rose-200 bg-rose-50 px-2.5 py-3 text-[11px] text-rose-700">
            <AlertCircle className="h-3.5 w-3.5" />
            {error}
          </div>
        ) : resources.length === 0 ? (
          <div className="rounded-[10px] border border-dashed border-[#E9E1F8] px-2.5 py-3 text-[11px] text-slate-500">
            Aucun document support disponible.
          </div>
        ) : (
          resources.map((resource) => (
            <button
              key={resource.id_document}
              type="button"
              onClick={() => handleOpenResource(resource)}
              className="flex w-full items-center justify-between gap-3 border-b border-[#F1EBFB] px-0 py-1 text-left text-[10.5px] text-slate-600 transition hover:bg-[#FCFAFF] last:border-b-0"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate leading-4 text-slate-700">
                  {resource.nom_fichier}
                </p>
                <div className="mt-0.5 flex items-center gap-1.5 text-[9.5px] text-slate-400">
                  {resource.type_support ? (
                    <span
                      className={[
                        "rounded-full px-1.5 py-0.5 font-medium",
                        TYPE_SUPPORT_STYLES[resource.type_support] || "bg-slate-100 text-slate-600",
                      ].join(" ")}
                    >
                      {resource.type_support}
                    </span>
                  ) : null}
                  {resource.date_upload ? <span>{formatDate(resource.date_upload)}</span> : null}
                </div>
              </div>

              {openingId === resource.id_document ? (
                <Loader2 className="h-[11px] w-[11px] animate-spin text-[#7C61C0]" />
              ) : (
                <ChevronRight className="h-[11px] w-[11px] text-[#7C61C0]" />
              )}
            </button>
          ))
        )}
      </div>

      <Link
        to="/documents"
        className="mt-1.5 inline-flex items-center gap-1.5 text-[9.5px] font-semibold text-[#58148E] transition hover:text-[#3B0A7A]"
      >
        Voir toutes les ressources
        <ArrowRight className="h-3 w-3" />
      </Link>
    </section>
  );
}
