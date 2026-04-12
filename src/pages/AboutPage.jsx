import AppShell from "../components/AppShell";
import SurfaceCard from "../components/ui/SurfaceCard";

const featureBlocks = [
  {
    title: "Structured preparation",
    description: "Organize DSA and interview topics into sheets, subtopics, and question checkpoints.",
  },
  {
    title: "Progress-first workflow",
    description: "Track solved vs remaining questions and revisit weak areas with consistent history.",
  },
  {
    title: "Share and collaborate",
    description: "Publish selected sheets, keep private work private, and share profile-level progress.",
  },
];

function AboutPage({ theme, onThemeChange }) {
  return (
    <AppShell title="About Us" subtitle="Why Create Sheets exists and how it supports interview prep" theme={theme} onThemeChange={onThemeChange}>
      <div className="space-y-4">
        <SurfaceCard elevated title="Our Mission" description="Build a calm, reliable workspace for consistent interview preparation.">
          <p className="meta-text">
            Create Sheets is designed for structured practice workflows where users can maintain evolving sheets, monitor progress, and keep focus on long-term improvement.
          </p>
        </SurfaceCard>

        <SurfaceCard title="What the product helps with">
          <div className="grid gap-3 md:grid-cols-3">
            {featureBlocks.map((item) => (
              <article key={item.title} className="surface-card surface-card-elevated">
                <h3 className="card-title">{item.title}</h3>
                <p className="meta-text mt-1">{item.description}</p>
              </article>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard title="Workflow overview">
          <ol className="space-y-2 pl-5 text-sm text-[var(--text-secondary)] list-decimal">
            <li>Create or copy a sheet and organize topics.</li>
            <li>Track question completion over time and update priorities.</li>
            <li>Publish selected sheets while preserving private drafts.</li>
          </ol>
        </SurfaceCard>
      </div>
    </AppShell>
  );
}

export default AboutPage;
