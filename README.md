# FoodExpress - Local Food Delivery Ecosystem

FoodExpress is a mobile application ecosystem replicating key features of Swiggy and Zomato, optimized for local small hotels and restaurants.

## Project Structure

This repository is organized as a monorepo containing:

- `/mobile` - React Native Expo cross-platform mobile application. Includes customer, restaurant, delivery partner, and administrative views.
- `/landing` - Responsive Vite + React landing page with an integrated interactive Web Simulator of the mobile app.
- `/supabase` - SQL schema file and guides for database setup.

## Getting Started

### 1. Database Setup (Supabase)
Create a Supabase project at [supabase.com](https://supabase.com). Run the SQL queries in [supabase/schema.sql](supabase/schema.sql) in the SQL Editor to set up all tables, Row Level Security (RLS) rules, triggers, and mock seed data.

### 2. Run the Landing Page & Simulator
```bash
cd landing
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser. This includes a full mobile app simulator where you can test the checkout and order fulfillment flows directly.

### 3. Run the Mobile App
```bash
cd mobile
npm install
npx expo start
```
Configure your Supabase URL and Anon Key in `mobile/src/lib/supabase.ts`. Use the Expo Go app on iOS or Android to run locally.

### 4. Build for iOS/Android
To trigger cloud builds using Expo Application Services (EAS):
```bash
cd mobile
npx eas-cli build --platform all
```
Ensure you have configured your Expo account in `mobile/app.json`.
