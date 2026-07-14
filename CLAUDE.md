# Dan's Pantry Guru — Claude Code System Prompt
---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| UI Components | Shadcn/UI (Radix UI primitives) |
| Icons | Lucide React |
| Backend & Database | Supabase (Postgres) |
| Authentication | Supabase Auth (Magic Link / Email) |
| Barcode Lookup | Open Food Facts API (free, no key needed) |
| Vision AI | Claude Vision API (claude-opus-4-6) |

---

## Database Schema

Run this SQL exactly in your Supabase project to initialize the database:

```sql
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Inventory Table
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  brand TEXT,
  category TEXT CHECK (category IN ('Fruits & Vegetables', 'Bakery', 'Grains & Pasta', 'Deli & Meat', 'Seafood', 'Dairy & Eggs', 'Frozen Foods', 'Beverages', 'Snacks', 'Essentials', 'Other')),
  original_weight FLOAT NOT NULL,
  current_weight FLOAT NOT NULL,
  unit TEXT DEFAULT 'oz',
  usage_frequency TEXT CHECK (usage_frequency IN ('daily', 'thrice_weekly', 'weekly')),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  predicted_empty_date DATE,
  barcode TEXT,
  image_url TEXT
);

-- Shopping List Table
CREATE TABLE shopping_list (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_purchased BOOLEAN DEFAULT FALSE,
  auto_added BOOLEAN DEFAULT FALSE -- true = triggered by low stock logic
);

-- Row Level Security (RLS) — users only see their own data
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own inventory"
  ON inventory FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own shopping list"
  ON shopping_list FOR ALL USING (auth.uid() = user_id);
```

---

## Core Business Logic

### 1. Depletion Tracking (No Physical Scale)
- Each item stores `original_weight` and `current_weight`
- User updates via a **Percentage Slider** (e.g., "I used 25%")
- On slider change: `new_current_weight = original_weight * (1 - slider_value)`

### 2. Predictive Engine
```
days_per_use = { daily: 1, thrice_weekly: 2.33, weekly: 7 }
DaysRemaining = (current_weight / original_weight) * days_per_use[usage_frequency]
predicted_empty_date = today + DaysRemaining
```

### 3. Auto Shopping List Trigger
```
IF current_weight < (original_weight * 0.20):
  INSERT into shopping_list (auto_added = true)
  unless item already exists in shopping_list (is_purchased = false)
```

---

## Feature Roadmap (Build in This Order)

### Sprint 1 — Foundation
1. **Project scaffold** — Next.js 14 + Tailwind + Shadcn/UI setup
2. **Supabase connection** — env vars, client setup, RLS policies
3. **Auth flow** — Magic link login page (`/login`), session handling

### Sprint 2 — Core Views
4. **Pantry View** (`/inventory`) — List of all items with progress bar "fuel gauges"
5. **Add Item flow** — Manual entry form with all fields

### Sprint 3 — Smart Features
6. **Barcode Scanner** (`/scan`) — Camera access + Open Food Facts lookup to pre-fill form
7. **Vision AI fallback** — Photo upload → Claude Vision identifies item + suggests name/category
8. **Update Weight** — Percentage slider modal per item

### Sprint 4 — Automation
9. **Shopping List View** (`/shopping`) — Auto-populated + manual add
10. **Low stock trigger** — Background check on every weight update
11. **Predicted empty date** — Display on each pantry card

---

## Component Architecture (Atomic Design)

Build in this order:
1. **Hooks first** — `useInventory`, `useShoppingList` (Supabase data hooks)
2. **Logic functions** — `calculateDaysRemaining`, `triggerShoppingList`, `fetchBarcode`
3. **Atoms** — `FuelGauge`, `CategoryBadge`, `PercentageSlider`
4. **Molecules** — `InventoryCard`, `ShoppingListItem`, `ScannerView`
5. **Pages** — Assemble atoms/molecules into full page views

---

## Key Implementation Notes for Claude

- **Mobile first always** — Test every component at 390px width (iPhone 14 size) before desktop
- **Barcode API** — `GET https://world.openfoodfacts.org/api/v0/product/{barcode}.json` — extract `product.product_name`, `product.brands`, `product.serving_size`, `product.quantity`
- **Claude Vision** — When user uploads a photo with no barcode, send image to Claude Vision with prompt: *"Identify this grocery item. Return JSON: { item_name, category, estimated_quantity, unit }"*
- **Progress bars** — Use color coding: Green (>50%), Yellow (20–50%), Red (<20%)
- **Supabase real-time** — Use Supabase subscriptions on the shopping list table for live updates
- **Error handling** — Every API call needs a loading state and graceful error message
- **No console.log in production** — Use proper error boundaries

---

## Environment Variables Needed

Create a `.env.local` file with:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

---

## First Command to Run

Once you confirm the stack is ready, start with:
> "Scaffold the Next.js 14 project with Tailwind CSS and Shadcn/UI. Set up the Supabase client with environment variables. Create the folder structure following the App Router convention."
