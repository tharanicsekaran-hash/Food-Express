-- FoodExpress Database Schema

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE
create table public.profiles (
    id uuid references auth.users on delete cascade primary key,
    name text not null,
    phone text,
    role text not null default 'customer' check (role in ('customer', 'restaurant_owner', 'delivery_partner', 'admin')),
    city text not null default 'Bangalore',
    loyalty_points integer not null default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Policies for profiles
create policy "Public profiles are viewable by everyone" on public.profiles
    for select using (true);

create policy "Users can update their own profile" on public.profiles
    for update using (auth.uid() = id);

-- 2. RESTAURANTS TABLE
create table public.restaurants (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    description text,
    image_url text,
    cuisine_type text not null,
    rating numeric(2,1) default 4.0 check (rating >= 1.0 and rating <= 5.0),
    delivery_time integer not null default 30, -- minutes
    delivery_fee numeric(10,2) not null default 0.00,
    city text not null default 'Bangalore',
    address text not null,
    is_featured boolean not null default false,
    is_active boolean not null default true,
    owner_id uuid references public.profiles(id) on delete set null,
    latitude double precision,
    longitude double precision,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on restaurants
alter table public.restaurants enable row level security;

-- Policies for restaurants
create policy "Restaurants are viewable by everyone" on public.restaurants
    for select using (is_active = true);

create policy "Owners can update their own restaurants" on public.restaurants
    for update using (auth.uid() = owner_id);

create policy "Admins can manage all restaurants" on public.restaurants
    for all using (
        exists (
            select 1 from public.profiles 
            where id = auth.uid() and role = 'admin'
        )
    );

-- 3. MENU ITEMS TABLE
create table public.menu_items (
    id uuid default gen_random_uuid() primary key,
    restaurant_id uuid references public.restaurants(id) on delete cascade not null,
    name text not null,
    description text,
    price numeric(10,2) not null check (price >= 0),
    image_url text,
    category text not null check (category in ('Biryani', 'Snacks', 'Drinks', 'North Indian', 'South Indian', 'Desserts', 'Burgers & Pizzas')),
    is_available boolean not null default true,
    is_veg boolean not null default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on menu items
alter table public.menu_items enable row level security;

-- Policies for menu items
create policy "Menu items are viewable by everyone" on public.menu_items
    for select using (true);

create policy "Owners can manage menu items for their restaurants" on public.menu_items
    for all using (
        exists (
            select 1 from public.restaurants 
            where id = menu_items.restaurant_id and owner_id = auth.uid()
        )
    );

-- 4. PROMO CODES TABLE
create table public.promo_codes (
    code text primary key,
    description text,
    discount_type text not null check (discount_type in ('percentage', 'flat')),
    discount_value numeric(10,2) not null check (discount_value > 0),
    min_order_amount numeric(10,2) not null default 0.00 check (min_order_amount >= 0),
    is_active boolean not null default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on promo codes
alter table public.promo_codes enable row level security;

-- Policies for promo codes
create policy "Promo codes are viewable by all authenticated users" on public.promo_codes
    for select using (true);

-- 5. ORDERS TABLE
create table public.orders (
    id uuid default gen_random_uuid() primary key,
    customer_id uuid references public.profiles(id) on delete set null not null,
    restaurant_id uuid references public.restaurants(id) on delete set null not null,
    status text not null default 'pending' check (status in ('pending', 'accepted', 'preparing', 'out_for_delivery', 'delivered', 'cancelled')),
    total_amount numeric(10,2) not null check (total_amount >= 0),
    discount_amount numeric(10,2) not null default 0.00 check (discount_amount >= 0),
    delivery_fee numeric(10,2) not null default 0.00 check (delivery_fee >= 0),
    final_amount numeric(10,2) not null check (final_amount >= 0),
    payment_method text not null check (payment_method in ('upi', 'card', 'wallet', 'cod')),
    payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed')),
    delivery_partner_id uuid references public.profiles(id) on delete set null,
    delivery_address text not null,
    promo_code text references public.promo_codes(code) on delete set null,
    latitude double precision, -- current delivery partner location simulated
    longitude double precision,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on orders
alter table public.orders enable row level security;

-- Policies for orders
create policy "Customers can view their own orders" on public.orders
    for select using (auth.uid() = customer_id);

create policy "Customers can insert their own orders" on public.orders
    for insert with check (auth.uid() = customer_id);

create policy "Owners can view orders for their restaurants" on public.orders
    for select using (
        exists (
            select 1 from public.restaurants 
            where id = orders.restaurant_id and owner_id = auth.uid()
        )
    );

create policy "Owners can update orders for their restaurants" on public.orders
    for update using (
        exists (
            select 1 from public.restaurants 
            where id = orders.restaurant_id and owner_id = auth.uid()
        )
    );

create policy "Delivery partners can view and update assigned orders" on public.orders
    for all using (
        delivery_partner_id = auth.uid() or (status = 'accepted' and delivery_partner_id is null)
    );

create policy "Admins can view and manage all orders" on public.orders
    for all using (
        exists (
            select 1 from public.profiles 
            where id = auth.uid() and role = 'admin'
        )
    );

-- 6. ORDER ITEMS TABLE
create table public.order_items (
    id uuid default gen_random_uuid() primary key,
    order_id uuid references public.orders(id) on delete cascade not null,
    menu_item_id uuid references public.menu_items(id) on delete set null not null,
    quantity integer not null check (quantity > 0),
    price numeric(10,2) not null check (price >= 0)
);

-- Enable RLS on order items
alter table public.order_items enable row level security;

create policy "Order items are viewable by anyone involved in the order" on public.order_items
    for select using (
        exists (
            select 1 from public.orders
            where id = order_items.order_id and (
                customer_id = auth.uid() or 
                delivery_partner_id = auth.uid() or
                exists (
                    select 1 from public.restaurants 
                    where id = orders.restaurant_id and owner_id = auth.uid()
                )
            )
        )
    );

create policy "Customers can insert order items" on public.order_items
    for insert with check (
        exists (
            select 1 from public.orders
            where id = order_items.order_id and customer_id = auth.uid()
        )
    );

-- 7. SUBSCRIPTIONS TABLE
create table public.subscriptions (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    plan_name text not null check (plan_name in ('Weekly Meal Plan', 'Monthly Meal Plan')),
    price numeric(10,2) not null check (price >= 0),
    start_date timestamp with time zone default timezone('utc'::text, now()) not null,
    end_date timestamp with time zone not null,
    status text not null default 'active' check (status in ('active', 'expired')),
    meals_remaining integer not null check (meals_remaining >= 0),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on subscriptions
alter table public.subscriptions enable row level security;

create policy "Users can view and manage their own subscriptions" on public.subscriptions
    for all using (auth.uid() = user_id);

-- TRIGGER FOR CREATING PROFILE ON USER SIGNUP
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, phone, role, city, loyalty_points)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    new.raw_user_meta_data->>'phone',
    coalesce(new.raw_user_meta_data->>'role', 'customer'),
    coalesce(new.raw_user_meta_data->>'city', 'Bangalore'),
    100 -- Welcome bonus loyalty points
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- SEED DATA

-- Insert Promo Codes
insert into public.promo_codes (code, description, discount_type, discount_value, min_order_amount, is_active) values
('FIRST50', 'Get 50% off on your first food order', 'percentage', 50.00, 100.00, true),
('FREEFEED', 'Flat ₹150 off on local orders above ₹350', 'flat', 150.00, 350.00, true),
('WEEKEND20', 'Get 20% off on weekend feasts', 'percentage', 20.00, 200.00, true);

-- Note: Seed profiles, restaurants, and menu items are typically added during setup or dynamic mock data insertion.
