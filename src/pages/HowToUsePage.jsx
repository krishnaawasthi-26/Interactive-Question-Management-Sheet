import AppShell from "../components/AppShell";
import SeoMeta from "../components/SeoMeta";
import SurfaceCard from "../components/ui/SurfaceCard";

const steps = [
  "Sign up or login, then open your profile workspace.",
  "Create a sheet and group your prep by topics and questions.",
  "Mark solved items regularly and review progress indicators.",
  "Use import/export for backups and data portability.",
  "Enable public visibility only for sheets you want to share.",
];

function HowToUsePage({ theme, onThemeChange }) {
  return (
    <AppShell title="How To Use" subtitle="Guided onboarding for your question-sheet workflow" theme={theme} onThemeChange={onThemeChange}>
      <SeoMeta
        title="How to Use Create Sheets | Build a DSA Practice Sheet"
        description="Follow a step-by-step guide to create sheets, organize coding questions, track progress, and share public study sheets on Create Sheets."
        path="/how-to-use"
      />
      <SurfaceCard title="Get started in five steps" description="Follow this flow to set up and maintain an effective prep system.">
        <div className="space-y-3">
          {steps.map((step, index) => (
            <article key={step} className="surface-card surface-card-elevated flex items-start gap-3">
              <div className="empty-state-icon text-xs font-semibold">{index + 1}</div>
              <p className="meta-text leading-relaxed">{step}</p>
            </article>
          ))}
        </div>
      </SurfaceCard>
    </AppShell>
  );
}

export default HowToUsePage;
