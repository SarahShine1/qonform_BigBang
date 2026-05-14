import { Camera, Upload, X } from "lucide-react";

function getInitials(fullName = "", fallbackEmail = "") {
  const source = fullName.trim() || fallbackEmail.trim() || "U";
  return source
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0])
    .join("")
    .toUpperCase();
}

export default function ProfilePhotoUploader({
  currentPhoto,
  previewUrl,
  fullName,
  email,
  selectedFileName,
  uploading,
  error,
  success,
  onFileChange,
  onUpload,
  onClearSelection,
}) {
  const avatarSrc = previewUrl || currentPhoto || "";

  return (
    <section className="rounded-[18px] border border-[#E9E1F8] bg-white p-5 shadow-[0_14px_28px_rgba(88,20,142,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="inline-flex rounded-full border border-[#E9E1F8] bg-[#F3ECFF] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6B21D9]">
            Photo de profil
          </span>
          <h2 className="mt-3 text-[18px] font-semibold text-slate-900">Identité visuelle</h2>
          <span className="mt-2 block h-[2px] w-10 rounded-full bg-[#F4B740]" />
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#F8F2FF] text-[#58148E]">
          <Camera className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-5 flex flex-col items-center gap-4 text-center">
        {avatarSrc ? (
          <img
            src={avatarSrc}
            alt={fullName || email || "Photo de profil"}
            className="h-28 w-28 rounded-full border border-[#E9E1F8] object-cover shadow-sm"
          />
        ) : (
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-[linear-gradient(180deg,#6B21D9_0%,#58148E_100%)] text-[30px] font-semibold text-white shadow-[0_12px_24px_rgba(88,20,142,0.18)]">
            {getInitials(fullName, email)}
          </div>
        )}

        <div className="w-full rounded-[14px] border border-dashed border-[#E9E1F8] bg-[#FCFAFF] px-4 py-3">
          <p className="text-[12px] font-medium text-slate-700">
            JPG, JPEG, PNG ou WEBP
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Taille maximale : 2 Mo</p>

          {selectedFileName ? (
            <div className="mt-3 rounded-[12px] border border-[#E9E1F8] bg-white px-3 py-2 text-left">
              <p className="truncate text-[12px] font-medium text-slate-700">{selectedFileName}</p>
              <button
                type="button"
                onClick={onClearSelection}
                className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 transition hover:text-slate-700"
              >
                <X className="h-3.5 w-3.5" />
                Retirer cette image
              </button>
            </div>
          ) : null}

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <label className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-[12px] border border-[#E9E1F8] bg-white px-4 py-2.5 text-[12px] font-semibold text-[#58148E] transition hover:bg-[#FBF8FF]">
              <Camera className="h-4 w-4" />
              Changer la photo
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={onFileChange}
              />
            </label>

            <button
              type="button"
              onClick={onUpload}
              disabled={!selectedFileName || uploading}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-[12px] bg-[#58148E] px-4 py-2.5 text-[12px] font-semibold text-white shadow-[0_10px_20px_rgba(88,20,142,0.18)] transition hover:bg-[#4A1178] disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <Upload className="h-4 w-4" />
              {uploading ? "Envoi..." : "Téléverser"}
            </button>
          </div>

          {error ? (
            <div className="mt-3 rounded-[12px] border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-600">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="mt-3 rounded-[12px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-700">
              {success}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
