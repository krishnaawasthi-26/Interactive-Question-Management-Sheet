import AppShell from "../components/AppShell";

function ContactPage({ theme, onThemeChange }) {
  return (
    <AppShell title="Contact Us" subtitle="Support and feedback" theme={theme} onThemeChange={onThemeChange}>
      <section className="panel rounded-3xl p-6">
        <p className="mb-2 text-[var(--text-secondary)]">For support or feedback, reach us at:</p>
        <p className="text-lg font-medium text-[var(--accent-primary)]">abc@gamil.com</p>
      </section>
    </AppShell>
  );
}

export default ContactPage;
