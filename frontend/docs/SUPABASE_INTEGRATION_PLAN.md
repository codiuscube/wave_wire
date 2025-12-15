# ITSPUMPING.AI - Supabase Integration To-Do List

## Overview
Wire up all frontend pages to Supabase backend with phone-first authentication.

---

## Phase 0: Twilio Setup (Do This First)

### Create Twilio Account
1. Go to https://www.twilio.com/try-twilio
2. Sign up with email
3. Verify your own phone number

### Get Credentials
After signup, go to **Console Dashboard**:
- [ ] Copy **Account SID** (starts with `AC...`)
- [ ] Copy **Auth Token** (click to reveal)

### Get a Phone Number
1. Go to **Phone Numbers > Manage > Buy a Number**
2. Search for a number with **SMS capability**
3. Buy it (~$1.15/month for US numbers)
4. [ ] Copy your **Twilio Phone Number** (e.g., +1234567890)

### Configure in Supabase
1. Go to Supabase Dashboard > **Authentication > Providers**
2. Enable **Phone**
3. Select **Twilio** as provider
4. Enter:
   - Twilio Account SID
   - Twilio Auth Token
   - Twilio Message Service SID (or phone number)
5. Save

**Come back here once you have:**
- Twilio Account SID
- Twilio Auth Token
- Twilio Phone Number
- Phone auth enabled in Supabase

---

## Phase 1: Phone-First Authentication

### Status: ✅ Code Ready (Waiting for Twilio A2P Approval)

### 1.1 Supabase Configuration (Manual in Dashboard)
- [x] Enable Phone Auth provider in Supabase Auth settings
- [x] Configure Twilio SMS provider
- [x] Set SMS OTP expiry time (60 seconds)
- [ ] **BLOCKED:** Waiting for Twilio A2P 10DLC campaign approval

### 1.2 Auth Flow (Implemented)
**Files created:**
- `src/contexts/AuthContext.tsx` - Has phone OTP methods ready
- `src/components/auth/PhoneInput.tsx` - Phone number input with formatting
- `src/components/auth/OtpInput.tsx` - 6-digit OTP verification input
- `src/components/auth/ProtectedRoute.tsx` - Route protection

**Current state:** Using email/password until Twilio is approved

### 1.3 AuthContext Methods Available
```typescript
signInWithPhone(phone: string) // Send OTP
verifyOtp(phone: string, otp: string) // Verify & create session
updateEmail(email: string) // Add email after phone verification
signIn(email, password) // Email login (current)
signUp(email, password) // Email signup (current)
signOut() // Logout
```

---

## Phase 2: Dashboard Pages - Wire to Supabase

### 2.1 SpotPage.tsx - Surf Spots
**Current state:** Hardcoded spots, local state only
**Backend needs:**
- [ ] Fetch user's saved spots on load
- [ ] Save new spot (popular or custom)
- [ ] Delete spot
- [ ] Enforce free tier limit (1 spot)

**Supabase queries:**
```typescript
// Fetch spots
supabase.from('user_spots').select('*').eq('user_id', userId)

// Add spot
supabase.from('user_spots').insert({ user_id, name, lat, lon, buoy_id, region })

// Delete spot
supabase.from('user_spots').delete().eq('id', spotId)
```

### 2.2 TriggersPage.tsx - Alert Triggers
**Current state:** Hardcoded triggers, local state only
**Backend needs:**
- [ ] Fetch triggers for selected spot
- [ ] Create new trigger
- [ ] Update trigger settings
- [ ] Delete trigger
- [ ] Enforce free tier limit (1 trigger per spot)

**Supabase queries:**
```typescript
// Fetch triggers for spot
supabase.from('triggers').select('*').eq('spot_id', spotId)

// Create trigger
supabase.from('triggers').insert({ user_id, spot_id, name, emoji, condition, ... })

// Update trigger
supabase.from('triggers').update({ name, emoji, ... }).eq('id', triggerId)

// Delete trigger
supabase.from('triggers').delete().eq('id', triggerId)
```

### 2.3 AlertsPage.tsx - Alert Schedules
**Current state:** Hardcoded schedules, local state only
**Backend needs:**
- [ ] Fetch user's alert schedules (created on signup via DB trigger)
- [ ] Update schedule (time, enabled, days)
- [ ] Fetch/update quiet hours

**Supabase queries:**
```typescript
// Fetch schedules
supabase.from('alert_schedules').select('*').eq('user_id', userId)

// Update schedule
supabase.from('alert_schedules').update({ check_time, enabled, active_days }).eq('id', scheduleId)

// Fetch quiet hours
supabase.from('quiet_hours').select('*').eq('user_id', userId).single()

// Update quiet hours
supabase.from('quiet_hours').update({ enabled, start_time, end_time }).eq('user_id', userId)
```

### 2.4 PersonalityPage.tsx - AI Personality
**Current state:** Hardcoded personality, local state only
**Backend needs:**
- [ ] Fetch user preferences
- [ ] Update personality selection
- [ ] Update message options (emoji, buoy data, traffic)

**Supabase queries:**
```typescript
// Fetch preferences
supabase.from('user_preferences').select('*').eq('user_id', userId).single()

// Update preferences
supabase.from('user_preferences').update({
  ai_personality, include_emoji, include_buoy_data, include_traffic
}).eq('user_id', userId)
```

### 2.5 AccountPage.tsx - User Account
**Current state:** Hardcoded user data, mock verification states
**Backend needs:**
- [ ] Fetch user profile from `profiles` table
- [ ] Update phone number (with re-verification)
- [ ] Update email
- [ ] Update home address
- [ ] Display subscription tier
- [x] Logout functionality ✅

**Supabase queries:**
```typescript
// Fetch profile
supabase.from('profiles').select('*').eq('id', userId).single()

// Update profile
supabase.from('profiles').update({ phone, email, home_address }).eq('id', userId)
```

### 2.6 DashboardOverview.tsx - Dashboard Home
**Current state:** Hardcoded spots, alerts, conditions
**Backend needs:**
- [ ] Fetch user's spots with current status
- [ ] Fetch recent alerts from `sent_alerts`
- [ ] Calculate stats (alerts this week, etc.)

**Note:** Real-time buoy data will require external API integration (Phase 4)

---

## Phase 3: Shared Hooks & Utilities

### 3.1 Create Custom Hooks
- [ ] `src/hooks/useSpots.ts` - CRUD for user spots
- [ ] `src/hooks/useTriggers.ts` - CRUD for triggers
- [ ] `src/hooks/useAlertSchedules.ts` - Fetch/update schedules
- [ ] `src/hooks/useUserPreferences.ts` - Fetch/update preferences
- [ ] `src/hooks/useProfile.ts` - Fetch/update profile

### 3.2 Create Types
- [ ] Update `src/types/index.ts` with Supabase table types
- [ ] Generate types from Supabase schema (optional)

---

## Phase 4: Admin Features

### 4.1 Admin Authentication
**Current state:** localStorage toggle for development
**Backend needs:**
- [ ] Add `is_admin` column to profiles table
- [ ] Update AuthContext to fetch admin status from Supabase
- [ ] Remove localStorage fallback in production

**Supabase queries:**
```typescript
// Check admin status
const { data } = await supabase
  .from('profiles')
  .select('is_admin')
  .eq('id', userId)
  .single();
```

### 4.2 AdminSpotsPage.tsx - Spot Management
**Current state:** In-memory state, no persistence
**Backend needs:**
- [ ] Fetch all spots from `surf_spots` table
- [ ] Update spot details (name, lat, lon, region, country_group)
- [ ] Toggle verification status
- [ ] Add new spots (auto-verified for admin)

**Supabase queries:**
```typescript
// Fetch all spots
supabase.from('surf_spots').select('*').order('name')

// Update spot
supabase.from('surf_spots').update({
  name, lat, lon, region, country_group, verified, updated_at
}).eq('id', spotId)

// Toggle verified
supabase.from('surf_spots').update({
  verified: !currentVerified,
  verified_at: !currentVerified ? new Date().toISOString() : null,
  verified_by: !currentVerified ? userId : null
}).eq('id', spotId)

// Admin add spot (auto-verified)
supabase.from('surf_spots').insert({
  ...spotData,
  verified: true,
  source: 'official',
  verified_at: new Date().toISOString(),
  verified_by: userId
})
```

### 4.3 Surf Spots Database Migration
**Current state:** Spots stored in TypeScript file (1,225 spots)
**Backend needs:**
- [ ] Create `surf_spots` table in Supabase
- [ ] Seed table with data from `src/data/surfSpots.ts`
- [ ] Update AddSpotModal to query from Supabase
- [ ] Update LocationContext to query from Supabase

---

## Phase 5: External Integrations (Future)

### 4.1 NOAA Buoy Data
- [ ] Fetch real-time buoy conditions
- [ ] Cache in `current_conditions` table
- [ ] Display on DashboardOverview

### 4.2 SMS Alerts (Twilio)
- [ ] Send alerts via Twilio
- [ ] Track SMS usage for free tier limit
- [ ] Implement cooldown logic

### 4.3 AI Message Generation
- [ ] Integrate Claude Haiku for personality-based messages
- [ ] Generate alerts based on user's personality setting

---

## Implementation Order (Recommended)

1. **~~Phone Auth~~** - ⏸️ Paused (waiting for Twilio A2P approval)
   - [x] Supabase phone auth config
   - [x] PhoneInput + OtpInput components
   - [ ] Switch to phone-first flow when approved

2. **Account Page** - Users need to manage their profile
   - [ ] Wire profile fetch/update
   - [x] Add logout button ✅

3. **Spots Page** - Foundation for triggers
   - [ ] Wire spots CRUD
   - [ ] Enforce tier limits

4. **Triggers Page** - Depends on spots
   - [ ] Wire triggers CRUD
   - [ ] Link to spots

5. **Alerts Page** - Schedules already created by DB trigger
   - [ ] Wire schedule updates
   - [ ] Wire quiet hours

6. **Personality Page** - Preferences
   - [ ] Wire preferences

7. **Dashboard Overview** - Aggregates everything
   - [ ] Fetch spots + recent alerts
   - [ ] Real-time data (Phase 4)

---

## Database Schema

Schema file: `supabase/schema.sql`

### Tables
| Table | Purpose |
|-------|---------|
| `profiles` | User data (extends auth.users) |
| `user_spots` | Saved surf locations |
| `triggers` | Alert conditions per spot |
| `alert_schedules` | When to check conditions |
| `quiet_hours` | Do not disturb settings |
| `sent_alerts` | Alert history |
| `sms_usage` | SMS limit tracking |
| `user_preferences` | AI personality settings |

### Auto-created on Signup
The database trigger `handle_new_user()` automatically creates:
- Profile record
- Default preferences
- Default quiet hours
- 3 default alert schedules (Night Before, Morning, Pop-Up)

---

## Critical Files

| File | Status | Purpose |
|------|--------|---------|
| `src/lib/supabase.ts` | ✅ | Supabase client |
| `src/contexts/AuthContext.tsx` | ✅ | Auth state & methods |
| `src/components/auth/*` | ✅ | Auth components |
| `src/pages/LoginPage.tsx` | ✅ | Email login (phone ready) |
| `src/pages/SignupPage.tsx` | ✅ | Email signup |
| `supabase/schema.sql` | ✅ | Database schema |
| `src/pages/SpotPage.tsx` | ⏳ | Needs Supabase wiring |
| `src/pages/TriggersPage.tsx` | ⏳ | Needs Supabase wiring |
| `src/pages/AlertsPage.tsx` | ⏳ | Needs Supabase wiring |
| `src/pages/PersonalityPage.tsx` | ⏳ | Needs Supabase wiring |
| `src/pages/AccountPage.tsx` | ⏳ | Needs Supabase wiring |
| `src/pages/DashboardOverview.tsx` | ⏳ | Needs Supabase wiring |
