import AppShell from "../components/AppShell";

function HowToUsePage({ theme, onThemeChange }) {
  return (
    <AppShell title="How To Use" subtitle="Quick workflow guide" theme={theme} onThemeChange={onThemeChange}>
      <section className="panel rounded-3xl p-6">
        <ol className="list-decimal space-y-2 pl-5 text-[var(--text-secondary)]">
          <li>Login or sign up, then open your profile.</li>
          <li>Create a sheet and open it.</li>
          <li>Add topics/subtopics/questions and mark solved items.</li>
          <li>Use import/export for backups and sharing.</li>
          <li>Use public mode to share your progress with others.</li>
        </ol>
      </section>
    </AppShell>
  );
}

export default HowToUsePage;
