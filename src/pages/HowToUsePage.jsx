import SiteNav from "../components/SiteNav";

function HowToUsePage() {
  return (
    <div className="app-shell text-[var(--text-primary)]">
      <div className="app-content">
        <SiteNav />
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6">
          <h1 className="mb-4 text-3xl font-semibold">How To Use</h1>
          <ol className="list-decimal space-y-2 pl-5 text-zinc-200">
            <li>Login or sign up, then open your profile.</li>
            <li>Create a sheet and open it.</li>
            <li>Add topics/subtopics/questions and mark solved items.</li>
            <li>Use import/export for backups and sharing.</li>
            <li>Use public mode to share your progress with others.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default HowToUsePage;
