import AppShell from "../components/AppShell";
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
