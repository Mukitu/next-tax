import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type AppLang = "en" | "bn";

type Dict = Record<string, { en: string; bn: string }>;

const dict: Dict = {
  "nav.home": { en: "Home", bn: "হোম" },
  "nav.guide": { en: "Guide", bn: "গাইড" },
  "nav.team": { en: "Team", bn: "টিম" },
  "nav.dashboard": { en: "Dashboard", bn: "ড্যাশবোর্ড" },
  "nav.tax": { en: "Tax Calculator", bn: "ট্যাক্স ক্যালকুলেটর" },
  "nav.trade": { en: "Import/Export", bn: "ইমপোর্ট/এক্সপোর্ট" },
  "nav.login": { en: "Login", bn: "লগইন" },
  "nav.logout": { en: "Logout", bn: "লগআউট" },

  "footer.rights": { en: "© 2026–2027 NEXT TAX. All rights reserved.", bn: "© ২০২৬–২০২৭ NEXT TAX. সর্বস্বত্ব সংরক্ষিত।" },
  "footer.madeby": { en: "Made by Nishat (Full Stack Software Developer)", bn: "তৈরি করেছেন নিশাত (ফুল স্ট্যাক সফটওয়্যার ডেভেলপার)" },

  "home.title": {
    en: "Government-grade tax calculation & management",
    bn: "সরকারি মানের ট্যাক্স ক্যালকুলেশন ও ম্যানেজমেন্ট",
  },
  "home.subtitle": {
    en: "Accurate slab calculation, secure history, and role-based officer workflows—built for reliability.",
    bn: "সঠিক স্ল্যাব ক্যালকুলেশন, নিরাপদ হিস্টরি এবং রোল-ভিত্তিক অফিসার ওয়ার্কফ্লো—বিশ্বস্ততার জন্য তৈরি।",
  },
  "home.cta.start": { en: "Get started", bn: "শুরু করুন" },
  "home.cta.guide": { en: "User guide", bn: "ইউজার গাইড" },
  "home.badge.secure": { en: "Secure by design", bn: "নিরাপদ ডিজাইন" },
  "home.badge.rls": { en: "Role-based access", bn: "রোল-ভিত্তিক এক্সেস" },
  "home.badge.audit": { en: "Audit-ready records", bn: "অডিট-রেডি রেকর্ড" },
  "home.feature.slabs": { en: "Progressive slab breakdown", bn: "প্রগ্রেসিভ স্ল্যাব ব্রেকডাউন" },
  "home.feature.history": { en: "Save & export history", bn: "হিস্টরি সংরক্ষণ ও এক্সপোর্ট" },
  "home.feature.officer": { en: "Officer toolkit", bn: "অফিসার টুলকিট" },
  "home.feature.slabs_desc": {
    en: "Instant, transparent per-slab tax totals.",
    bn: "তাৎক্ষণিক এবং প্রতিটি স্ল্যাব অনুযায়ী স্বচ্ছ হিসাব।",
  },
  "home.feature.history_desc": {
    en: "Your calculations stay available whenever needed.",
    bn: "আপনার হিসাবগুলো পরে যেকোনো সময় দেখা যাবে।",
  },
  "home.feature.officer_desc": {
    en: "Search citizens and review records (authorized roles).",
    bn: "নাগরিক খোঁজা ও রেকর্ড রিভিউ (অনুমোদিত রোল)।",
  },

  "auth.title": { en: "Secure Access", bn: "নিরাপদ অ্যাক্সেস" },
  "auth.subtitle": { en: "Login or create an account for secure tax management.", bn: "নিরাপদ ট্যাক্স ম্যানেজমেন্টের জন্য লগইন বা অ্যাকাউন্ট তৈরি করুন।" },
  "auth.login": { en: "Login", bn: "লগইন" },
  "auth.signup": { en: "Sign up", bn: "সাইন আপ" },
  "auth.email": { en: "Email", bn: "ইমেইল" },
  "auth.password": { en: "Password", bn: "পাসওয়ার্ড" },
  "auth.signin": { en: "Sign in", bn: "সাইন ইন" },
  "auth.signin_busy": { en: "Signing in...", bn: "লগইন হচ্ছে..." },
  "auth.create": { en: "Create account", bn: "অ্যাকাউন্ট তৈরি করুন" },
  "auth.create_busy": { en: "Creating account...", bn: "অ্যাকাউন্ট তৈরি হচ্ছে..." },
  "auth.citizen": { en: "Citizen", bn: "নাগরিক" },
  "auth.officer": { en: "Officer", bn: "অফিসার" },
  "auth.phone_opt": { en: "Phone (optional)", bn: "ফোন (ঐচ্ছিক)" },
  "auth.location": { en: "Location", bn: "ঠিকানা" },
  "auth.tin": { en: "TIN number", bn: "টিআইএন নম্বর" },
  "auth.officer_id": { en: "Officer ID", bn: "অফিসার আইডি" },
  "auth.office_type": { en: "Office Type (tax/customs)", bn: "অফিস টাইপ (tax/customs)" },
  "auth.office_location": { en: "Office Location", bn: "অফিস লোকেশন" },

  "dash.title": { en: "Dashboard", bn: "ড্যাশবোর্ড" },
  "dash.signedin": { en: "Signed in as", bn: "লগইন করা আছে" },
  "dash.loading": { en: "Preparing your workspace…", bn: "আপনার ওয়ার্কস্পেস প্রস্তুত করা হচ্ছে…" },
  "citizen.monthly": { en: "Monthly comparison (last 12)", bn: "মাসভিত্তিক তুলনা (শেষ ১২)" },
  "citizen.actions": { en: "Quick actions", bn: "কুইক অ্যাকশন" },
  "citizen.newcalc": { en: "New calculation", bn: "নতুন হিসাব" },
  "citizen.exportpdf": { en: "Export PDF", bn: "পিডিএফ এক্সপোর্ট" },
  "citizen.history": { en: "Tax history", bn: "ট্যাক্স হিস্টরি" },
  "citizen.nohistory": { en: "No history yet. Create your first calculation.", bn: "এখনো কোনো হিস্টরি নেই। প্রথম হিসাব তৈরি করুন।" },
  "citizen.pdf_hint": { en: "Exports your latest rows (up to 50) to a PDF report.", bn: "আপনার সর্বশেষ রো (সর্বোচ্চ ৫০) পিডিএফ রিপোর্ট হিসেবে এক্সপোর্ট করবে।" },
  "citizen.records": { en: "records", bn: "রেকর্ড" },

  "common.loading": { en: "Loading...", bn: "লোড হচ্ছে..." },
  "table.date": { en: "Date", bn: "তারিখ" },
  "table.income": { en: "Income", bn: "আয়" },
  "table.expense": { en: "Expense", bn: "ব্যয়" },
  "table.taxable": { en: "Taxable", bn: "ট্যাক্সেবল" },
  "table.tax": { en: "Tax", bn: "ট্যাক্স" },

  "officer.lookup": { en: "Citizen lookup", bn: "নাগরিক খোঁজ" },
  "officer.tin": { en: "Citizen TIN", bn: "নাগরিক টিআইএন" },
  "officer.search": { en: "Search", bn: "সার্চ" },
  "officer.hint": { en: "Search citizen records by TIN and review saved calculations.", bn: "টিআইএন দিয়ে নাগরিকের রেকর্ড খুঁজুন এবং সেভ করা হিসাব দেখুন।" },
  "officer.citizen": { en: "Citizen", bn: "নাগরিক" },
  "officer.location": { en: "Location", bn: "ঠিকানা" },
  "officer.records": { en: "Citizen tax records", bn: "নাগরিকের ট্যাক্স রেকর্ড" },
  "officer.tab_citizens": { en: "Citizens", bn: "নাগরিক" },
  "officer.requests": { en: "Requests", bn: "রিকোয়েস্ট" },
  "officer.req_search": { en: "Search by citizen id / year…", bn: "Citizen id / year দিয়ে সার্চ…" },
  "officer.req_empty": { en: "No pending requests.", bn: "কোনো pending রিকোয়েস্ট নেই।" },
  "officer.req_citizen": { en: "Citizen", bn: "নাগরিক" },
  "officer.req_note": { en: "Officer note", bn: "অফিসার নোট" },
  "officer.req_note_ph": { en: "Optional note…", bn: "ঐচ্ছিক নোট…" },
  "officer.req_action": { en: "Action", bn: "অ্যাকশন" },
  "officer.approve": { en: "Approve", bn: "অনুমোদন" },
  "officer.reject": { en: "Reject", bn: "বাতিল" },
  "officer.req_approved": { en: "Request approved", bn: "রিকোয়েস্ট অনুমোদিত" },
  "officer.req_rejected": { en: "Request rejected", bn: "রিকোয়েস্ট বাতিল" },
  "officer.audit": { en: "Audit log", bn: "অডিট লগ" },
  "officer.audit_search": { en: "Search logs…", bn: "লগ সার্চ…" },
  "officer.audit_empty": { en: "No logs yet.", bn: "এখনো কোনো লগ নেই।" },
  "officer.audit_type": { en: "Type", bn: "টাইপ" },
  "officer.audit_desc": { en: "Description", bn: "বিবরণ" },
  "officer.create_calc": { en: "Create calculation for this citizen", bn: "এই নাগরিকের জন্য হিসাব তৈরি" },
  "officer.total_income": { en: "Total income (BDT)", bn: "মোট আয় (BDT)" },
  "officer.total_expense": { en: "Total expense (BDT)", bn: "মোট ব্যয় (BDT)" },
  "officer.save_calc": { en: "Save calculation", bn: "হিসাব সেভ করুন" },
  "officer.create_calc_hint": {
    en: "This saves to the citizen's history and records officer_id for auditing.",
    bn: "এটা নাগরিকের হিস্টরিতে সেভ হবে এবং অডিটের জন্য officer_id রেকর্ড হবে।",
  },
  "officer.empty_search": { en: "Search a citizen by TIN to view records.", bn: "রেকর্ড দেখতে টিআইএন দিয়ে নাগরিক সার্চ করুন।" },
  "officer.empty_records": { en: "No saved calculations for this citizen.", bn: "এই নাগরিকের কোনো সেভ করা হিসাব নেই।" },
  "officer.none_found": { en: "No citizen found with that TIN", bn: "এই টিআইএনে কোনো নাগরিক পাওয়া যায়নি" },

  "tax.title": { en: "Tax Calculator", bn: "ট্যাক্স ক্যালকুলেটর" },
  "tax.subtitle": { en: "Enter income and expense to calculate taxable income and slab-based tax instantly.", bn: "ইনকাম ও এক্সপেন্স দিয়ে তাৎক্ষণিক ট্যাক্সেবল ইনকাম ও স্ল্যাব-ভিত্তিক ট্যাক্স হিসাব করুন।" },
  "tax.inputs": { en: "Inputs", bn: "ইনপুট" },
  "tax.income": { en: "Total income (BDT)", bn: "মোট আয় (BDT)" },
  "tax.expense": { en: "Total expense (BDT)", bn: "মোট ব্যয় (BDT)" },
  "tax.taxable": { en: "Taxable income", bn: "ট্যাক্সেবল ইনকাম" },
  "tax.calculated": { en: "Calculated tax", bn: "হিসাবকৃত ট্যাক্স" },
  "tax.save": { en: "Save to history", bn: "হিস্টরিতে সেভ করুন" },
  "tax.saving": { en: "Saving...", bn: "সেভ হচ্ছে..." },
  "tax.reset": { en: "Reset", bn: "রিসেট" },
  "tax.breakdown": { en: "Slab breakdown", bn: "স্ল্যাব ব্রেকডাউন" },
  "tax.note": { en: "Note: This calculator follows the progressive slab rules configured for NEXT TAX.", bn: "নোট: এই ক্যালকুলেটরটি NEXT TAX-এর প্রগ্রেসিভ স্ল্যাব রুল অনুসরণ করে।" },
  "tax.fiscal_year": { en: "Fiscal year", bn: "অর্থবছর" },
  "tax.select_year": { en: "Select year", bn: "অর্থবছর নির্বাচন করুন" },
  "tax.year_hint": { en: "Rules are loaded from the backend for the selected year.", bn: "নির্বাচিত অর্থবছরের রুল ব্যাকএন্ড থেকে লোড হবে।" },
  "tax.request_review": { en: "Request officer review", bn: "অফিসার রিভিউ রিকোয়েস্ট" },
  "tax.requesting": { en: "Requesting...", bn: "রিকোয়েস্ট হচ্ছে..." },
  "tax.request_sent": { en: "Review request sent", bn: "রিভিউ রিকোয়েস্ট পাঠানো হয়েছে" },

  "team.title": { en: "Team", bn: "টিম" },
  "team.subtitle": { en: "The people behind NEXT TAX.", bn: "NEXT TAX-এর পেছনের টিম।" },

  "guide.title": { en: "User Guide", bn: "ইউজার গাইড" },
  "guide.soon": { en: "Coming next: step-by-step guidance for citizen and officer workflows.", bn: "শিগগিরই: নাগরিক ও অফিসার ওয়ার্কফ্লোর ধাপে ধাপে গাইড।" },

  "404.title": { en: "Oops! Page not found", bn: "দুঃখিত! পেজটি পাওয়া যায়নি" },
  "404.back": { en: "Return to Home", bn: "হোমে ফিরুন" },
};

function detectInitialLang(): AppLang {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem("next_tax_lang") as AppLang | null;
  if (stored === "en" || stored === "bn") return stored;
  const n = navigator.language?.toLowerCase() ?? "en";
  return n.startsWith("bn") ? "bn" : "en";
}

type I18nContextValue = {
  lang: AppLang;
  setLang: (l: AppLang) => void;
  toggle: () => void;
  t: (key: keyof typeof dict) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<AppLang>(() => detectInitialLang());

  const setLang = (l: AppLang) => {
    setLangState(l);
    window.localStorage.setItem("next_tax_lang", l);
    document.documentElement.lang = l;
  };

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo<I18nContextValue>(
    () => ({
      lang,
      setLang,
      toggle: () => setLang(lang === "en" ? "bn" : "en"),
      t: (key) => dict[key]?.[lang] ?? String(key),
    }),
    [lang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  // Fail-safe: avoid blank screens if a route/component renders outside provider
  // (e.g., during edge cases in routing/hydration). Falls back to English.
  if (!ctx) {
    const fallbackLang: AppLang = "en";
    return {
      lang: fallbackLang,
      setLang: () => {
        // no-op
      },
      toggle: () => {
        // no-op
      },
      t: (key: keyof typeof dict) => dict[key]?.[fallbackLang] ?? String(key),
    };
  }
  return ctx;
}
