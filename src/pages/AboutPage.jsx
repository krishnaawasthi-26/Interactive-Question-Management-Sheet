import SiteNav from "../components/SiteNav";

function AboutPage() {
  return (
    <div className="app-shell text-[var(--text-primary)]">
      <div className="app-content">
        <SiteNav />
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6">
          <h1 className="mb-4 text-3xl font-semibold">About Us</h1>
          <p className="mb-3 text-zinc-200">
            This app helps you organize interview prep sheets, track your DSA progress,
            and keep everything in one place.
          </p>
          <p className="text-zinc-300">
            You can create sheets, add topics/questions, share public profiles, and export/import
            your work whenever you need.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AboutPage;
