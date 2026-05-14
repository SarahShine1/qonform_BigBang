import { useEffect, useMemo, useState } from "react";
import { Loader2, Settings2 } from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import {
  changePassword,
  getMySettings,
  updateMyProfile,
  updatePreferences,
  uploadProfilePhoto,
} from "../../api/settings.api";
import AppearanceSettingsCard from "../../components/settings/AppearanceSettingsCard";
import NotificationSettingsCard from "../../components/settings/NotificationSettingsCard";
import PasswordSettingsCard from "../../components/settings/PasswordSettingsCard";
import ProfilePhotoUploader from "../../components/settings/ProfilePhotoUploader";
import ProfileSettingsCard from "../../components/settings/ProfileSettingsCard";

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const DENSITY_STORAGE_KEY = "qonforme-density";

const defaultPreferences = {
  theme: "light",
  density: "compact",
  notifications: {
    messagerie: true,
    audits: true,
    taches: true,
    documents: true,
  },
};

function mergePreferences(preferences = {}) {
  return {
    theme: preferences.theme === "dark" ? "dark" : "light",
    density: preferences.density === "normal" ? "normal" : "compact",
    notifications: {
      ...defaultPreferences.notifications,
      ...(preferences.notifications || {}),
    },
  };
}

function extractApiErrorMessage(error, fallbackMessage) {
  const data = error?.response?.data;

  if (!data) return fallbackMessage;
  if (typeof data.detail === "string") return data.detail;
  if (typeof data.message === "string") return data.message;
  if (typeof data === "string") return data;

  return Object.values(data)
    .flatMap((value) => {
      if (Array.isArray(value)) return value;
      if (value && typeof value === "object") return Object.values(value).flat();
      return [value];
    })
    .map((value) => String(value))
    .join(" ")
    .trim() || fallbackMessage;
}

function applyDensityPreference(density) {
  const nextDensity = density === "normal" ? "normal" : "compact";
  document.documentElement.setAttribute("data-density", nextDensity);
  localStorage.setItem(DENSITY_STORAGE_KEY, nextDensity);
}

function buildAuthUserPatch(settings, currentUser) {
  return {
    ...(currentUser || {}),
    nom: settings.nom,
    prenom: settings.prenom,
    email: settings.email,
    roles: settings.roles || currentUser?.roles || [],
    departement: settings.departement?.id ?? currentUser?.departement ?? null,
    departement_details: settings.departement ?? null,
    est_actif: settings.est_actif,
    photo_profil: settings.photo_profil ?? currentUser?.photo_profil ?? null,
    preferences: settings.preferences ?? currentUser?.preferences ?? defaultPreferences,
  };
}

export default function ParametresPage() {
  const { user, updateUser } = useAuth();
  const { setTheme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [settings, setSettings] = useState(null);

  const [profileForm, setProfileForm] = useState({ nom: "", prenom: "" });
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [preferencesForm, setPreferencesForm] = useState(defaultPreferences);

  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const [profileState, setProfileState] = useState({ saving: false, error: "", success: "" });
  const [photoState, setPhotoState] = useState({ uploading: false, error: "", success: "" });
  const [passwordState, setPasswordState] = useState({ submitting: false, error: "", success: "" });
  const [appearanceState, setAppearanceState] = useState({ saving: false, error: "", success: "" });
  const [notificationState, setNotificationState] = useState({ saving: false, error: "", success: "" });

  const userName = useMemo(() => {
    const fullName = settings ? `${settings.prenom || ""} ${settings.nom || ""}`.trim() : "";
    return fullName || `${user?.prenom || ""} ${user?.nom || ""}`.trim() || user?.email || "Utilisateur";
  }, [settings, user]);

  const userRole = settings?.roles?.[0] || user?.roles?.[0] || "Utilisateur";

  const passwordFormIsValid =
    passwordForm.current_password.trim().length > 0 &&
    passwordForm.new_password.length >= 8 &&
    passwordForm.new_password === passwordForm.confirm_password;

  useEffect(() => {
    const storedDensity = localStorage.getItem(DENSITY_STORAGE_KEY);
    if (storedDensity === "compact" || storedDensity === "normal") {
      applyDensityPreference(storedDensity);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      setLoading(true);
      setLoadError("");

      try {
        const payload = await getMySettings();
        if (!active) return;

        const normalizedPreferences = mergePreferences(payload.preferences);

        setSettings({ ...payload, preferences: normalizedPreferences });
        setProfileForm({ nom: payload.nom || "", prenom: payload.prenom || "" });
        setPreferencesForm(normalizedPreferences);
        setTheme(normalizedPreferences.theme);
        applyDensityPreference(normalizedPreferences.density);
        updateUser((currentUser) =>
          buildAuthUserPatch({ ...payload, preferences: normalizedPreferences }, currentUser),
        );
      } catch (error) {
        if (!active) return;
        setLoadError(
          extractApiErrorMessage(error, "Impossible de charger vos paramètres pour le moment."),
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadSettings();

    return () => {
      active = false;
    };
  }, [setTheme, updateUser]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileState((current) => ({ ...current, error: "", success: "" }));
    setProfileForm((current) => ({ ...current, [name]: value }));
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordState((current) => ({ ...current, error: "", success: "" }));
    setPasswordForm((current) => ({ ...current, [name]: value }));
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();

    setProfileState({ saving: true, error: "", success: "" });

    try {
      const payload = await updateMyProfile({
        nom: profileForm.nom.trim(),
        prenom: profileForm.prenom.trim(),
      });

      setSettings((current) => ({
        ...current,
        ...payload,
        preferences: mergePreferences(payload.preferences || current?.preferences),
      }));
      setProfileForm({ nom: payload.nom || "", prenom: payload.prenom || "" });
      updateUser((currentUser) => buildAuthUserPatch(payload, currentUser));
      setProfileState({
        saving: false,
        error: "",
        success: "Vos informations de profil ont été mises à jour.",
      });
    } catch (error) {
      setProfileState({
        saving: false,
        error: extractApiErrorMessage(error, "Impossible d’enregistrer votre profil."),
        success: "",
      });
    }
  };

  const handlePhotoSelection = (event) => {
    const file = event.target.files?.[0];
    setPhotoState({ uploading: false, error: "", success: "" });

    if (!file) return;

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setSelectedPhoto(null);
      setPreviewUrl("");
      setPhotoState({
        uploading: false,
        error: "Format invalide. Sélectionnez une image JPG, JPEG, PNG ou WEBP.",
        success: "",
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setSelectedPhoto(null);
      setPreviewUrl("");
      setPhotoState({
        uploading: false,
        error: "La photo sélectionnée dépasse 2 Mo.",
        success: "",
      });
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedPhoto(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleClearSelectedPhoto = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl("");
    setSelectedPhoto(null);
    setPhotoState((current) => ({ ...current, error: "", success: "" }));
  };

  const handlePhotoUpload = async () => {
    if (!selectedPhoto) return;

    setPhotoState({ uploading: true, error: "", success: "" });

    try {
      const response = await uploadProfilePhoto(selectedPhoto);
      const nextPhoto = response.photo_profil || "";

      setSettings((current) => ({ ...current, photo_profil: nextPhoto }));
      updateUser({ photo_profil: nextPhoto });
      handleClearSelectedPhoto();
      setPhotoState({
        uploading: false,
        error: "",
        success: "Votre photo de profil a été mise à jour.",
      });
    } catch (error) {
      setPhotoState({
        uploading: false,
        error: extractApiErrorMessage(error, "Impossible d’envoyer la photo de profil."),
        success: "",
      });
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    if (!passwordFormIsValid) return;

    setPasswordState({ submitting: true, error: "", success: "" });

    try {
      const response = await changePassword(passwordForm);
      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
      setPasswordState({
        submitting: false,
        error: "",
        success: response.message || "Le mot de passe a été modifié avec succès.",
      });
    } catch (error) {
      setPasswordState({
        submitting: false,
        error: extractApiErrorMessage(error, "Impossible de modifier le mot de passe."),
        success: "",
      });
    }
  };

  const handleThemeChange = (theme) => {
    setAppearanceState((current) => ({ ...current, error: "", success: "" }));
    setPreferencesForm((current) => ({ ...current, theme }));
    setTheme(theme);
  };

  const handleDensityChange = (density) => {
    setAppearanceState((current) => ({ ...current, error: "", success: "" }));
    setPreferencesForm((current) => ({ ...current, density }));
    applyDensityPreference(density);
  };

  const handleAppearanceSubmit = async () => {
    setAppearanceState({ saving: true, error: "", success: "" });

    try {
      const response = await updatePreferences({
        theme: preferencesForm.theme,
        density: preferencesForm.density,
        notifications: preferencesForm.notifications,
      });

      const normalizedPreferences = mergePreferences(response.preferences);
      setPreferencesForm(normalizedPreferences);
      setSettings((current) => ({ ...current, preferences: normalizedPreferences }));
      updateUser({ preferences: normalizedPreferences });
      setAppearanceState({
        saving: false,
        error: "",
        success: response.message || "Les préférences d’apparence ont été enregistrées.",
      });
    } catch (error) {
      setAppearanceState({
        saving: false,
        error: extractApiErrorMessage(error, "Impossible d’enregistrer l’apparence."),
        success: "",
      });
    }
  };

  const handleNotificationToggle = (key) => {
    setNotificationState((current) => ({ ...current, error: "", success: "" }));
    setPreferencesForm((current) => ({
      ...current,
      notifications: {
        ...current.notifications,
        [key]: !current.notifications[key],
      },
    }));
  };

  const handleNotificationsSubmit = async () => {
    setNotificationState({ saving: true, error: "", success: "" });

    try {
      const response = await updatePreferences({
        theme: preferencesForm.theme,
        density: preferencesForm.density,
        notifications: preferencesForm.notifications,
      });

      const normalizedPreferences = mergePreferences(response.preferences);
      setPreferencesForm(normalizedPreferences);
      setSettings((current) => ({ ...current, preferences: normalizedPreferences }));
      updateUser({ preferences: normalizedPreferences });
      setNotificationState({
        saving: false,
        error: "",
        success: response.message || "Les notifications ont été enregistrées.",
      });
    } catch (error) {
      setNotificationState({
        saving: false,
        error: extractApiErrorMessage(error, "Impossible d’enregistrer les notifications."),
        success: "",
      });
    }
  };

  return (
    <AppLayout pageTitle="Paramètres" userName={userName} userRole={userRole}>
      <div className="space-y-4 pb-2">
        <section className="rounded-[18px] border border-[#E9E1F8] bg-[radial-gradient(circle_at_top_left,rgba(107,33,217,0.1),transparent_34%),linear-gradient(180deg,#FFFFFF_0%,#FBF9FF_100%)] px-5 py-4 shadow-[0_16px_34px_rgba(60,16,120,0.05)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span className="inline-flex rounded-full border border-[#E9E1F8] bg-[#F3ECFF] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6B21D9]">
                Compte utilisateur
              </span>
              <h1 className="mt-3 text-[28px] font-semibold tracking-[-0.03em] text-slate-900">
                Paramètres
              </h1>
              <p className="mt-1 max-w-3xl text-[13px] leading-6 text-slate-500">
                Gérez votre profil, votre sécurité et vos préférences d’utilisation.
              </p>
              <span className="mt-3 block h-[2px] w-14 rounded-full bg-[#F4B740]" />
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[#F3ECFF] text-[#58148E] shadow-sm">
              <Settings2 className="h-6 w-6" />
            </div>
          </div>
        </section>

        {loading ? (
          <section className="flex min-h-[320px] items-center justify-center rounded-[18px] border border-[#E9E1F8] bg-white shadow-sm">
            <div className="flex items-center gap-3 text-[13px] text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-[#58148E]" />
              Chargement des paramètres...
            </div>
          </section>
        ) : loadError ? (
          <section className="rounded-[18px] border border-rose-200 bg-white px-5 py-4 shadow-sm">
            <div className="rounded-[14px] border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-600">
              {loadError}
            </div>
          </section>
        ) : (
          <div className="grid gap-4 xl:grid-cols-[360px,minmax(0,1fr)]">
            <div className="space-y-4">
              <ProfilePhotoUploader
                currentPhoto={settings?.photo_profil}
                previewUrl={previewUrl}
                fullName={userName}
                email={settings?.email || user?.email || ""}
                selectedFileName={selectedPhoto?.name || ""}
                uploading={photoState.uploading}
                error={photoState.error}
                success={photoState.success}
                onFileChange={handlePhotoSelection}
                onUpload={handlePhotoUpload}
                onClearSelection={handleClearSelectedPhoto}
              />

              <ProfileSettingsCard
                settings={settings}
                profileForm={profileForm}
                saving={profileState.saving}
                error={profileState.error}
                success={profileState.success}
                onChange={handleProfileChange}
                onSubmit={handleProfileSubmit}
              />
            </div>

            <div className="space-y-4">
              <PasswordSettingsCard
                passwordForm={passwordForm}
                submitting={passwordState.submitting}
                isValid={passwordFormIsValid}
                error={passwordState.error}
                success={passwordState.success}
                onChange={handlePasswordChange}
                onSubmit={handlePasswordSubmit}
              />

              <AppearanceSettingsCard
                preferences={preferencesForm}
                saving={appearanceState.saving}
                error={appearanceState.error}
                success={appearanceState.success}
                onThemeChange={handleThemeChange}
                onDensityChange={handleDensityChange}
                onSubmit={handleAppearanceSubmit}
              />

              <NotificationSettingsCard
                notifications={preferencesForm.notifications}
                saving={notificationState.saving}
                error={notificationState.error}
                success={notificationState.success}
                onToggle={handleNotificationToggle}
                onSubmit={handleNotificationsSubmit}
              />
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
