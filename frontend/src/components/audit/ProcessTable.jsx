import { FilePlus2, Search, Trash2, UsersRound } from "lucide-react";

function getProcessCode(process, index) {
  return process.code_process || process.code || process.code_processus || process.reference || `PR-${String(index + 1).padStart(2, "0")}`;
}

function getProcessTitle(process) {
  return process.processus || process.nom || process.name || process.intitule || process.title || "Processus sans titre";
}

function getDepartmentName(process) {
  if (typeof process.departement === "string") return process.departement;
  if (process.departement?.nom) return process.departement.nom;
  return process.department || process.departement_nom || process.service || "Non rattache";
}

function getTypeLabel(process) {
  return process.typeLabel || process.type_process || process.type || "-";
}

export default function ProcessTable({
  processes = [],
  loading = false,
  search,
  onSearchChange,
  page = 1,
  totalPages = 1,
  onPrevPage,
  onNextPage,
  onDelete,
}) {
  return (
    <section className="rounded-[12px] border border-[#E9E1F8] bg-white p-2.5 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-purple-50 text-purple-700">
          <FilePlus2 className="h-3.5 w-3.5" />
        </div>
        <h2 className="text-[11.5px] font-semibold text-[#121942]">Processus identifies</h2>
      </div>

      <label className="mb-2 flex h-7.5 max-w-[250px] items-center gap-2 rounded-[7px] border border-slate-200 bg-white px-2.5 text-slate-400 shadow-sm focus-within:border-purple-300">
        <input
          value={search}
          onChange={(event) => onSearchChange?.(event.target.value)}
          placeholder="Rechercher un processus..."
          className="h-full flex-1 bg-transparent text-[11.5px] text-slate-700 outline-none placeholder:text-slate-400"
        />
        <Search className="h-3.5 w-3.5" />
      </label>

      <div className="overflow-hidden rounded-[8px] border border-slate-200">
        <table className="w-full table-fixed text-left">
          <thead>
            <tr className="bg-slate-50 text-[10px] font-semibold text-slate-500">
              <th className="w-[145px] px-2.5 py-1.5">Code</th>
              <th className="px-2.5 py-1.5">Processus</th>
              <th className="w-[150px] px-2.5 py-1.5">Departement</th>
              <th className="w-[100px] px-2.5 py-1.5">Type</th>
              <th className="w-[52px] px-2 py-1.5 text-center">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-3 py-7 text-center text-[11px] text-slate-400">
                  Chargement des processus...
                </td>
              </tr>
            ) : processes.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-7 text-center text-[11px] text-slate-400">
                  Aucun processus identifie.
                </td>
              </tr>
            ) : (
              processes.map((process, index) => (
                <tr key={process.id || process.id_processus || getProcessCode(process, index)} className="h-7.5 text-[10.5px] text-slate-600">
                  <td className="px-2.5 py-1.5 font-medium text-slate-700">{getProcessCode(process, index)}</td>
                  <td className="truncate px-2.5 py-1.5 font-medium text-slate-600">{getProcessTitle(process)}</td>
                  <td className="px-2.5 py-1.5">
                    <div className="flex items-center gap-1.5 truncate">
                      <UsersRound className="h-3 w-3 shrink-0 text-slate-500" />
                      <span className="truncate">{getDepartmentName(process)}</span>
                    </div>
                  </td>
                  <td className="px-2.5 py-1.5 text-slate-500">{getTypeLabel(process)}</td>
                  <td className="px-2 py-1.5 text-center">
                    <button
                      type="button"
                      onClick={() => onDelete?.(process)}
                      className="inline-flex h-6 w-6 items-center justify-center rounded-[6px] text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                      title="Supprimer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-2 flex items-center justify-between text-[10.5px] font-medium text-slate-500">
        <span>{processes.length} processus affiches</span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onPrevPage}
            disabled={page <= 1}
            className="flex h-7 w-7 items-center justify-center rounded-[7px] border border-slate-200 text-slate-400 disabled:opacity-40"
          >
            {"<"}
          </button>
          <span className="flex min-w-[64px] items-center justify-center rounded-[7px] bg-purple-700 px-2 py-1 text-white">
            {page} / {Math.max(totalPages, 1)}
          </span>
          <button
            type="button"
            onClick={onNextPage}
            disabled={page >= totalPages}
            className="flex h-7 w-7 items-center justify-center rounded-[7px] border border-slate-200 text-slate-400 disabled:opacity-40"
          >
            {">"}
          </button>
        </div>
      </div>
    </section>
  );
}
