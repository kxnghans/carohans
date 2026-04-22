-- RLS Policies for CaroHans Ventures ERMS

-- SETTINGS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON public.settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow admin all access" ON public.settings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to read their own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Allow admins to read all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Allow users to update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- CLIENTS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow clients to read their own data" ON public.clients FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Allow admins to read all clients" ON public.clients FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Allow clients to update their own data" ON public.clients FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Allow admins to manage all clients" ON public.clients FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- INVENTORY
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to inventory" ON public.inventory FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow admins to manage inventory" ON public.inventory FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ORDERS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow clients to read their own orders" ON public.orders FOR SELECT TO authenticated USING (email = auth.jwt()->>'email');
CREATE POLICY "Allow admins to manage all orders" ON public.orders FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Allow clients to insert orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (true);

-- ORDER ITEMS
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow clients to read their own order items" ON public.order_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.email = auth.jwt()->>'email'));
CREATE POLICY "Allow admins to manage all order items" ON public.order_items FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Allow clients to insert order items" ON public.order_items FOR INSERT TO authenticated WITH CHECK (true);

-- DISCOUNTS
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to active discounts" ON public.discounts FOR SELECT TO anon, authenticated USING (status = 'active' OR public.is_admin());
CREATE POLICY "Allow admins to manage discounts" ON public.discounts FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- DISCOUNT REDEMPTIONS
ALTER TABLE public.discount_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow clients to read their own redemptions" ON public.discount_redemptions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.clients WHERE clients.id = discount_redemptions.client_id AND clients.user_id = auth.uid()));
CREATE POLICY "Allow admins to manage all redemptions" ON public.discount_redemptions FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
