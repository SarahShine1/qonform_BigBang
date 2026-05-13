import React, { useState } from "react";
import logoQonforme from "../assets/logo.svg";

function DashboardIcon() {
  return (
    <svg className="w-[17px] h-[17px]" viewBox="0 0 24 24" fill="none">
      {/* Remplace ici par ton SVG Dashboard */}
      <rect x="3" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <rect x="13" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <rect x="3" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <rect x="13" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function TachesIcon() {
  return (
    <svg className="w-[17px] h-[17px]" viewBox="0 0 24 24" fill="none">
      {/* Remplace ici par ton SVG Tâches */}
      <path d="M8 6H21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 12H21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 18H21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M3.5 6L4.5 7L6.5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.5 12L4.5 13L6.5 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.5 18L4.5 19L6.5 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AuditsIcon() {
  return (
    <svg className="w-[17px] h-[17px]" viewBox="0 0 24 24" fill="none">
      {/* Remplace ici par ton SVG Mes audits */}
      <path d="M8 4H16L18 7V20H6V7L8 4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 11H15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9 15H14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function FichesIcon() {
  return (
    <svg className="w-[17px] h-[17px]" viewBox="0 0 24 24" fill="none">
      {/* Remplace ici par ton SVG Fiches processus */}
      <path d="M7 3H14L19 8V21H7V3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M14 3V8H19" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M10 13H16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10 17H14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function DocumentationIcon() {
  return (
    <svg className="w-[17px] h-[17px]" viewBox="0 0 24 24" fill="none">
      {/* Remplace ici par ton SVG Documentation */}
      <path d="M4 6H10L12 8H20V19H4V6Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowUpIcon() {
  return (
    <svg className="w-4 h-4 ml-auto" viewBox="0 0 24 24" fill="none">
      <path d="M7 14L12 9L17 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Navbar() {
  const [activeMain, setActiveMain] = useState("mesAudits");
  const [activeSub, setActiveSub] = useState("auditsClotures");

  const mainItemClass = (name) =>
    `w-full h-[37px] px-[14px] rounded-[7px] flex items-center gap-3 text-[13px] font-medium font-inherit cursor-pointer border-none transition
    ${
      activeMain === name
        ? "bg-[#641ab5] text-white"
        : "bg-transparent text-[#777783] hover:bg-[#eeeeef]"
    }`;

  const subItemClass = (name) =>
    `relative border-none bg-transparent p-0 text-left text-[12px] cursor-pointer
    ${
      activeSub === name
        ? "text-[#641ab5] font-semibold before:content-[''] before:w-[7px] before:h-[7px] before:bg-[#641ab5] before:rounded-full before:absolute before:left-[-18px] before:top-[5px]"
        : "text-[#7c7c87]"
    }`;

  return (
    <aside className="w-[200px] min-h-screen bg-[#f7f7f8] border-r border-[#eeeeee] px-[18px] py-6 shrink-0">
    <div className="flex items-center gap-[9px] mb-[42px] pl-[3px]">
    <img
        src={logoQonforme}
        alt="Qonforme logo"
        className="w-[27px] h-[27px] object-contain"
    />


        <h2 className="text-[17px] font-bold text-[#171717] m-0">
          Qonforme
        </h2>
      </div>

      <nav className="flex flex-col gap-2">
        <button
          type="button"
          className={mainItemClass("dashboard")}
          onClick={() => {
            setActiveMain("dashboard");
            setActiveSub("");
          }}
        >
          <DashboardIcon />
          <span>Dashboard</span>
        </button>

        <button
          type="button"
          className={mainItemClass("taches")}
          onClick={() => {
            setActiveMain("taches");
            setActiveSub("");
          }}
        >
          <TachesIcon />
          <span>Taches</span>
        </button>

        <div>
          <button
            type="button"
            className={mainItemClass("mesAudits")}
            onClick={() => setActiveMain("mesAudits")}
          >
            <AuditsIcon />
            <span>Mes audits</span>
            <ArrowUpIcon />
          </button>

          <div className="flex flex-col gap-[10px] mt-[13px] mb-[13px] pl-[30px]">
            <button
              type="button"
              className={subItemClass("auditsPlanifies")}
              onClick={() => {
                setActiveMain("mesAudits");
                setActiveSub("auditsPlanifies");
              }}
            >
              Audits planifiés
            </button>

            <button
              type="button"
              className={subItemClass("auditsClotures")}
              onClick={() => {
                setActiveMain("mesAudits");
                setActiveSub("auditsClotures");
              }}
            >
              Audits clôturés
            </button>
          </div>
        </div>

        <button
          type="button"
          className={mainItemClass("fichesProcessus")}
          onClick={() => {
            setActiveMain("fichesProcessus");
            setActiveSub("");
          }}
        >
          <FichesIcon />
          <span>Fiches processus</span>
        </button>

        <button
          type="button"
          className={mainItemClass("documentation")}
          onClick={() => {
            setActiveMain("documentation");
            setActiveSub("");
          }}
        >
          <DocumentationIcon />
          <span>Documentation</span>
        </button>
      </nav>
    </aside>
  );
}

export default Navbar;