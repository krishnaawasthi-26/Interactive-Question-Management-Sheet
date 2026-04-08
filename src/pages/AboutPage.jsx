import AppShell from "../components/AppShell";

function AboutPage({ theme, onThemeChange }) {
  return (
    <AppShell title="About Us" subtitle="Product overview and purpose" theme={theme} onThemeChange={onThemeChange}>
      <section className="panel rounded-3xl p-6">
        <p className="mb-3 text-[var(--text-secondary)]">
          IQMS helps you organize interview preparation sheets, track DSA progress, and keep your learning workflow structured.
        </p>
        <p className="text-[var(--text-secondary)]">
          Create sheets, manage topics and questions, share public progress pages, and import/export your work from one consistent workspace.
        </p>
      </section>
    </AppShell>
  );
}

export default AboutPage;
