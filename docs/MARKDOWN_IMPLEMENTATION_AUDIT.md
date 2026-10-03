# MetlholoAI Markdown Implementation Audit

This audit maps the supplied design-export markdowns to the current working routes.

## Design export 1

| Design frame / title | Implemented route | Current behavior |
|---|---|---|
| Onboarding / Detect. Protect. Grow. | `/(auth)/welcome` | Branded product entry with Sign In / Create Account |
| Login / Register | `/(auth)/sign-in`, `/(auth)/sign-up` | Firebase Authentication, email verification, password reset, web Google sign-in |
| Farm Profile / Tell us about your farm | `/(onboarding)/profile`, `/(onboarding)/farm-setup` | Role, activity, farm name, farm type, size, Botswana location, alerts, optional Drive |
| New Scan | `/(app)/(tabs)/scan` | Category → subject → model → image → prediction → report → saved diagnosis |
| Create Case Record | `/(app)/case/new` | Animal, crop or general farm case with severity, location, notes and photos |
| Cattle / animal detail | `/(app)/animal/[animalId]` | Animal identity, health data, vaccinations, case/health/feed/scan actions |
| New Treatment | `/(app)/treatment/new` | Linked case treatment, dosage, frequency, method, dates, follow-up, cost |
| Home | `/(app)/(tabs)/index` | Weather, farm metrics, disease-detection actions, alerts |
| Profile | `/(app)/(tabs)/profile` | Account settings and app preferences |
| Admin Console | `/(app)/admin` | ADMIN-gated truthful workspace metrics |
| Reports & Analytics | `/(app)/reports` | Overview/Crops/Livestock/Pests/Cases and six-month case trends |
| Alerts & Notifications | `/(app)/(tabs)/alerts` | Weather/task/health/Drive signals and guarded external-feed states |

## Design export 2

| Design frame / title | Implemented route | Current behavior |
|---|---|---|
| My Animals | `/(app)/(tabs)/animals` | Search, species filters, health states, add animal |
| Animal Details | `/(app)/animal/[animalId]` | Full animal record and workflow actions |
| Edit Animal | `/(app)/animal/[animalId]/edit` | Reusable animal form |
| Health Records | `/(app)/health-records` | Scheduled / overdue / done states |
| New Health Record | `/(app)/health-record/new` | Animal-linked health record creation |
| Add New Field | `/(app)/crop/new` | Crop field form |
| Edit Crop Details | `/(app)/crop/[cropId]/edit` | Crop field editor |
| Field Details | `/(app)/crop/[cropId]` | Field health, irrigation, soil, dates, case/scan actions |
| My Crops | `/(app)/crops` | Search, grouping and field summaries |
| Farm Tasks | `/(app)/tasks` | Priority, category, due date and completion |
| New Task | `/(app)/task/new` | Task creation |
| Market Prices | `/(app)/market-prices` | Explicit reference-data state until a verified live source is connected |
| Feeding Plans | `/(app)/feeding-plans` | Active animal feeding plans |
| New Feeding Plan | `/(app)/feeding-plan/new` | Animal-linked feeding plan creation |
| Farm Dashboard | `/(app)/(tabs)/farms` | Animals, fields, tasks, alerts, health summaries, cases and farm modules |

## Navigation contract

The active authenticated navigation follows the farm design export:

**Home → Farm → Scan → Animals → Profile**

Legacy placeholder routes are redirected or re-exported into the real product routes so deep links cannot silently open the old shell.

## Data contract

- Firebase: authentication
- AsyncStorage: user-owned working farm data
- Google Drive: optional user-owned JSON sync
- Open-Meteo: weather + Botswana geocoding
- AI inference services: environment-configured split model services
- Firestore: not used as the current farm-record database

## Deliberately truthful unavailable states

The following design concepts remain represented in the product but are not falsely marked live:

- real payment methods / card storage
- live Botswana market prices
- live disease-outbreak feed
- native Google Drive authorization
- native Google sign-in
- AI model services without configured deployed base URLs
- veterinary messaging provider

## Verification baseline

The current implementation is expected to maintain:

- strict TypeScript pass
- ESLint pass
- Jest pass
- Expo web export pass
- compiled `web-dist` branch publication

Native iOS/Android runtime verification remains the next implementation/testing phase.
