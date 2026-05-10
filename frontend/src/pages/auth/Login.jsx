import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  Lock,
  Mail,
  ShieldCheck,
  Network,
  ScrollText,
  FolderKanban,
  BadgeCheck,
} from "lucide-react";
import { login as loginRequest } from "../../api/auth";
import { useAuth } from "../../hooks/useAuth";
import qonformeLogo from "../../assets/icons/qonforme-logo.svg";
import googleLogo from "../../assets/icons/google-logo.svg";

const showcaseItems = [
  {
    title: "Tableaux de bord",
    text: "Suivez vos indicateurs cles en temps reel.",
    icon: ShieldCheck,
  },
  {
    title: "Cartographie & Organigramme",
    text: "Structure claire des entites et responsabilites.",
    icon: Network,
  },
  {
    title: "Audits internes",
    text: "Planifiez, executez et suivez vos audits.",
    icon: ScrollText,
  },
  {
    title: "Gestion documentaire",
    text: "Centralisez et securisez vos documents qualite.",
    icon: FolderKanban,
  },
  {
    title: "Conformite ISO",
    text: "Preparez efficacement votre certification.",
    icon: BadgeCheck,
  },
];

function SlidePreview({ title }) {
  if (title === "Tableaux de bord") {
    return (
      <div className="rounded-[14px] bg-white p-3 shadow-[0_14px_30px_rgba(22,6,51,0.18)]">
        <div className="grid grid-cols-4 gap-2">
          <div className="h-11 rounded-[8px] bg-[#F6F0FF]" />
          <div className="h-11 rounded-[8px] bg-[#EFE6FF]" />
          <div className="h-11 rounded-[8px] bg-[#F6F0FF]" />
          <div className="h-11 rounded-[8px] bg-[#EFE6FF]" />
        </div>
        <div className="mt-3 grid grid-cols-[1.25fr_0.75fr] gap-2">
          <div className="relative h-24 rounded-[10px] bg-[#FBF8FF]">
            <div className="absolute inset-x-3 bottom-4 top-5 flex items-end gap-2">
              <span className="h-7 w-6 rounded-full bg-[#D9C2FF]" />
              <span className="h-11 w-6 rounded-full bg-[#C39BFF]" />
              <span className="h-14 w-6 rounded-full bg-[#A56BFF]" />
              <span className="h-10 w-6 rounded-full bg-[#D9C2FF]" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-[46px] rounded-[10px] bg-[#F6F0FF]" />
            <div className="h-[46px] rounded-[10px] bg-[#F6F0FF]" />
          </div>
        </div>
      </div>
    );
  }

  if (title === "Cartographie & Organigramme") {
    return (
      <div className="rounded-[14px] bg-white p-3 shadow-[0_14px_30px_rgba(22,6,51,0.18)]">
        <div className="flex items-center justify-center gap-3 py-2">
          <div className="h-10 w-20 rounded-[10px] bg-[#EFE6FF]" />
          <div className="h-px w-6 bg-[#B78CFF]" />
          <div className="h-10 w-20 rounded-[10px] bg-[#F6F0FF]" />
        </div>
        <div className="mt-4 flex items-start justify-center gap-5">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-16 rounded-[8px] bg-[#F6F0FF]" />
            <div className="h-8 w-16 rounded-[8px] bg-[#EFE6FF]" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-16 rounded-[8px] bg-[#EFE6FF]" />
            <div className="h-8 w-16 rounded-[8px] bg-[#F6F0FF]" />
          </div>
        </div>
        <div className="mt-4 h-20 rounded-[10px] bg-[#FBF8FF]" />
      </div>
    );
  }

  if (title === "Audits internes") {
    return (
      <div className="rounded-[14px] bg-white p-3 shadow-[0_14px_30px_rgba(22,6,51,0.18)]">
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-[10px] bg-[#FBF8FF] px-3 py-3">
            <span className="h-2.5 w-20 rounded-full bg-[#E2D2FF]" />
            <span className="rounded-full bg-[#FDE68A] px-2 py-1 text-[10px] text-[#7C5200]">Planifie</span>
          </div>
          <div className="flex items-center justify-between rounded-[10px] bg-[#FBF8FF] px-3 py-3">
            <span className="h-2.5 w-24 rounded-full bg-[#D7BCFF]" />
            <span className="rounded-full bg-[#FCD34D] px-2 py-1 text-[10px] text-[#7C5200]">En cours</span>
          </div>
          <div className="flex items-center justify-between rounded-[10px] bg-[#FBF8FF] px-3 py-3">
            <span className="h-2.5 w-16 rounded-full bg-[#E2D2FF]" />
            <span className="rounded-full bg-[#BBF7D0] px-2 py-1 text-[10px] text-[#166534]">Termine</span>
          </div>
        </div>
      </div>
    );
  }

  if (title === "Gestion documentaire") {
    return (
      <div className="rounded-[14px] bg-white p-3 shadow-[0_14px_30px_rgba(22,6,51,0.18)]">
        <div className="space-y-2.5">
          {["Procedure qualite.pdf", "Plan audit interne.docx", "Politique QHSE.pdf"].map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-[10px] bg-[#FBF8FF] px-3 py-3">
              <span className="h-8 w-8 rounded-[8px] bg-[#F6F0FF]" />
              <span className="text-xs text-slate-600">{item}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[14px] bg-white p-3 shadow-[0_14px_30px_rgba(22,6,51,0.18)]">
      <div className="grid grid-cols-2 gap-2">
        <div className="h-20 rounded-[10px] bg-[#FBF8FF]" />
        <div className="space-y-2">
          <div className="h-9 rounded-[10px] bg-[#F6F0FF]" />
          <div className="h-9 rounded-[10px] bg-[#EFE6FF]" />
        </div>
      </div>
      <div className="mt-3 h-16 rounded-[10px] bg-[#F6F0FF]" />
    </div>
  );
}

function ShowcaseSlide({ title, text, icon: Icon }) {
  return (
    <article className="flex h-[316px] w-[310px] flex-shrink-0 flex-col rounded-[18px] border border-white/10 bg-white/6 p-4 shadow-[0_18px_40px_rgba(18,4,45,0.16)] backdrop-blur-sm">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-[#7A2BC0]/55 text-[#F4B740]">
        <Icon className="h-5 w-5" />
      </div>

      <h3 className="m-0 text-[20px] font-semibold leading-tight text-[#F7F4FF]">{title}</h3>
      <p className="mt-1.5 text-[13px] leading-5 text-[rgba(247,244,255,0.78)]">{text}</p>

      <div className="mt-3 flex-1">
        <SlidePreview title={title} />
      </div>
    </article>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await loginRequest(email, password);
      login(data);
      const roles = (data.user?.roles || []).map((role) => String(role).trim().toUpperCase());
      const destination = roles.includes("AUDITEUR")
        ? "/auditeur/audit-execution/AUD-2026-001"
        : "/accueil";
      navigate(destination, { replace: true });
    } catch (requestError) {
      const detail = requestError?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Identifiants invalides.");
    } finally {
      setLoading(false);
    }
  };

  const marqueeItems = [...showcaseItems, ...showcaseItems];

  return (
    <div className="login-page h-screen min-h-screen max-h-screen w-screen overflow-hidden bg-[#FAFAFC]">
      <div className="grid h-full w-full grid-cols-1 overflow-hidden lg:grid-cols-[59fr_41fr]">
        <section className="login-left relative hidden h-screen overflow-hidden lg:block">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,#23074B_0%,#3A0B79_38%,#58148E_72%,#58148E_100%)]" />
          <div className="absolute inset-0 opacity-45">
            <div className="absolute -left-20 top-[-56px] h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(244,183,64,0.22),_transparent_62%)]" />
            <div className="absolute bottom-[-120px] right-[-90px] h-80 w-80 rounded-full bg-[radial-gradient(circle,_rgba(244,183,64,0.14),_transparent_66%)]" />
            <div className="absolute right-[8%] top-[10%] h-px w-[34%] rotate-[9deg] border-t border-dashed border-[#F4B740]/28" />
            <div className="absolute bottom-[10%] left-[12%] h-px w-[42%] rotate-[-7deg] border-t border-dashed border-[#F4B740]/24" />
          </div>

          <div className="relative z-10 flex h-full flex-col px-[clamp(32px,4vw,56px)] py-[clamp(22px,3.2vh,36px)]">
            <div className="flex-shrink-0 pt-2 text-center">
              <h1 className="m-0 text-[clamp(34px,3.7vw,48px)] font-semibold leading-[1.05] text-[#F7F4FF]">
                Bienvenue sur <span className="text-[#F4B740]">Qonform</span>
              </h1>
              <p className="mx-auto mt-2.5 max-w-[620px] text-[clamp(16px,1.2vw,20px)] text-[rgba(247,244,255,0.78)]">
                De l&apos;aide a la preparation de la certification ISO
              </p>
              <div className="mx-auto mt-4 h-[2px] w-16 bg-[#F4B740]" />
            </div>

            <div className="flex min-h-0 flex-1 items-center overflow-hidden py-4">
              <div className="w-full overflow-hidden">
                <div className="login-showcase-track flex min-w-max items-center gap-4 px-[7%]">
                  {marqueeItems.map((item, index) => (
                    <ShowcaseSlide
                      key={`${item.title}-${index}`}
                      title={item.title}
                      text={item.text}
                      icon={item.icon}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 pb-1 text-center">
              <div className="mx-auto flex w-fit items-center gap-2.5">
                <span className="h-1.5 w-8 rounded-full bg-white/25" />
                <span className="h-1.5 w-8 rounded-full bg-[#F4B740]" />
                <span className="h-1.5 w-8 rounded-full bg-[#F4B740]" />
                <span className="h-1.5 w-8 rounded-full bg-white/25" />
                <span className="h-1.5 w-8 rounded-full bg-white/25" />
              </div>
            </div>
          </div>
        </section>

        <section className="login-right flex h-screen items-center justify-center overflow-hidden bg-[#FAFAFC] px-5 py-3 sm:px-8">
          <div className="w-full max-w-[410px] rounded-[20px] border border-[#EEE8F7] bg-white px-7 py-10 shadow-[0_18px_38px_rgba(88,20,142,0.08)] sm:px-8 sm:py-10">
            
            
            <h2 className="m-3 text-center text-[clamp(22px,1.55vw,28px)] font-semibold tracking-[-0.03em] text-slate-900">
              Bienvenue sur Qonform
            </h2>


            <div className="mt-4 flex items-center justify-center gap-3">
              <img src={qonformeLogo} alt="Qonforme" className="h-8 w-8" />
              <span className="text-[23px] font-medium tracking-[-0.04em] text-slate-900">Qonforme</span>
            </div>

            <button
              type="button"
              className="mt-6 flex h-[46px] w-full items-center justify-center gap-3 rounded-md border border-[#E8E0F3] bg-white px-4 text-[13px] font-medium text-slate-700 shadow-sm transition hover:border-[#DCCFEF] hover:bg-[#FCFBFF]"
            >
              <img src={googleLogo} alt="Google" className="h-4.5 w-4.5" />
              Se connecter avec Google
            </button>

            <div className="my-3.5 flex items-center gap-4 text-[13px] text-slate-400">
              <span className="h-px flex-1 bg-[#E7E1F2]" />
              <span>OU</span>
              <span className="h-px flex-1 bg-[#E7E1F2]" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <label className="block">
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-[46px] w-full rounded-md border border-[#E7E1F2] bg-white pl-12 pr-4 text-[13px] text-slate-900 outline-none transition focus:border-[#58148E] focus:ring-2 focus:ring-[#E9DDFE]"
                    placeholder="Adresse e-mail"
                    required
                  />
                </div>
              </label>

              <label className="block">
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-[46px] w-full rounded-md border border-[#E7E1F2] bg-white pl-12 pr-12 text-[13px] text-slate-900 outline-none transition focus:border-[#58148E] focus:ring-2 focus:ring-[#E9DDFE]"
                    placeholder="Mot de passe"
                    required
                  />
                  <Eye className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                </div>
              </label>

              <div className="   flex items-center justify-between gap-3 text-[12px] leading-none">
                <label className="mt-4 mb-4 flex items-center gap-2 whitespace-nowrap text-slate-600">
                  <input type="checkbox" className="h-4 w-4 rounded-[3px] border-[#D7CCEF]" />
                  Se souvenir de moi
                </label>
                <span className=" mt-4 mb-4 whitespace-nowrap text-[#58148E]">Mot de passe oublie ?</span>
              </div>

              {error ? (
                <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-[48px] w-full items-center justify-center gap-2 rounded-md bg-[#58148E] px-4 text-[14px] font-medium text-white transition hover:bg-[#4B14A8] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Connexion..." : "Se connecter"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
