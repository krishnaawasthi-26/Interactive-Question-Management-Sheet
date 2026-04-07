import SiteNav from "../components/SiteNav";

function ContactPage() {
  return (
    <div className="min-h-screen bg-zinc-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-4xl">
        <SiteNav />
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
          <h1 className="mb-4 text-3xl font-semibold">Contact Us</h1>
          <p className="mb-2 text-zinc-200">For support or feedback, reach us at:</p>
          <p className="text-lg font-medium text-amber-300">abc@gamil.com</p>
        </div>
      </div>
    </div>
  );
}

export default ContactPage;
