import { useEffect, useMemo, useState } from "react";
import AppShell from "../components/AppShell";
import { createPremiumOrder, fetchPremiumPlans, fetchPremiumStatus, verifyPremiumPayment } from "../api/premiumApi";
import { useAuthStore } from "../store/authStore";
import "./PremiumPage.css";

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

const formatPrice = (amountPaise, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format((amountPaise || 0) / 100);

const getCatalog = ({ monthlyPlan, yearlyPlan, billingCycle, yearlySavingsLabel, currency }) => [
  {
    id: "starter",
    name: "Starter",
    description: "For focused solo learners building consistency.",
    priceLine: "Free",
    billingLine: "No card required",
    benefits: [
      "Structured topic and question tracking",
      "Sheet sharing and public profile basics",
      "Standard progress summaries",
      "Manual revision workflow",
      "Import/export support",
    ],
    ctaLabel: "Your current base plan",
    disabled: true,
    tag: "Always available",
    emphasis: "default",
  },
  {
    id: "pro",
    planId: monthlyPlan?.id,
    name: "Pro",
    description: "For interview prep with faster revision loops.",
    priceLine: monthlyPlan ? formatPrice(monthlyPlan.price, currency) : "Loading...",
    billingLine: monthlyPlan ? "Billed monthly" : "Live plan unavailable",
    benefits: [
      "Premium reminder and alarm workflows",
      "Learning Insights access",
      "Higher sheet scale limits",
      "Cleaner revision planning flow",
      "Faster premium support responses",
      "Everything in Starter",
    ],
    ctaLabel: "Start Pro",
    disabled: !monthlyPlan,
    tag: billingCycle === "monthly" ? "Selected" : null,
    emphasis: billingCycle === "monthly" ? "featured-lite" : "default",
  },
  {
    id: "growth",
    planId: yearlyPlan?.id,
    name: "Growth",
    description: "For high-output preparation with long-term momentum.",
    priceLine: yearlyPlan ? formatPrice(yearlyPlan.price, currency) : "Loading...",
    billingLine: yearlyPlan ? "Billed yearly" : "Live plan unavailable",
    note: yearlySavingsLabel,
    benefits: [
      "Everything in Pro",
      "Best per-month value on annual billing",
      "Long-range premium access continuity",
      "Priority review for support issues",
      "Advanced study workflow depth",
      "Early access to selected premium improvements",
    ],
    ctaLabel: "Choose Growth",
    disabled: !yearlyPlan,
    featured: true,
    badge: "Most Popular",
    tag: billingCycle === "yearly" ? "Selected" : null,
    emphasis: "featured",
  },
  {
    id: "elite",
    name: "Elite",
    description: "For power users and teams that need shared operations.",
    priceLine: "Coming soon",
    billingLine: "Planned roadmap tier",
    benefits: [
      "Shared team workspaces (planned)",
      "Role-based controls (planned)",
      "Centralized progress visibility (planned)",
      "Collaboration automation tools (planned)",
      "Dedicated success channel (planned)",
    ],
    ctaLabel: "Notify me",
    disabled: true,
    badge: "Planned",
    emphasis: "planned",
  },
];

function PremiumPage({ theme, onThemeChange }) {
  const currentUser = useAuthStore((state) => state.currentUser);
  const [busyPlan, setBusyPlan] = useState(null);
  const [message, setMessage] = useState("");
  const [plans, setPlans] = useState([]);
  const [currency, setCurrency] = useState("INR");
  const [billingCycle, setBillingCycle] = useState("yearly");

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const payload = await fetchPremiumPlans();
        setPlans(payload?.plans || []);
        if (payload?.currency) {
          setCurrency(payload.currency);
        }
      } catch {
        setMessage("Unable to load plans.");
      }
    };
    loadPlans();
  }, []);

  const monthlyPlan = useMemo(() => plans.find((plan) => plan.id === "monthly") || null, [plans]);
  const yearlyPlan = useMemo(() => plans.find((plan) => plan.id === "yearly") || null, [plans]);

  const yearlySavingsLabel = useMemo(() => {
    if (!monthlyPlan || !yearlyPlan || !monthlyPlan.price || !yearlyPlan.price) return null;
    const yearlyEquivalent = monthlyPlan.price * 12;
    const savings = Math.round(((yearlyEquivalent - yearlyPlan.price) / yearlyEquivalent) * 100);
    return savings > 0 ? `Save ${savings}% yearly` : null;
  }, [monthlyPlan, yearlyPlan]);

  const planCards = useMemo(
    () => getCatalog({ monthlyPlan, yearlyPlan, billingCycle, yearlySavingsLabel, currency }),
    [monthlyPlan, yearlyPlan, billingCycle, yearlySavingsLabel, currency]
  );

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
        const checkoutKey = import.meta.env.VITE_RAZORPAY_KEY_ID || order.keyId;
        if (!checkoutKey) {
          reject(new Error("Payment configuration is unavailable."));
          return;
        }
        const razorpay = new window.Razorpay({
          key: checkoutKey,
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
              const status = await fetchPremiumStatus(currentUser.token);
              const nextUser = { ...currentUser, ...verified, ...status, premiumActive: true };
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
      subtitle="Choose the plan that fits your growth and revision rhythm"
      theme={theme}
      onThemeChange={onThemeChange}
      userLabel={currentUser?.username || "Account"}
      contentClassName="premium-page"
    >
      <section className="premium-hero panel-elevated">
        <div className="premium-hero__glow" aria-hidden="true" />
        <p className="eyebrow">Premium access</p>
        <h2>Unlock deeper learning insights and high-focus workflows.</h2>
        <p className="premium-hero__subtitle">
          Scale your interview preparation with premium reminders, stronger analytics, cleaner revision loops, and dependable support.
        </p>
        <p className="premium-hero__trust">Trusted by ambitious learners building consistent preparation systems.</p>
      </section>

      <section className="premium-billing panel">
        <div>
          <p className="caption-text">Billing</p>
          <p className="meta-text">Switch context between monthly and annual value. Checkout supports Monthly and Growth plans.</p>
        </div>
        <div className="premium-billing__switch" role="tablist" aria-label="Billing cycle">
          <button
            type="button"
            role="tab"
            aria-selected={billingCycle === "monthly"}
            className={`premium-billing__tab ${billingCycle === "monthly" ? "is-active" : ""}`}
            onClick={() => setBillingCycle("monthly")}
          >
            Monthly
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={billingCycle === "yearly"}
            className={`premium-billing__tab ${billingCycle === "yearly" ? "is-active" : ""}`}
            onClick={() => setBillingCycle("yearly")}
          >
            Yearly
            {yearlySavingsLabel ? <span className="premium-billing__save">{yearlySavingsLabel}</span> : null}
          </button>
        </div>
      </section>

      <section className="premium-grid" aria-label="Premium plan options">
        {planCards.map((plan, index) => {
          const isPayable = Boolean(plan.planId);
          const isBusy = busyPlan === plan.planId;
          const ctaClassName = plan.featured ? "btn-base btn-primary premium-cta premium-cta--featured" : "btn-base btn-neutral premium-cta";
          return (
            <article
              key={plan.id}
              className={`premium-card premium-card--${plan.emphasis || "default"}`}
              style={{ "--card-stagger": `${index * 70}ms` }}
            >
              {plan.badge ? <span className="premium-card__badge">{plan.badge}</span> : null}
              <header className="premium-card__header">
                <h3>{plan.name}</h3>
                <p className="premium-card__description">{plan.description}</p>
              </header>

              <div className="premium-card__price-wrap">
                <p className="premium-card__price">{plan.priceLine}</p>
                <p className="premium-card__billing">{plan.billingLine}</p>
                {plan.note ? <p className="premium-card__note">{plan.note}</p> : null}
                {plan.tag ? <p className="premium-card__tag">{plan.tag}</p> : null}
              </div>

              <ul className="premium-card__features">
                {plan.benefits.map((benefit) => (
                  <li key={benefit}>
                    <span aria-hidden="true">✓</span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                className={ctaClassName}
                onClick={() => isPayable && buyPlan(plan.planId)}
                disabled={plan.disabled || isBusy}
              >
                {isBusy ? "Processing..." : plan.ctaLabel}
              </button>
            </article>
          );
        })}
      </section>

      <section className="premium-footnotes panel">
        <p>All paid upgrades are processed through secure Razorpay checkout and activate instantly after payment verification.</p>
        <p>Need billing help? Reach out from your profile support link and include your account email for quick handling.</p>
      </section>

      {plans.length === 0 ? <p className="meta-text">Loading plans...</p> : null}
      {message ? <p className="mt-2 text-sm text-[var(--text-secondary)]">{message}</p> : null}
    </AppShell>
  );
}

export default PremiumPage;
