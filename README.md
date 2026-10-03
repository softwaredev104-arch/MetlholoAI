# MetlholoAI

**Developer:** Bokang Jobe  
**Repository:** https://github.com/softwaredev104-arch/MetlholoAI

MetlholoAI is an agricultural intelligence and farm operations application for Botswana. It is built with Expo + React Native for mobile and responsive web, using the supplied MetlholoAI design markdowns as the product/UI specification.

## Current version

**0.1.0 — working markdown-driven product implementation**

The repository is no longer only an authentication/navigation foundation. The current app includes the main farmer workflows represented in the design exports and binds them to real local/Google Drive-backed state where the architecture supports it.

## Implemented product areas

### Authentication and onboarding
- Welcome / Get Started
- Email + password registration and sign-in
- Google sign-in on the current web implementation
- Email verification
- Password reset
- Role and primary-activity onboarding
- Farm setup
- Farm type and size
- Botswana location search
- Notification preferences
- Optional Google Drive connection
- Protected authenticated routes

Google Drive is **not required** to complete onboarding. Mobile users can continue with local state and connect a Drive adapter later.

### Main navigation
The authenticated five-destination product navigation follows the supplied farm design:

**Home → Farm → Scan → Animals → Profile**

The center Scan action remains visually prominent.

### Home
- Signed-in user greeting
- Active farm and location
- Current weather from saved farm coordinates
- Humidity, wind and rain probability
- Farm record counts
- Disease Detection shortcuts
- Crop, pest, livestock, treatment, market and report entry points
- Action/alert summary

### Farm Dashboard
- Animals
- Fields
- Pending tasks
- Farm alerts
- Livestock health summary
- Field health summary
- Priority tasks
- Open case records
- Farm workspace modules
- Farm profile / weather mapping state

### Animals
- Search and species filters
- Animal health status
- Add animal
- Edit animal
- Animal details
- Tag / breed / age / weight / gender / purpose
- Vaccinations and checkup information
- Link an animal to:
  - case records
  - health records
  - feeding plans
  - AI scan workflow

### Crops
- Search and crop grouping
- Add crop field
- Edit crop field
- Field details
- Crop type / variety
- hectares
- plot/location
- growth stage
- field health
- irrigation
- soil
- planting / harvest / inspection dates
- Link a crop to:
  - case records
  - AI scan workflow

### Health Records
- Scheduled / overdue / completed states
- Vaccination
- Treatment
- Checkup
- Surgery
- Animal linking
- dates / due dates
- vet or officer
- cost

### Case Records
- Animal, crop or general farm cases
- Disease/problem
- Severity
- District / village / location
- Notes
- Photo attachments
- Open / monitoring / resolved state
- Linked treatment records

### Treatments
- Linked case record
- Animal or crop subject
- Treatment name
- Dosage
- Frequency
- Method
- Start and end dates
- Follow-up flag
- Vet-notification preference
- Cost
- Notes

The application records a vet-notification preference but does not claim to send a veterinary message until a real messaging provider is connected.

### Farm Tasks
- Categories
- priorities
- due dates
- related farm object
- completion state
- progress summary

### Feeding Plans
- Link to registered animal
- feed type
- amount
- frequency
- supplement
- daily cost
- notes

### AI Scan and Diagnosis
- Crops and Livestock model categories
- Soil and Pest product categories represented without fabricating unavailable model services
- subject/model selection
- capture guidance
- camera / image library
- multipart prediction request
- report generation request
- saved diagnosis history
- confidence
- diagnosis-reference bridge

AI service base URLs are environment-configured. MetlholoAI does not guess production model server URLs.

### Reports & Analytics
- Overview
- Crops
- Livestock
- Pests
- Cases
- diagnosis counts
- average confidence
- farm record coverage
- top findings
- six-month case trend view
- real record-derived distributions

### Market Prices
The design flow is implemented, but the current values are explicitly marked as **reference data**. They are not presented as live Botswana prices until a verified market source is connected.

### Alerts
- farm tasks
- health follow-ups
- current weather
- Drive-session state
- notification categories

No disease outbreak is fabricated. Live outbreak alerts remain inactive until a verified veterinary/public-health feed is connected.

### Profile and Settings
The design's Account Settings and App Preferences are now working routes:

- Personal Information
  - name
  - sign-in email display
  - phone number
- My Farms
  - multiple registered farms
  - edit farm
  - add farm
  - set primary farm
- Payment Methods
  - truthful unconfigured state until a payment provider is connected
- Notifications
- Language
  - English (SADC) currently verified
- Privacy & Security
  - Firebase authentication state
  - password reset
  - Google Drive connect/disconnect
  - data-boundary explanation
- Sign out
- Admin console for ADMIN accounts

## Data architecture

### Firebase
Firebase is currently used for **Authentication**.

The active farm/product data path does **not** use Firestore as the farm-record database.

### Local state
User-owned farm records are stored locally with AsyncStorage:
- profile
- farms
- animals
- crops
- health records
- tasks
- feeding plans
- case records
- treatments
- saved diagnoses
- marketplace records

### Google Drive
When the user grants Google Drive permission, MetlholoAI synchronizes user-owned JSON files to the user's own Drive.

Current web integration uses Google Identity Services with the `drive.file` scope.

Native Drive authorization still needs a native provider adapter. Because of this, Drive is optional during onboarding and the app remains usable with local storage.

## External services

### Weather
Current weather uses Open-Meteo with saved farm latitude/longitude.

### Location search
Farm location search uses Open-Meteo geocoding restricted to Botswana.

### Agricultural intelligence
Configure the deployed model services with:

```env
EXPO_PUBLIC_AI_MAIZE_BASE_URL=
EXPO_PUBLIC_AI_CATTLE_BASE_URL=
EXPO_PUBLIC_AI_MAIZE_BEE_BASE_URL=
EXPO_PUBLIC_AI_GRAPE_BASE_URL=
EXPO_PUBLIC_AI_TOMATO_BASE_URL=
EXPO_PUBLIC_AI_SPINACH_BASE_URL=
EXPO_PUBLIC_AI_PEPPER_BASE_URL=
EXPO_PUBLIC_AI_POTATOES_BASE_URL=
EXPO_PUBLIC_AI_POULTRY_BASE_URL=
```

Without a configured base URL, that model service is treated as unavailable rather than returning fake results.

## Setup

Expo SDK 57 / React Native 0.86 expects a current Node 22 environment.

```bash
npm install --legacy-peer-deps
cp .env.example .env
npm run typecheck
npm run lint
npm run test:ci
npm run web
```

Add the Firebase public client configuration to `.env`. Configure Google Drive and intelligence service URLs only for the integrations you are actually enabling.

## Verification status

Verified in GitHub Actions on the current implementation:

- TypeScript strict compilation: **PASS**
- ESLint: **PASS**
- Jest test suite: **PASS**
- Expo web export: **PASS**
- Compiled `web-dist` branch publication: **PASS**

Not yet claimed as verified:

- iOS physical device build/runtime
- Android physical device build/runtime
- native Google sign-in
- native Google Drive authorization
- every deployed AI model endpoint against production
- verified live Botswana market-price provider
- verified disease-outbreak provider
- payment processing

## Deployment flow

The web build workflow:

1. installs dependencies
2. runs Expo compatibility repair
3. exports the responsive web app
4. uploads the build artifact
5. publishes the compiled app to the `web-dist` branch

The existing Cloudflare Worker preview can serve the compiled `web-dist` branch. Direct Cloudflare Pages deployment is intentionally not part of the required CI path until account-scoped Cloudflare deployment secrets are configured.

## Product integrity rules

MetlholoAI must not:
- invent disease outbreaks
- present design-reference prices as live market data
- claim a model endpoint is working when its service URL is not configured
- pretend a vet notification was sent when no provider is connected
- silently move user-owned farm records back into Firestore
- block mobile onboarding because Drive authorization is web-only

These rules are enforced in the current UI by explicit unavailable/reference states.

## Next runtime phase

The codebase is now ready for runtime/device verification rather than another broad UI rewrite:

1. first-user registration and onboarding on responsive web
2. farm creation/edit/primary-farm switching
3. Animals → Case → Treatment workflow
4. Crops → Case / Scan workflow
5. Health / Tasks / Feeding persistence
6. weather and location mapping
7. Google Drive web sync
8. configured AI endpoint-by-endpoint prediction tests
9. iOS/Android native builds and device testing
10. Cloudflare preview smoke test after each compiled `web-dist` publish
