import AppShell from "../components/AppShell";
import SeoMeta from "../components/SeoMeta";

function ContactPage({ theme, onThemeChange }) {
  return (
    <AppShell title="Contact Us" subtitle="Support and feedback" theme={theme} onThemeChange={onThemeChange}>
      <SeoMeta
        title="Contact Create Sheets | Support"
        description="Contact the Create Sheets team for help with your sheet tracker, public sharing, and account support."
        path="/contact"
      />
      <section className="panel rounded-3xl p-6">
        <p className="mb-2 text-[var(--text-secondary)]">For support or feedback, reach us at:</p>
        <p className="text-lg font-medium text-[var(--accent-primary)]">abc@gamil.com</p>
      </section>
    </AppShell>
  );
}

export default ContactPage;
