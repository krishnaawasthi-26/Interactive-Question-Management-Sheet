import { useEffect, useMemo, useState } from "react";
import { createApplicationOrder, fetchApplicationMeta, verifyApplicationPayment } from "../api/applicationApi";
import { razorpayKeyId } from "../config/envConfig";
import "./ApplyPage.css";

const DEFAULT_FIELDS = ["DSA", "Web Development", "App Development", "AI / ML", "Data Science", "Other"];
const GENDERS = ["Male", "Female", "Other", "Prefer not to say"];

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

const initialForm = {
  fullName: "",
  email: "",
  phoneNumber: "",
  whatsappNumber: "",
  gender: "",
  college: "",
  fieldApplyingFor: "",
};

const trimAllFields = (form) =>
  Object.fromEntries(Object.entries(form).map(([key, value]) => [key, typeof value === "string" ? value.trim() : value]));

const normalizeSpaces = (value) => value.trim().replace(/\s+/g, " ");

const isIndianMobile = (value) => {
  let digits = value.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits);
};

function ApplyPage() {
  const [fields, setFields] = useState(DEFAULT_FIELDS);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState("idle");
  const [processingStage, setProcessingStage] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    document.title = "Application Form";
  }, []);

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const payload = await fetchApplicationMeta();
        if (Array.isArray(payload?.fields) && payload.fields.length > 0) {
          setFields(payload.fields);
        }
      } catch {
        setFields(DEFAULT_FIELDS);
      }
    };

    loadMeta();
  }, []);

  const isProcessing = useMemo(() => processingStage.length > 0, [processingStage]);

  const validate = (input) => {
    const nextErrors = {};
    const sanitized = trimAllFields(input);

    Object.entries(sanitized).forEach(([key, value]) => {
      if (!value || !normalizeSpaces(value)) {
        nextErrors[key] = "This field is required.";
      }
    });

    if (sanitized.email && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(sanitized.email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (sanitized.phoneNumber && !isIndianMobile(sanitized.phoneNumber)) {
      nextErrors.phoneNumber = "Enter a valid Indian mobile number.";
    }

    if (sanitized.whatsappNumber && !isIndianMobile(sanitized.whatsappNumber)) {
      nextErrors.whatsappNumber = "Enter a valid Indian mobile number.";
    }

    return { sanitized, nextErrors };
  };

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isProcessing) return;

    setStatusMessage("");
    setStatusType("idle");

    const { sanitized, nextErrors } = validate(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setStatusType("error");
      setStatusMessage("Please fix the highlighted form fields.");
      return;
    }

    try {
      setProcessingStage("creating-order");
      await loadRazorpayCheckoutScript();
      const order = await createApplicationOrder(sanitized);

      await new Promise((resolve, reject) => {
        const checkoutKey = razorpayKeyId || order.keyId;
        if (!checkoutKey) {
          reject(new Error("Payment configuration is unavailable. Contact support."));
          return;
        }

        const razorpay = new window.Razorpay({
          key: checkoutKey,
          amount: order.amount,
          currency: order.currency,
          name: "IQMS Application",
          description: "Application registration fee",
          order_id: order.orderId,
          prefill: {
            name: sanitized.fullName,
            email: sanitized.email,
            contact: sanitized.phoneNumber,
          },
          theme: { color: "#4f46e5" },
          handler: async (paymentResponse) => {
            try {
              setProcessingStage("verifying-payment");
              const verified = await verifyApplicationPayment({
                paymentOrderId: paymentResponse.razorpay_order_id,
                paymentId: paymentResponse.razorpay_payment_id,
                paymentSignature: paymentResponse.razorpay_signature,
              });
              setResult(verified);
              setStatusType("success");
              setStatusMessage("Application submitted successfully.");
              resolve();
            } catch (verificationError) {
              reject(verificationError);
            }
          },
          modal: {
            ondismiss: () => reject(new Error("Payment was cancelled. Please try again.")),
          },
        });

        razorpay.open();
      });
    } catch (error) {
      setStatusType("error");
      setStatusMessage(error.message || "Unable to complete application.");
    } finally {
      setProcessingStage("");
    }
  };

  if (result) {
    return (
      <div className="apply-page">
        <div className="apply-page__container">
          <section className="apply-page__success">
            <h1 className="text-2xl font-semibold">Application submitted successfully</h1>
            <p className="meta-text mt-2">Your ₹49 registration payment was verified and your application is recorded.</p>
            <div className="mt-4 grid gap-2 text-sm">
              <p><strong>Applied field:</strong> {result.fieldApplyingFor}</p>
              <p><strong>Name:</strong> {result.fullName}</p>
              <p><strong>Email:</strong> {result.email}</p>
              <p><strong>Date/time:</strong> {new Date(result.updatedAt || result.createdAt).toLocaleString()}</p>
              <p><strong>Application ID:</strong> {result.applicationId}</p>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="apply-page">
      <div className="apply-page__container">
        <header className="apply-page__header">
          <h1 className="text-2xl font-semibold">Application Form</h1>
          <p className="meta-text mt-2">Fill in your details and pay ₹49 registration fee to submit your application.</p>
        </header>

        <form className="apply-page__form" onSubmit={handleSubmit} noValidate>
          <div className="apply-grid apply-grid--two">
            <div className="apply-field">
              <label htmlFor="fullName">Full Name</label>
              <input id="fullName" name="fullName" value={form.fullName} onChange={handleFieldChange} autoComplete="name" />
              {errors.fullName ? <span className="apply-error-text">{errors.fullName}</span> : <small>Enter your legal full name.</small>}
            </div>

            <div className="apply-field">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" value={form.email} onChange={handleFieldChange} autoComplete="email" />
              {errors.email ? <span className="apply-error-text">{errors.email}</span> : <small>Use an active email address.</small>}
            </div>

            <div className="apply-field">
              <label htmlFor="phoneNumber">Phone Number</label>
              <input id="phoneNumber" name="phoneNumber" value={form.phoneNumber} onChange={handleFieldChange} autoComplete="tel" />
              {errors.phoneNumber ? <span className="apply-error-text">{errors.phoneNumber}</span> : <small>Indian number, e.g. +91XXXXXXXXXX.</small>}
            </div>

            <div className="apply-field">
              <label htmlFor="whatsappNumber">WhatsApp Number</label>
              <input id="whatsappNumber" name="whatsappNumber" value={form.whatsappNumber} onChange={handleFieldChange} autoComplete="tel" />
              {errors.whatsappNumber ? <span className="apply-error-text">{errors.whatsappNumber}</span> : <small>Indian number linked to WhatsApp.</small>}
            </div>

            <div className="apply-field">
              <label htmlFor="gender">Gender</label>
              <select id="gender" name="gender" value={form.gender} onChange={handleFieldChange}>
                <option value="">Select gender</option>
                {GENDERS.map((gender) => <option key={gender} value={gender}>{gender}</option>)}
              </select>
              {errors.gender ? <span className="apply-error-text">{errors.gender}</span> : <small>Required for application records.</small>}
            </div>

            <div className="apply-field">
              <label htmlFor="fieldApplyingFor">Field Applying For</label>
              <select id="fieldApplyingFor" name="fieldApplyingFor" value={form.fieldApplyingFor} onChange={handleFieldChange}>
                <option value="">Select field</option>
                {fields.map((field) => <option key={field} value={field}>{field}</option>)}
              </select>
              {errors.fieldApplyingFor ? <span className="apply-error-text">{errors.fieldApplyingFor}</span> : <small>One field per submission.</small>}
            </div>
          </div>

          <div className="apply-grid mt-3">
            <div className="apply-field">
              <label htmlFor="college">College</label>
              <input id="college" name="college" value={form.college} onChange={handleFieldChange} autoComplete="organization" />
              {errors.college ? <span className="apply-error-text">{errors.college}</span> : <small>Enter current college/institution.</small>}
            </div>
          </div>

          {statusMessage ? (
            <div className={`apply-callout mt-4 ${statusType === "error" ? "apply-callout--error" : "apply-callout--success"}`}>
              {statusMessage}
            </div>
          ) : null}

          <button className="apply-cta mt-4" type="submit" disabled={isProcessing}>
            {processingStage === "creating-order"
              ? "Creating order..."
              : processingStage === "verifying-payment"
                ? "Verifying payment..."
                : "Proceed to Pay ₹49"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ApplyPage;
