/**
 * Form validation shared by the browser and the API routes. Plain TypeScript, so the
 * client bundle stays small; the server runs exactly the same rules.
 */
import { FREE_EMAIL_DOMAINS } from "./config";

export const TIMELINES = ["Within 2 weeks", "Within 1 month", "1 to 3 months", "More than 3 months", "Exploring options"] as const;

export type RequestInput = {
  company: string;
  email: string;
  role: string;
  parts: string;
  quantity: string;
  timeline: string;
  message: string;
  /** Honeypot. Real people never see or fill it. */
  website: string;
  /** Milliseconds since epoch when the form was first shown. */
  startedAt: number;
};

export type NotifyInput = { email: string; category: string; website: string; startedAt: number };

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function emailDomain(email: string) {
  return email.split("@")[1]?.toLowerCase().trim() ?? "";
}

export function validateRequest(v: RequestInput): FieldErrors<RequestInput> {
  const e: FieldErrors<RequestInput> = {};
  if (v.company.trim().length < 2) e.company = "Enter your company name.";
  if (!EMAIL.test(v.email.trim())) e.email = "Enter an email address, like name@company.com.";
  else if (FREE_EMAIL_DOMAINS.includes(emailDomain(v.email))) e.email = "Use your work email. We only quote to company addresses.";
  if (v.role.trim().length < 2) e.role = "Enter your role, for example procurement lead.";
  if (v.parts.trim().length < 3) e.parts = "Tell us which parts you need.";
  if (!/^\s*\d[\d,\s]*\s*$/.test(v.quantity) || Number(v.quantity.replace(/[^\d]/g, "")) < 1) e.quantity = "Enter a quantity, for example 200.";
  if (!(TIMELINES as readonly string[]).includes(v.timeline)) e.timeline = "Choose a timeline.";
  if (v.message.length > 4000) e.message = "Keep this under 4,000 characters.";
  if (v.parts.length > 8000) e.parts = "Keep this under 8,000 characters, or send the full BOM through the checker.";
  return e;
}

export function validateNotify(v: NotifyInput): FieldErrors<NotifyInput> {
  const e: FieldErrors<NotifyInput> = {};
  if (!EMAIL.test(v.email.trim())) e.email = "Enter an email address.";
  if (!v.category) e.category = "Missing category.";
  return e;
}

/** Bots fill hidden fields and submit within moments of page load. */
export function looksLikeSpam(v: { website: string; startedAt: number }, now = Date.now()) {
  return v.website.trim() !== "" || !Number.isFinite(v.startedAt) || now - v.startedAt < 2500;
}

export const ORIGIN_KNOWLEDGE = [
  "Yes, documented for every material",
  "Partly: we know some sub-suppliers",
  "No, not yet",
] as const;

export type SupplierInput = {
  company: string;
  email: string;
  city: string;
  role: string;
  /** TM codes or categories the maker can build. */
  parts: string;
  capacity: string;
  origin: string;
  certifications: string;
  message: string;
  website: string;
  startedAt: number;
};

export function validateSupplier(v: SupplierInput): FieldErrors<SupplierInput> {
  const e: FieldErrors<SupplierInput> = {};
  if (v.company.trim().length < 2) e.company = "Enter your company name.";
  if (!EMAIL.test(v.email.trim())) e.email = "Enter an email address, like name@company.com.";
  else if (FREE_EMAIL_DOMAINS.includes(emailDomain(v.email))) e.email = "Use your company email.";
  if (v.city.trim().length < 2) e.city = "Enter the city where the parts are made.";
  if (v.role.trim().length < 2) e.role = "Enter your role.";
  if (v.parts.trim().length < 3) e.parts = "List the TM codes or kinds of part you can build.";
  if (v.capacity.trim().length < 1) e.capacity = "Give a rough monthly capacity, for example 2,000 units.";
  if (!(ORIGIN_KNOWLEDGE as readonly string[]).includes(v.origin)) e.origin = "Choose one.";
  if (v.parts.length > 4000) e.parts = "Keep this under 4,000 characters.";
  if (v.message.length > 4000) e.message = "Keep this under 4,000 characters.";
  if (v.certifications.length > 1000) e.certifications = "Keep this under 1,000 characters.";
  return e;
}
