# DVide — Real-Time Shared Expense & Bill Splitting PWA

## Product Vision

Build **DVide**, a mobile-first, installable Progressive Web App (PWA) for groups to collaboratively track expenses, split bills, calculate tax, chat in real time, and continuously see how much each person has paid, owes, or should receive.

DVide should feel like a polished mobile application even though it is a web app. Users should be able to open it in a browser and use the browser's **Add to Home Screen / Install App** functionality to save it as an app on phones, tablets, and desktops.

The core experience is:

1. Create a group/room.
2. Invite people through a shareable link or room code.
3. Everyone joins the same room.
4. Add expenses in real time.
5. Choose who paid.
6. Choose who should share the expense.
7. Automatically calculate tax and additional charges.
8. Continuously calculate each person's paid amount, share, and net balance.
9. Show optimized settlement suggestions.
10. Allow the group to chat in real time.
11. Persist expenses and chats in Supabase.
12. Keep the interface fast, responsive, and app-like on mobile.

---

# 1. Recommended Technology Stack

Use the following stack unless a strong technical reason requires a change.

## Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Lucide React
- React Router
- TanStack Query
- React Hook Form
- Zod

## Backend / Infrastructure

- Supabase
  - PostgreSQL database
  - Supabase Auth
  - Supabase Realtime
  - Row Level Security (RLS)

## Real-Time

Use **Supabase Realtime**, not a custom WebSocket server.

Use:
- Database changes / Realtime subscriptions for persisted expense and chat updates.
- Broadcast for transient room events where appropriate.
- Presence for online-member status.

Do not build a separate Node.js WebSocket server unless a future requirement genuinely needs one.

## PWA

- vite-plugin-pwa
- Web App Manifest
- Service Worker
- Workbox-based caching where appropriate

The application must be installable and usable like a native app from supported browsers.

## Hosting

- Vercel for deployment
- Supabase for backend/database/auth/realtime

---

# 2. Product Name

Primary project name:

**DVide**

Brand meaning:

**DVide = Divide expenses + decide who owes what**

Use a clean, modern wordmark:

> DVide

Suggested tagline:

> Split expenses. Stay even.

Alternative tagline:

> Spend together. Settle simply.

Do not over-brand the interface. Keep it clean, modern, minimal, and trustworthy.

---

# 3. Core Design Principles

The app should feel:

- Mobile-first
- Fast
- Clean
- Modern
- Minimal
- Friendly
- Financially trustworthy
- Easy to understand at a glance

Avoid making it feel like accounting software.

The average user should be able to create an expense in only a few taps.

Prefer:

- large touch targets
- bottom navigation on mobile
- sheets/modals for quick actions
- cards with clear totals
- clear typography
- subtle animations
- responsive layouts
- excellent empty states
- obvious primary actions

Use accessible contrast and keyboard-friendly interactions on desktop.

---

# 4. Main User Flow

## First Visit

Landing screen:

- DVide logo
- Short tagline
- "Create a Room"
- "Join a Room"
- Sign in / continue with supported auth method

The home page should immediately communicate that DVide is for group expense sharing.

---

# 5. Authentication

Use Supabase Auth.

Support at minimum:

- Email/password or magic-link authentication
- Google OAuth if practical

After login, users should have a profile.

Profile fields:

```text
id
name
avatar_url
created_at
updated_at
```

Do not use user-editable JWT metadata for authorization logic.

---

# 6. Rooms / Groups

The central concept is a **Room**.

Examples:

- Goa Trip
- College Trip
- Flat Expenses
- Weekend Dinner
- Road Trip
- Family Vacation

Each room should have:

```text
id
name
created_by
invite_code
currency
created_at
updated_at
```

## Joining a Room

Users can join with:

- shareable invite link
- short room code

Example:

```text
DVide Room Code

G7K2P
```

A room link could look like:

```text
https://dvide.app/join/G7K2P
```

When the user opens the link:

- Show room name
- Show member count
- Ask them to join
- Authenticate if required
- Add them to the room

---

# 7. Room Members

Each room has members.

Data model:

```text
room_members

id
room_id
user_id
display_name
joined_at
```

A member should be able to:

- see room expenses
- see room totals
- see settlement information
- participate in room chat
- add expenses
- edit/delete their own expenses where allowed

Room owners/admins may additionally:

- rename room
- change room settings
- remove members
- manage room-level configuration

---

# 8. Room Dashboard

After entering a room, show a clear summary.

Example:

```text
Goa Trip

Total spent
₹12,450

Your balance
+₹2,667

You paid
₹4,000

Your share
₹1,333
```

Then show:

- recent expenses
- members
- settlement summary
- chat activity
- add expense button

On mobile, use a sticky bottom action or floating action button for:

**+ Add Expense**

---

# 9. Expense Model

Each expense should support:

```text
id
room_id
created_by
description
category
subtotal
tax_rate
tax_amount
service_charge
tip
discount
total_amount
currency
paid_by_user_id
split_method
created_at
updated_at
```

Categories may include:

- Food
- Transport
- Hotel
- Shopping
- Entertainment
- Tickets
- Groceries
- Other

Allow users to define a category if desired.

---

# 10. Add Expense UX

The Add Expense flow should be extremely simple.

Suggested form:

```text
What was it?
Dinner

Amount
₹2,400

Paid by
Krish

Split between
Krish
Rahul
Aman
Riya

Tax
18%

Tax split
Proportional

Split method
Equal
```

Optional:

- service charge
- tip
- discount
- notes
- receipt image

The total must update live while the user edits the form.

Example:

```text
Subtotal        ₹2,400
Tax (18%)         ₹432
Service charge     ₹0
Tip                ₹0
Discount           ₹0
---------------------
Total            ₹2,832
```

---

# 11. Split Methods

Support these split methods.

## Equal Split

Example:

```text
₹2,400 / 4 = ₹600 each
```

## Percentage Split

Example:

```text
Krish   40%
Rahul   30%
Aman    20%
Riya    10%
```

## Exact Amount Split

Example:

```text
Krish   ₹1,000
Rahul     ₹600
Aman      ₹500
Riya      ₹300
```

## Shares-Based Split

Example:

```text
Krish   2 shares
Rahul   1 share
Aman    1 share
```

The UI should prevent invalid totals.

For percentages, total must equal 100%.

For exact amounts, the total must equal the expense amount being split.

For shares, all shares must be positive numbers.

---

# 12. Tax Divider

Tax is a key feature of DVide.

Users should be able to toggle tax on/off.

Tax fields:

```text
Tax type
Tax rate
Tax amount
Tax split method
```

Support:

### Equal Tax Split

Tax divided equally among participants.

### Proportional Tax Split

Tax distributed according to each person's expense share.

### Custom Tax Split

User manually assigns tax amounts.

The UI should make it obvious whether tax is:

- included in entered amount
- added on top of entered amount

Support both modes:

```text
Tax included
```

and

```text
Tax added
```

---

# 13. Additional Charges

Support optional:

- Service charge
- Tip
- Discount
- Other charges

Calculation order should be deterministic and documented in the code.

Suggested default:

```text
subtotal
- discount
+ tax
+ service charge
+ tip
= total
```

The implementation must centralize monetary calculations in one reusable utility/module.

Never duplicate financial formulas across UI components.

---

# 14. Personal Expense Calculations

For every member calculate at least:

### Amount Paid

The amount the member actually paid.

### Amount Owed

The total share assigned to that member across all room expenses.

### Net Balance

```text
net_balance = amount_paid - amount_owed
```

Interpretation:

```text
Positive = person should receive money
Negative = person owes money
Zero = person is settled
```

Example:

```text
Krish

Paid:  ₹4,000
Owed:  ₹1,333
Net:   +₹2,667
```

Rahul:

```text
Paid:  ₹0
Owed:  ₹1,333
Net:   -₹1,333
```

---

# 15. Group Summary

The room should show:

```text
Total expenses
Total tax
Total service charges
Total tips
Total discounts
Number of expenses
Number of members
```

Also show:

```text
Total paid
Total owed
```

For a valid room, the aggregate amount paid should reconcile with the aggregate allocated amount after rounding rules.

---

# 16. Settlement Suggestions

Create a settlement engine that calculates who should pay whom.

Example:

```text
Rahul → Krish   ₹1,133
Aman  → Krish   ₹1,534
```

The objective is to reduce the number of transactions where practical.

Do not show every pairwise debt if it can be simplified.

The UI should clearly say:

```text
Settle up
```

and show actionable payment relationships.

Later, this could support:

- mark as paid
- settlement history
- partial settlement
- undo settlement

---

# 17. Chat

Every room has a real-time chat.

Store chat messages in Supabase.

Schema:

```text
chat_messages

id
room_id
user_id
message
created_at
updated_at
```

Features:

- real-time messages
- timestamps
- sender avatar/name
- unread indicator
- auto-scroll to latest
- message grouping by sender
- basic message deletion for own messages
- optional emoji support

The database is the permanent source of truth.

Realtime is only the delivery mechanism.

---

# 18. Realtime Architecture

Use Supabase Realtime.

A typical event flow:

```text
Krish adds expense
        ↓
React app inserts into Supabase
        ↓
PostgreSQL stores expense
        ↓
Supabase Realtime emits change
        ↓
Other clients receive event
        ↓
TanStack Query cache invalidates/updates
        ↓
All dashboards refresh
```

The same pattern should work for chat.

Use private room channels where appropriate.

Room channel concept:

```text
room:<room_id>
```

Use Presence for online state.

Example:

```text
3 people online

🟢 Krish
🟢 Rahul
⚪ Aman
```

Use Broadcast for transient events where persistence is not needed, such as:

- typing indicators
- lightweight UI events
- "member is viewing expense"
- temporary interaction signals

Do not persist transient Broadcast events.

---

# 19. Data Fetching / Client State

Use:

- TanStack Query for server/database state
- React local state for temporary form/UI state

Do not turn the application into a giant global state store unless required.

Prefer cache invalidation or targeted updates after mutations.

Important query examples:

```text
room
room_members
room_expenses
expense_splits
chat_messages
settlements
room_summary
member_balances
```

---

# 20. Database Architecture

Suggested schema:

```text
profiles
rooms
room_members
expenses
expense_splits
chat_messages
settlements
```

Optional later:

```text
expense_receipts
notifications
room_settings
activity_log
```

---

# 21. Expense Split Table

Use a separate split table rather than storing all split data as an opaque JSON field.

Suggested:

```text
expense_splits

id
expense_id
user_id
amount
tax_amount
total_share
created_at
updated_at
```

This allows efficient queries such as:

- how much a person owes
- how much a person has been assigned
- room balance calculations
- historical reporting

---

# 22. Financial Precision

Do not rely on JavaScript floating-point numbers for financial logic without a deliberate rounding strategy.

Use a consistent currency precision strategy.

Recommended approach:

- represent monetary values using integer minor units where practical, e.g. paise
- store currency code
- centralize rounding
- define how residual cents/paise are allocated during equal splits

Example:

```text
₹100 / 3

Person A = ₹33.34
Person B = ₹33.33
Person C = ₹33.33
```

The app must always reconcile to the exact original total.

---

# 23. Supabase Security / RLS

Enable Row Level Security on all exposed application tables.

Users should only be able to access data for rooms they are members of.

Conceptually:

```text
authenticated user
        ↓
room_members
        ↓
authorized room
        ↓
expenses / splits / chat
```

Do not use:

```text
authenticated = can access every row
```

Policies should enforce actual room membership.

Protect:

- room data
- member data
- expenses
- expense splits
- chat messages
- settlements

Never expose a Supabase service-role/secret key in the browser.

Use the public/publishable client key in frontend code.

---

# 24. PWA Requirements

The app must behave like an installable mobile app.

Implement:

- Web App Manifest
- app name
- short name
- icons
- theme color
- background color
- standalone display mode
- service worker
- installability metadata
- responsive layout

Recommended manifest:

```text
name: DVide
short_name: DVide
display: standalone
orientation: portrait
```

Provide proper icons for common sizes.

The app should work well when launched from the Home Screen rather than only inside a browser tab.

---

# 25. Offline Strategy

Version 1 should prioritize reliable online real-time behavior.

However, architect the app so offline support can be introduced cleanly.

Cache:

- app shell
- static assets
- basic UI assets

Future offline queue:

```text
User creates expense
        ↓
No connection
        ↓
Store pending mutation locally
        ↓
Connection returns
        ↓
Sync to Supabase
        ↓
Resolve conflicts
```

Do not pretend an expense is permanently synced while it is still only local.

Clearly indicate pending/offline states.

---

# 26. Mobile UX

The mobile layout is the priority.

Use:

- bottom navigation
- sticky CTA
- safe-area padding for devices with notches/home indicators
- touch-friendly buttons
- swipe-friendly sheets
- keyboard-aware forms
- mobile-friendly number input
- native-style date/time controls where appropriate

Suggested bottom navigation:

```text
Home
People
Chat
Activity / Me
```

The room page can prioritize:

```text
Overview
Expenses
People
Chat
```

Do not overload the screen with too many tabs.

---

# 27. Desktop UX

On larger screens:

- use a centered app shell
- optionally show a wider two-column room layout
- preserve mobile interaction patterns where useful
- avoid stretching content edge-to-edge unnecessarily

Example:

```text
┌──────────────────────────────────────────────┐
│ DVide                              Profile   │
├───────────────┬──────────────────────────────┤
│ Room Summary  │ Recent Expenses              │
│               │                              │
│ Members       │ Expense cards                │
│               │                              │
│ Navigation    │                              │
├───────────────┴──────────────────────────────┤
│                 Add Expense                  │
└──────────────────────────────────────────────┘
```

---

# 28. Visual Design Direction

Aim for a modern fintech/productivity aesthetic rather than a generic dashboard.

Use:

- clean neutral background
- strong typography
- rounded cards
- subtle borders
- restrained shadows
- clear hierarchy
- compact information density
- one strong accent color
- semantic colors for positive/negative balances

Suggested feel:

```text
Linear
Notion
Splitwise
modern banking apps
```

Do not copy their branding or UI exactly.

Avoid:

- excessive gradients
- huge illustrations
- excessive animation
- noisy backgrounds
- tiny text
- overly decorative charts

---

# 29. Expense Cards

Each expense card could display:

```text
🍕 Dinner

₹2,832
Paid by Krish

You owe ₹708
```

Expanded version:

```text
Dinner

Subtotal      ₹2,400
Tax             ₹432
Total         ₹2,832

Paid by:
Krish

Split:
Krish       ₹708
Rahul       ₹708
Aman        ₹708
Riya        ₹708
```

Use clear status indicators such as:

```text
You paid
You owe
You receive
Settled
```

---

# 30. Room Members Screen

Display:

```text
Krish
You
Paid      ₹4,000
Share     ₹1,333
Balance  +₹2,667

Rahul
Paid          ₹0
Share      ₹1,333
Balance   -₹1,333
```

Also show online state.

---

# 31. Activity Feed

Add a lightweight activity history:

```text
Krish added Dinner — ₹2,832
Rahul joined the room
Aman settled ₹500
Riya edited Taxi expense
```

This is useful for transparency in shared financial calculations.

Create an activity table later if necessary.

---

# 32. Empty States

Design useful empty states.

Example:

```text
No expenses yet

Add your first expense and DVide will
calculate everyone's share automatically.

[ Add Expense ]
```

For chat:

```text
No messages yet

Start the conversation with your group.
```

For rooms:

```text
No rooms yet

Create a room for your next trip,
dinner, or shared expense.
```

---

# 33. Error Handling

Never silently fail financial operations.

Clearly handle:

- offline state
- expired session
- unauthorized room access
- invalid room code
- duplicate mutation
- failed insert/update
- realtime disconnected
- invalid split totals
- tax rounding differences
- deleted member
- deleted expense

Provide understandable user-facing errors.

Example:

```text
Couldn't save expense

Check your connection and try again.
```

Do not expose raw database errors to normal users.

---

# 34. Loading States

Use skeletons or compact loading indicators.

Avoid full-screen spinners for every operation.

Examples:

- dashboard skeleton
- expense list skeleton
- chat message loading
- button loading state while saving

Optimistic UI can be used carefully for non-destructive interactions.

For financial mutations, ensure eventual database confirmation.

---

# 35. Notifications

Do not make notifications mandatory for MVP.

Prepare architecture for:

- expense added
- someone mentioned you
- someone settled a payment
- room invitation
- someone changed a shared expense

Potential future options:

- browser push notifications
- email notifications

---

# 36. Receipt / Bill Scanning — Future Feature

Design the data model so receipt attachments can be added later.

Future flow:

```text
Take photo
      ↓
OCR / AI extraction
      ↓
Restaurant bill items
      ↓
Subtotal
Tax
Service charge
Tip
      ↓
Assign each item to members
      ↓
Generate split
```

This can become a major future feature.

---

# 37. Analytics / Insights — Future Feature

Potential room insights:

```text
Total spent
Average expense
Largest category
Most frequent payer
Category breakdown
Spending by person
```

Do not prioritize complex charts in MVP.

The main product is splitting and settling expenses.

---

# 38. Accessibility

Include:

- semantic HTML
- keyboard navigation
- visible focus states
- accessible labels
- adequate contrast
- reduced-motion support
- screen-reader-friendly controls
- touch targets large enough for mobile use

Do not rely on color alone to communicate balance status.

---

# 39. Performance

The app should feel instant.

Optimize for:

- fast initial load
- lazy loading for secondary routes
- query caching
- minimal unnecessary rerenders
- image compression
- efficient realtime subscriptions
- pagination for long chat histories
- pagination or virtualization for large expense histories

Avoid establishing a separate realtime subscription for every individual UI component.

Prefer room-scoped subscriptions where practical.

---

# 40. Architecture Rule: One Source of Truth

Keep the responsibilities clean.

```text
Supabase PostgreSQL
= persistent source of truth

Supabase Realtime
= live synchronization / event transport

TanStack Query
= client-side server-state cache

React state
= local UI state

Calculation module / Postgres queries
= financial logic
```

Avoid putting authoritative financial state only in local React state.

---

# 41. Calculation Engine

Create a dedicated financial calculation module.

Suggested functions:

```text
calculateTax()
calculateExpenseTotal()
calculateEqualSplit()
calculatePercentageSplit()
calculateExactSplit()
calculateSharesSplit()
calculateMemberBalance()
calculateRoomSummary()
generateSettlements()
roundCurrency()
```

All financial operations should flow through this centralized logic.

Write unit tests for these functions.

Include edge cases:

- 0 tax
- 100% tax
- odd totals
- very small amounts
- multiple taxes/charges
- discounts
- 3-way and 7-way splits
- partial settlement
- decimal percentages

---

# 42. Testing

Include tests for:

## Unit Tests

Financial calculations.

## Integration Tests

Supabase CRUD flows.

## Realtime Tests

- expense added by one client appears on another
- chat message appears on another
- member presence updates correctly

## E2E Tests

Main flows:

```text
Register
Create room
Join room
Add expense
Split expense
Verify balances
Add chat message
Settle expense
Install/open PWA
```

Use a practical testing framework such as Vitest for unit tests and Playwright for browser/E2E testing if appropriate.

---

# 43. Environment Variables

Use environment variables for configuration.

Example:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Never commit secrets.

Provide:

```text
.env.example
```

Do not put service-role credentials in frontend environment variables.

---

# 44. Suggested Project Structure

```text
dvide/
├── public/
│   ├── icons/
│   ├── favicon.ico
│   └── ...
│
├── src/
│   ├── components/
│   │   ├── ui/
│   │   ├── room/
│   │   ├── expense/
│   │   ├── chat/
│   │   ├── settlement/
│   │   └── layout/
│   │
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Room.tsx
│   │   ├── JoinRoom.tsx
│   │   ├── Chat.tsx
│   │   ├── People.tsx
│   │   ├── Profile.tsx
│   │   └── Auth.tsx
│   │
│   ├── hooks/
│   │   ├── useRoom.ts
│   │   ├── useExpenses.ts
│   │   ├── useChat.ts
│   │   ├── useRealtime.ts
│   │   └── usePresence.ts
│   │
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── calculations.ts
│   │   ├── currency.ts
│   │   └── utils.ts
│   │
│   ├── services/
│   │   ├── rooms.ts
│   │   ├── expenses.ts
│   │   ├── chat.ts
│   │   └── settlements.ts
│   │
│   ├── types/
│   │   └── database.ts
│   │
│   └── App.tsx
│
├── supabase/
│   └── migrations/
│
├── tests/
│
├── .env.example
├── index.html
├── vite.config.ts
├── package.json
└── README.md
```

---

# 45. Routing

Suggested routes:

```text
/
 /login
 /signup
 /home
 /room/:roomId
 /room/:roomId/expenses
 /room/:roomId/people
 /room/:roomId/chat
 /room/:roomId/settle
 /join/:inviteCode
 /profile
```

Keep URLs shareable.

Opening a room link on another device should correctly route the user into the room/join flow.

---

# 46. MVP Feature Priority

## Phase 1 — Core

Implement first:

1. App shell
2. Authentication
3. Profiles
4. Create room
5. Join room
6. Room membership
7. Add expense
8. Expense splits
9. Tax calculation
10. Personal balances
11. Realtime expense updates
12. Realtime chat
13. PWA support

## Phase 2 — Better Product

Then add:

1. Settlement optimization
2. Edit/delete expenses
3. Activity feed
4. Expense categories
5. Settlement tracking
6. Better offline support
7. Browser notifications
8. Receipt uploads

## Phase 3 — Advanced

Later:

1. Bill scanning
2. OCR/AI item extraction
3. Item-level splitting
4. Multiple currencies
5. Currency conversion
6. Analytics
7. Recurring expenses
8. Advanced notifications

Do not overbuild Phase 1.

---

# 47. Important UX Example

A typical dinner should work like this:

### Step 1

Krish creates room:

```text
College Dinner
```

### Step 2

Friends join.

### Step 3

Krish adds:

```text
Dinner
₹2,400
Paid by Krish
Split among 4
Tax 18%
Equal tax split
```

### Step 4

DVide calculates:

```text
Subtotal       ₹2,400
Tax              ₹432
Total          ₹2,832

Each person's share = ₹708
```

### Step 5

Dashboard updates on everyone's device.

Krish:

```text
Paid       ₹2,832
Share        ₹708
Balance   +₹2,124
```

Everyone else:

```text
Paid          ₹0
Share       ₹708
Balance    -₹708
```

### Step 6

Settlement view:

```text
Rahul → Krish    ₹708
Aman  → Krish    ₹708
Riya  → Krish    ₹708
```

This entire experience should feel nearly instantaneous.

---

# 48. Security Requirements

Before considering the MVP complete, verify:

- RLS enabled on all exposed tables
- users can only access rooms they belong to
- users cannot modify another user's protected data
- users cannot change room membership arbitrarily
- service-role key is never shipped to browser
- invite codes are not predictable enough to expose room data
- authenticated room access is verified server-side/database-side
- realtime channels respect room authorization
- input is validated with Zod and database constraints
- all important money values have proper database types and constraints

---

# 49. Developer Rules

While building DVide:

1. Keep code modular.
2. Prefer small reusable components.
3. Keep financial calculations centralized.
4. Never duplicate formulas in components.
5. Do not trust client-side authorization.
6. Use RLS.
7. Do not create unnecessary backend servers.
8. Prefer Supabase features where they already solve the problem.
9. Keep realtime subscriptions scoped and efficient.
10. Keep mobile UX first.
11. Make every important action resilient to network errors.
12. Do not expose secrets.
13. Write tests for financial calculations.
14. Keep the UI simple.
15. Do not add unnecessary dependencies.

---

# 50. Definition of Done

The MVP is complete when a user can:

```text
Open DVide
   ↓
Sign in
   ↓
Create a room
   ↓
Share room link/code
   ↓
Friends join
   ↓
Add expenses
   ↓
Select who paid
   ↓
Select who shares
   ↓
Apply tax
   ↓
See personal totals
   ↓
See group totals
   ↓
See live updates from other users
   ↓
Chat in the room
   ↓
See settlement suggestions
   ↓
Install DVide to the phone Home Screen
   ↓
Launch DVide like an app
```

All of this should work responsively on:

- iPhone
- Android
- iPad/tablets
- Mac
- Windows
- modern Chromium-based browsers
- Safari

---

# 51. Build Philosophy

Do not treat DVide as a normal CRUD dashboard.

Treat it as a **real-time collaborative mobile product**.

The most important qualities are:

```text
Fast
Simple
Accurate
Real-time
Mobile-first
Installable
Secure
```

The user's primary question at any point should be answered immediately:

> "How much did I spend, how much do I owe, and who do I need to pay?"

The room's primary question should be answered immediately:

> "How much has everyone spent and how do we settle up?"

Build the MVP around those two questions.
