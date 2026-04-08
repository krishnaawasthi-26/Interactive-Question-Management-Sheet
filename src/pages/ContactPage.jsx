import SiteNav from "../components/SiteNav";

function ContactPage() {
  return (
    <div className="app-shell text-[var(--text-primary)]">
      <div className="app-content">
        <SiteNav />
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6">
          <h1 className="mb-4 text-3xl font-semibold">Contact Us</h1>
          <p className="mb-2 text-zinc-200">For support or feedback, reach us at:</p>
          <p className="text-lg font-medium text-amber-300">abc@gamil.com</p>
        </div>
      </div>
    </div>
  );
}

export default ContactPage;
