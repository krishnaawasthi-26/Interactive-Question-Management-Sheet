import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import { createPremiumOrder, fetchPremiumPlans, verifyPremiumPayment } from "../api/premiumApi";
import { useAuthStore } from "../store/authStore";

const loadRazorpayCheckoutScript = () =>
  new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Payment checkout works only in browser."));
      return;
    }

    if (window.Razorpay) {
      resolve();
      return;
    }

    const existing = document.querySelector('script[data-razorpay="checkout"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Unable to load Razorpay checkout.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.dataset.razorpay = "checkout";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load Razorpay checkout."));
    document.body.appendChild(script);
  });

function PremiumPage({ theme, onThemeChange }) {
  const currentUser = useAuthStore((state) => state.currentUser);
  const [busyPlan, setBusyPlan] = useState(null);
  const [message, setMessage] = useState("");
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const payload = await fetchPremiumPlans();
        setPlans(payload?.plans || []);
      } catch {
        setMessage("Unable to load plans.");
      }
    };
    loadPlans();
  }, []);

  const buyPlan = async (planId) => {
    if (!currentUser?.token) return;
    setBusyPlan(planId);
    setMessage("");
    try {
      const selectedPlan = plans.find((plan) => plan.id === planId);
      if (!selectedPlan) {
        throw new Error("Invalid premium plan selected.");
      }

      await loadRazorpayCheckoutScript();
      const order = await createPremiumOrder(currentUser.token, planId);

      await new Promise((resolve, reject) => {
        const razorpay = new window.Razorpay({
          key: order.razorpayKeyId,
          amount: order.amount,
          currency: order.currency,
          name: "Create Sheets Premium",
          description: `${selectedPlan.name} premium plan`,
          order_id: order.orderId,
          prefill: {
            name: currentUser.name || currentUser.username || "",
            email: currentUser.email || "",
          },
          theme: {
            color: "#4f46e5",
          },
          handler: async (paymentResponse) => {
            try {
              const verified = await verifyPremiumPayment(currentUser.token, {
                plan: planId,
                razorpayOrderId: paymentResponse.razorpay_order_id,
                razorpayPaymentId: paymentResponse.razorpay_payment_id,
                razorpaySignature: paymentResponse.razorpay_signature,
              });

              const nextUser = { ...currentUser, ...verified, premiumActive: true };
              window.localStorage.setItem("iqms-current-user", JSON.stringify(nextUser));
              useAuthStore.setState({ currentUser: nextUser });
              setMessage(`Premium activated until ${new Date(verified.premiumUntil).toLocaleString()}.`);
              resolve();
            } catch (verificationError) {
              reject(verificationError);
            }
          },
          modal: {
            ondismiss: () => reject(new Error("Payment was cancelled.")),
          },
        });

        razorpay.open();
      });
    } catch (error) {
      setMessage(error.message || "Unable to activate premium.");
    } finally {
      setBusyPlan(null);
    }
  };

  return (
    <AppShell
      title="Premium Plans"
      subtitle="Unlock advanced analytics, AI, collaboration, and classroom growth"
      theme={theme}
      onThemeChange={onThemeChange}
      userLabel={currentUser?.username || "Account"}
    >
      {plans.length === 0 ? <p className="text-sm text-[var(--text-secondary)]">Loading plans...</p> : null}
      <div className="grid gap-4 md:grid-cols-2">
        {plans.map((plan) => (
          <article key={plan.id} className="panel-elevated rounded-xl p-5">
            <h2 className="text-xl font-semibold">{plan.name}</h2>
            <p className="mt-2 text-3xl font-bold">₹{((plan.price || 0) / 100).toFixed(2)}</p>
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
