# HIPAA Compliance Transparency & Remediation Plan

Last updated: 2026-01-27
Owner: Engineering + Compliance
Scope: Mobile app (Expo), Vendor Portal (Next.js), Backend API (NestJS), Supabase (Postgres/Auth/Storage), Cloudinary, Mapbox, Vercel Analytics, Stripe, Gmail SMTP.

Disclaimer: This document is for transparency and implementation guidance. It is not legal advice.

---

## 1) Executive Summary

### HIPAA applicability (current assessment)
HIPAA likely applies if any clinical care is provided or if we operate as a Business Associate for covered entities. The product collects detailed hormone/sexual health and symptom data, which is PHI when combined with identifiers or when provided in a clinical context.

### High‑risk areas (top)
1) ePHI collection & storage (hormone logs, sexual health metrics, mood notes).
2) PHI/identifiers in logs (client + server).
3) Tokens stored in localStorage (web) and non‑HttpOnly cookies.
4) Analytics metadata may include PHI‑adjacent search terms.
5) Missing Row‑Level Security (RLS) policies for PHI tables.
6) Non‑HIPAA email transport (Gmail SMTP) for password reset.
7) Vendor BAAs not tracked/documented.

---

## 2) Data Types Considered PHI / ePHI

### Direct identifiers
- Email address, name, phone number, user IDs, IP address (even hashed), device identifiers.

### Health data
- Hormone levels (testosterone, estradiol), dose, form factor, mood notes, sexual health scores, sleep, stress, weight, vitality scores.

### PHI‑adjacent
- Search queries about clinics/hormones.
- Free‑text review comments that can contain medical details.

---

## 3) Current Data Flows (simplified)

Client (mobile)  
→ `/v1/hormone-logs` (API)  
→ `core.hormone_logs` (DB)

Client (mobile/vendor portal)  
→ Supabase Auth  
→ JWT validated in API  
→ `users`, `customer_profiles` (DB)

Client (mobile)  
→ `/v1/collect/events`  
→ `analytics.analytics_events` (DB)

Backend  
→ Cloudinary (media uploads)  
→ Mapbox (geocoding)

Vendor portal  
→ Vercel Analytics (page tracking)

---

## 4) Required HIPAA Safeguards (Gap Analysis + Action Plan)

### Administrative Safeguards
**Gaps**
- No formal risk analysis documented.
- No workforce training evidence.
- No incident response plan.
- No vendor/BAA inventory.

**Actions**
- Create HIPAA risk analysis (annually + after major changes).
- Establish written policies: access, minimum necessary, incident response, breach notification, retention.
- Maintain BAA inventory (Supabase, Cloudinary, Vercel, Mapbox, Stripe, email/SMS).
- Workforce training + attestation records.

### Technical Safeguards
**Gaps**
- PHI logged in client/server console.
- Tokens stored in localStorage and non‑HttpOnly cookies (web).
- Analytics may capture PHI‑adjacent metadata.
- No RLS for PHI tables in DB.
- No documented audit logs for PHI access.

**Actions**
- Remove PHI/identifier logging in production.
- Migrate web auth to HttpOnly Secure cookies.
- Disable analytics on PHI screens or strip sensitive metadata.
- Implement RLS for `core.hormone_logs`, `core.customer_profiles`, `users`.
- Add PHI access audit logs (who/what/when).
- Enforce TLS everywhere; block non‑HTTPS in production.

### Physical Safeguards
**Gaps**
- Not documented (assumed vendor‑managed).

**Actions**
- Verify physical security via vendor SOC2/HIPAA attestations.
- Document in vendor management records.

---

## 5) Vendor BAA Matrix (Initial)

Vendor | Purpose | Touches ePHI | BAA Needed | Status
---|---|---|---|---
Supabase | Auth + DB | Yes | Required | Not tracked
Cloudinary | Media storage | Maybe | Likely | Not tracked
Mapbox | Geocoding/Maps | Maybe | Maybe | Not tracked
Vercel | Hosting/Analytics | Maybe | Likely | Not tracked
Stripe | Billing | Maybe | Maybe | Not tracked
Gmail SMTP | Email | Yes (identifiers) | Required | Not tracked
Expo/EAS | Build/Updates | Maybe | Maybe | Not tracked

Action: create vendor inventory with BAA status and SOC2/HIPAA evidence.

---

## 6) Concrete Engineering Changes Needed

### A) Logging & Observability
1) Remove or guard client logs with PHI/identifier content.  
2) Remove server logs printing email/birth year/token data.  
3) Add structured logging with redaction for sensitive fields.  
4) Create audit log table for PHI access (read/write/delete).

Acceptance criteria:
- No PHI/identifiers in production logs.
- Audit logs capture: user ID, action, resource, timestamp, request ID.

### B) Authentication & Session Security (Web)
1) Replace localStorage token storage with HttpOnly, Secure cookies.  
2) Enforce SameSite=Strict/Lax appropriately and Secure in production.  
3) Shorten access token TTL; rotate refresh tokens.

Acceptance criteria:
- No tokens in localStorage.
- Cookies are HttpOnly + Secure.

### C) Database Access Controls
1) Add RLS for `core.hormone_logs`, `core.customer_profiles`, `users`.  
2) Restrict service role usage to server-only.  
3) Apply least‑privilege DB roles.

Acceptance criteria:
- RLS policies enforced and tested.
- No client access to service role.

### D) Analytics Hygiene
1) Disable analytics collection on PHI screens (T‑log, account, reset).  
2) Strip search query metadata from events.  
3) Evaluate Vercel Analytics configuration for PHI exposure.

Acceptance criteria:
- Analytics events contain no health data or identifiers.

### E) Email / Messaging
1) Replace Gmail SMTP with HIPAA‑eligible email provider (with BAA).  
2) Ensure reset links do not leak PHI (token-only).

Acceptance criteria:
- Email vendor provides BAA.
- Logs do not store recipients or tokens.

### F) Data Retention & Deletion
1) Define retention limits for hormone logs and analytics.  
2) Implement user deletion pipeline (including backups).

Acceptance criteria:
- Retention documented and enforced.
- Deletion verified end‑to‑end.

---

## 7) Prioritized Roadmap

### 0–7 days (Stop-the-bleeding)
- Remove PHI in logs (client + server).
- Disable analytics metadata that can include PHI.
- Create vendor inventory + begin BAA requests.

### 30 days
- Replace localStorage token storage (web).
- Implement RLS for PHI tables.
- Add audit log table + access logging.

### 60–90 days
- Full HIPAA program: risk analysis, policies, training, incident response.
- Vendor BAAs executed.
- Security monitoring + alerting.

---

## 8) Acceptance Checklist

- [ ] PHI never appears in logs.
- [ ] RLS policies enforced on all PHI tables.
- [ ] Tokens are not stored in localStorage.
- [ ] Analytics excludes PHI/identifiers.
- [ ] Vendor BAAs documented where required.
- [ ] Incident response plan exists and tested.
- [ ] Data retention policy documented and enforced.

---

## 9) Ownership & Accountability

Area | Owner
---|---
Logging & audit trails | Backend + DevOps
Client auth/session changes | Frontend
DB RLS & access control | Backend + DevOps
Vendor BAAs & policies | Legal/Compliance
Incident response & training | Security/Compliance

---

## 10) Next Steps

1) Approve this plan with Legal/Compliance.  
2) Convert this into tickets (each change above).  
3) Track BAA status across vendors.  
4) Run a HIPAA risk analysis and document results.  

