import { useState } from "react";
import AppShell from "../components/AppShell";
import { subscribePremiumPlan } from "../api/premiumApi";
import { useAuthStore } from "../store/authStore";

const plans = [
  { id: "monthly", name: "Monthly", price: "₹99" },
  { id: "yearly", name: "Yearly", price: "₹1,999" },
];

function PremiumPage({ theme, onThemeChange }) {
  const currentUser = useAuthStore((state) => state.currentUser);
  const [busyPlan, setBusyPlan] = useState(null);
  const [message, setMessage] = useState("");

  const buyPlan = async (planId) => {
    if (!currentUser?.token) return;
    setBusyPlan(planId);
    setMessage("");
    try {
      const result = await subscribePremiumPlan(currentUser.token, planId);
      const nextUser = { ...currentUser, ...result, premiumActive: true };
      window.localStorage.setItem("iqms-current-user", JSON.stringify(nextUser));
      useAuthStore.setState({ currentUser: nextUser });
      setMessage(`Premium activated until ${new Date(result.premiumUntil).toLocaleString()}.`);
    } catch (error) {
      setMessage(error.message || "Unable to activate premium.");
    } finally {
      setBusyPlan(null);
    }
  };

  return (
    <AppShell
      title="Premium Plans"
      subtitle="Unlock reminders, analytics, and advanced editing features"
      theme={theme}
      onThemeChange={onThemeChange}
      userLabel={currentUser?.username || "Account"}
    >
      <div className="grid gap-4 md:grid-cols-2">
        {plans.map((plan) => (
          <article key={plan.id} className="panel-elevated rounded-xl p-5">
            <h2 className="text-xl font-semibold">{plan.name}</h2>
            <p className="mt-2 text-3xl font-bold">{plan.price}</p>
            <button type="button" className="btn-primary mt-4 w-full py-2" onClick={() => buyPlan(plan.id)} disabled={busyPlan === plan.id}>
              {busyPlan === plan.id ? "Processing..." : "Buy Premium"}
            </button>
          </article>
        ))}
      </div>
      {message ? <p className="mt-4 text-sm text-[var(--text-secondary)]">{message}</p> : null}
    </AppShell>
  );
}

export default PremiumPage;
