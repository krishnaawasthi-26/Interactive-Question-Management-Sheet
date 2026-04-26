import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import SeoMeta from "../components/SeoMeta";
import SurfaceCard from "../components/ui/SurfaceCard";
import { ROUTES } from "../services/routes";

const featureGuides = [
  {
    name: "Home",
    route: ROUTES.HOME,
    access: "Public",
    steps: [
      "Open Home to see product highlights and entry points.",
      "Use the top actions to sign up, log in, or continue into your workspace.",
      "Review quick cards to understand what to do next.",
    ],
    samples: [
      { title: "Sample Screen 1", description: "Hero area with quick action buttons and platform summary." },
      { title: "Sample Screen 2", description: "Feature highlights section showing value and workflow." },
    ],
  },
  {
    name: "Login",
    route: ROUTES.LOGIN,
    access: "Public",
    steps: [
      "Enter your account credentials.",
      "Submit to authenticate and open your profile workspace.",
      "Use alternate sign-in option if enabled.",
    ],
    samples: [
      { title: "Sample Screen 1", description: "Email/password login form with validation hints." },
      { title: "Sample Screen 2", description: "Successful sign-in state redirecting to your profile." },
    ],
  },
  {
    name: "Sign Up",
    route: ROUTES.SIGNUP,
    access: "Public",
    steps: [
      "Fill required details to create your account.",
      "Complete verification flow (OTP/email if asked).",
      "Finish onboarding and continue to your profile.",
    ],
    samples: [
      { title: "Sample Screen 1", description: "Registration form with username, email, and password fields." },
      { title: "Sample Screen 2", description: "Verification step showing OTP prompt and resend action." },
    ],
  },
  {
    name: "Sheets Workspace",
    route: ROUTES.APP,
    access: "Protected",
    steps: [
      "Create a sheet for a topic or interview track.",
      "Add questions, tags, and solve status in the table.",
      "Use tabs and filters to manage large prep sets quickly.",
    ],
    samples: [
      { title: "Sample Screen 1", description: "Main sheet table with topic tags and solve indicators." },
      { title: "Sample Screen 2", description: "Question detail drawer with notes and attempt history." },
    ],
  },
  {
    name: "Import",
    route: ROUTES.IMPORT,
    access: "Protected",
    steps: [
      "Open Import from sheet actions.",
      "Upload supported JSON data file.",
      "Review parsed records and confirm merge/replace.",
    ],
    samples: [
      { title: "Sample Screen 1", description: "File upload panel with import format tips." },
      { title: "Sample Screen 2", description: "Preview table before final import confirmation." },
    ],
  },
  {
    name: "Export",
    route: ROUTES.EXPORT,
    access: "Protected",
    steps: [
      "Open Export from sheet actions.",
      "Choose what data to include.",
      "Generate and download your export file.",
    ],
    samples: [
      { title: "Sample Screen 1", description: "Export options panel for full or partial data." },
      { title: "Sample Screen 2", description: "Download confirmation with generated file name." },
    ],
  },
  {
    name: "Profile",
    route: ROUTES.PROFILE,
    access: "Protected",
    steps: [
      "Open your profile to view progress summary.",
      "Review your public profile link and personal stats.",
      "Jump to sheets and activity shortcuts.",
    ],
    samples: [
      { title: "Sample Screen 1", description: "Profile summary with streaks, counts, and status cards." },
      { title: "Sample Screen 2", description: "Public share block with copy-link action." },
    ],
  },
  {
    name: "Edit Profile",
    route: ROUTES.EDIT_PROFILE,
    access: "Protected",
    steps: [
      "Update username and personal details.",
      "Adjust profile visibility and preferences.",
      "Save and verify updates on profile page.",
    ],
    samples: [
      { title: "Sample Screen 1", description: "Editable profile form with live validation." },
      { title: "Sample Screen 2", description: "Success state after profile update." },
    ],
  },
  {
    name: "Learning Insights",
    route: ROUTES.LEARNING_INSIGHTS,
    access: "Protected • Premium",
    steps: [
      "Open insights dashboard to inspect progress trends.",
      "Review difficulty/topic distributions and weak areas.",
      "Use insights to plan next revision targets.",
    ],
    samples: [
      { title: "Sample Screen 1", description: "Trend widgets with solved counts over time." },
      { title: "Sample Screen 2", description: "Difficulty and topic distribution charts." },
    ],
  },
  {
    name: "Premium",
    route: ROUTES.PREMIUM,
    access: "Protected",
    steps: [
      "Review premium features and current access status.",
      "Select a plan and complete payment.",
      "Return to workspace with premium features unlocked.",
    ],
    samples: [
      { title: "Sample Screen 1", description: "Plan cards with pricing and included benefits." },
      { title: "Sample Screen 2", description: "Checkout initiation state with secure payment prompt." },
    ],
  },
  {
    name: "Public Sheets",
    route: ROUTES.PUBLIC_SHEETS,
    access: "Protected",
    steps: [
      "Browse sheets shared by other users.",
      "Search by topic and open a shared sheet.",
      "Copy useful sheet into your own workspace.",
    ],
    samples: [
      { title: "Sample Screen 1", description: "Discovery list of public sheets with metadata." },
      { title: "Sample Screen 2", description: "Detailed public sheet preview and copy action." },
    ],
  },
  {
    name: "Notifications Inbox",
    route: ROUTES.NOTIFICATIONS,
    access: "Protected",
    steps: [
      "Open Inbox to view all platform notifications.",
      "Filter unread or specific event types.",
      "Open an item and complete linked action.",
    ],
    samples: [
      { title: "Sample Screen 1", description: "Notification list with status chips and timestamps." },
      { title: "Sample Screen 2", description: "Expanded notification card with action buttons." },
    ],
  },
  {
    name: "Alerts",
    route: ROUTES.ALERTS,
    access: "Protected",
    steps: [
      "Open Alerts for important updates.",
      "Review sheet activity or collaboration alerts.",
      "Mark alerts read after handling.",
    ],
    samples: [
      { title: "Sample Screen 1", description: "Critical alerts grouped by category." },
      { title: "Sample Screen 2", description: "Alert details view with mark-as-read controls." },
    ],
  },
  {
    name: "Reminders (Alarms)",
    route: ROUTES.ALARMS,
    access: "Protected • Premium",
    steps: [
      "Create a reminder for topic revision.",
      "Set date/time, snooze options, and recurrence.",
      "Track and complete reminders from the center.",
    ],
    samples: [
      { title: "Sample Screen 1", description: "Alarm setup form with schedule and topic selectors." },
      { title: "Sample Screen 2", description: "Upcoming reminders list with quick snooze actions." },
    ],
  },
  {
    name: "How To Use",
    route: ROUTES.HOW_TO_USE,
    access: "Public",
    steps: [
      "Use this page as a full feature index.",
      "Click any feature card to jump to that page.",
      "Follow the listed steps and sample template notes.",
    ],
    samples: [
      { title: "Sample Screen 1", description: "Feature directory grouped with process guidance." },
      { title: "Sample Screen 2", description: "Template sample section for every feature." },
    ],
  },
  {
    name: "About",
    route: ROUTES.ABOUT,
    access: "Public",
    steps: [
      "Read project purpose and platform mission.",
      "Understand who the product is built for.",
      "Follow links for deeper context.",
    ],
    samples: [
      { title: "Sample Screen 1", description: "About overview with mission and benefits." },
      { title: "Sample Screen 2", description: "Team/product philosophy or roadmap highlights." },
    ],
  },
  {
    name: "Contact",
    route: ROUTES.CONTACT,
    access: "Public",
    steps: [
      "Open contact page to reach platform support.",
      "Fill your message details.",
      "Submit and track follow-up communication.",
    ],
    samples: [
      { title: "Sample Screen 1", description: "Contact form with subject and message fields." },
      { title: "Sample Screen 2", description: "Submission confirmation message and response expectation." },
    ],
  },
  {
    name: "Apply",
    route: "/apply",
    access: "Public",
    steps: [
      "Open Apply to submit your application form.",
      "Provide required details and supporting info.",
      "Submit application and wait for status updates.",
    ],
    samples: [
      { title: "Sample Screen 1", description: "Application form with candidate details sections." },
      { title: "Sample Screen 2", description: "Application submitted confirmation state." },
    ],
  },
];

function HowToUsePage({ theme, onThemeChange }) {
  const navigate = useNavigate();

  const stats = useMemo(() => ({
    total: featureGuides.length,
    protectedCount: featureGuides.filter((feature) => feature.access.includes("Protected")).length,
  }), []);

  return (
    <AppShell title="How To Use" subtitle="Complete feature directory with click-to-open pages and step-by-step process" theme={theme} onThemeChange={onThemeChange}>
      <SeoMeta
        title="How to Use Create Sheets | Complete feature guide"
        description="Browse every feature in Create Sheets, open each page directly, and follow step-by-step usage with sample screenshot templates and descriptions."
        path="/how-to-use"
      />

      <SurfaceCard
        title="All features in one place"
        description={`Total features: ${stats.total} • Protected features: ${stats.protectedCount}. Click any card to redirect to that page.`}
      >
        <div className="space-y-4">
          {featureGuides.map((feature, index) => (
            <article key={feature.name} className="surface-card surface-card-elevated space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="caption-text">Feature {index + 1}</p>
                  <h3 className="section-title text-base">{feature.name}</h3>
                  <p className="meta-text">Access: {feature.access}</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(feature.route)}
                  className="btn-secondary"
                  aria-label={`Open ${feature.name}`}
                >
                  Open page
                </button>
              </div>

              <div>
                <p className="caption-text mb-2">Process / Steps</p>
                <ol className="list-decimal pl-5 space-y-1 meta-text">
                  {feature.steps.map((step) => (
                    <li key={`${feature.name}-${step}`}>{step}</li>
                  ))}
                </ol>
              </div>

              <div>
                <p className="caption-text mb-2">Sample screenshot templates</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {feature.samples.map((sample) => (
                    <div key={`${feature.name}-${sample.title}`} className="rounded-xl border border-[var(--border-primary)] bg-[var(--surface-subtle)] p-3">
                      <p className="meta-text font-semibold">{sample.title}</p>
                      <p className="meta-text">{sample.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </SurfaceCard>
    </AppShell>
  );
}

export default HowToUsePage;
