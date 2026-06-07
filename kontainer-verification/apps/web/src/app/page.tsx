import { Reveal } from "../components/Reveal";
import type { CSSProperties } from "react";

const workflowCards = [
  {
    label: "Inspector",
    title: "Capture field evidence",
    text: "Create draft inspections, collect the four required angles, and prepare OCR review before submission.",
    tone: "blue"
  },
  {
    label: "Admin",
    title: "Verify pending records",
    text: "Review photos, metadata, serial confirmation, and comments before approving or requesting clarification.",
    tone: "yellow"
  },
  {
    label: "Auditor",
    title: "Search defensible archives",
    text: "Filter inspection history by container, date, status, inspector, and location for export-ready evidence.",
    tone: "green"
  }
] as const;

const controls = [
  "RBAC required",
  "Audit logs required",
  "Private object storage",
  "Async OCR and CV"
];

const queueItems = [
  "database schema",
  "auth + RBAC",
  "user management",
  "inspection session CRUD",
  "photo upload",
  "object storage"
];

export default function HomePage() {
  return (
    <main className="pageShell">
      <header className="topBar" aria-label="Application header">
        <a className="brand" href="/">
          <span className="brandMark" aria-hidden="true" />
          Kontainer Verification
        </a>
        <nav className="navLinks" aria-label="Primary">
          <a href="#workflows">Workflows</a>
          <a href="#queue">Queue</a>
          <a href="#controls">Controls</a>
        </nav>
      </header>

      <section className="heroSection">
        <Reveal className="heroCopy">
          <p className="eyebrow">Inspection workspace scaffold</p>
          <h1>Container evidence, verified without losing the audit trail.</h1>
          <p className="lede">
            A quiet operational interface for inspectors, admins, and auditors. The first
            frontend pass establishes the product shell, visual system, and workflow map.
          </p>
          <div className="heroActions" aria-label="Primary actions">
            <a className="primaryButton" href="#queue">View build queue</a>
            <a className="secondaryButton" href="#workflows">Review roles</a>
          </div>
        </Reveal>

        <Reveal className="inspectionWindow" index={1}>
          <div className="windowChrome" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="windowBody">
            <div className="photoFrame">
              <img
                src="https://picsum.photos/seed/container-yard-evidence/1200/800"
                alt="Desaturated container yard inspection reference"
              />
            </div>
            <div className="inspectionMeta">
              <span className="statusTag tagBlue">Draft</span>
              <h2>ABCD1234567</h2>
              <p>Depot Surabaya. Required angles pending validation.</p>
              <div className="angleGrid" aria-label="Photo checklist">
                <span>Front</span>
                <span>Back</span>
                <span>Left</span>
                <span>Right</span>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="sectionBlock" id="workflows">
        <Reveal>
          <div className="sectionHeader">
            <p className="eyebrow">Role surfaces</p>
            <h2>Three work modes, one evidence model.</h2>
          </div>
        </Reveal>
        <div className="bentoGrid">
          {workflowCards.map((card, index) => (
            <Reveal className={`bentoCard ${index === 0 ? "wideCard" : ""}`} index={index} key={card.label}>
              <span className={`statusTag tag${card.tone[0].toUpperCase()}${card.tone.slice(1)}`}>
                {card.label}
              </span>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="splitSection" id="queue">
        <Reveal className="sectionHeader compact">
          <p className="eyebrow">Current queue</p>
          <h2>Build order stays visible.</h2>
          <p>
            The frontend should not outrun authentication, RBAC, audit logging, upload
            validation, or async processing.
          </p>
        </Reveal>
        <Reveal className="queuePanel" index={1}>
          {queueItems.map((item, index) => (
            <div className="queueRow" key={item}>
              <kbd>{String(index + 1).padStart(2, "0")}</kbd>
              <span>{item}</span>
            </div>
          ))}
        </Reveal>
      </section>

      <section className="sectionBlock" id="controls">
        <Reveal>
          <div className="controlStrip">
            {controls.map((control, index) => (
              <span className="controlItem" key={control} style={{ "--index": index } as CSSProperties}>
                {control}
              </span>
            ))}
          </div>
        </Reveal>
      </section>
    </main>
  );
}
