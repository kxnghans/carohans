-- 1. Identity Resolution RPC
CREATE OR REPLACE FUNCTION public.get_email_for_login(login_input text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN (
    SELECT email FROM public.profiles 
    WHERE lower(username) = lower(login_input) OR lower(email) = lower(login_input)
    LIMIT 1
  );
END;
$function$;

-- 2. Advanced Order Search RPC
CREATE OR REPLACE FUNCTION public.search_orders(p_search_term text, p_exact_id integer DEFAULT NULL, p_filters jsonb DEFAULT '{}'::jsonb, p_limit integer DEFAULT 200)
 RETURNS TABLE(id integer, client_id integer, client_name text, phone text, email text, status text, start_date date, end_date date, total_amount numeric, amount_paid numeric, penalty_amount numeric, deposit_paid boolean, closed_at timestamptz, return_status text, item_integrity text, discount_name text, discount_type public.discount_value_type, discount_value numeric, item_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    o.id, o.client_id, o.client_name, o.phone, o.email, o.status, o.start_date, o.end_date, o.total_amount, o.amount_paid, o.penalty_amount, o.deposit_paid, o.closed_at, o.return_status, o.item_integrity, o.discount_name, o.discount_type, o.discount_value,
    COUNT(oi.id) as item_count
  FROM orders o
  LEFT JOIN order_items oi ON o.id = oi.order_id
  WHERE 
    (p_exact_id IS NOT NULL AND o.id = p_exact_id)
    OR
    (
      p_exact_id IS NULL AND
      (p_search_term = '' OR o.client_name ILIKE '%' || p_search_term || '%' OR o.email ILIKE '%' || p_search_term || '%' OR o.phone ILIKE '%' || p_search_term || '%')
      AND (p_filters->>'status' IS NULL OR o.status = p_filters->>'status')
      AND (p_filters->>'client_id' IS NULL OR o.client_id = (p_filters->>'client_id')::integer)
    )
  GROUP BY o.id
  ORDER BY o.created_at DESC
  LIMIT p_limit;
END;
$function$;

-- 3. Complex Order Return RPC
CREATE OR REPLACE FUNCTION public.process_order_return(
    p_order_id integer,
    p_status text,
    p_closed_at timestamptz,
    p_return_status text,
    p_item_integrity text,
    p_penalty_amount numeric,
    p_amount_paid numeric,
    p_total_amount numeric,
    p_discount_name text DEFAULT '',
    p_discount_type public.discount_value_type DEFAULT 'fixed',
    p_discount_value numeric DEFAULT 0,
    p_discount_code text DEFAULT '',
    p_items jsonb DEFAULT '[]'::jsonb
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  item jsonb;
BEGIN
  -- 1. Update the Order record
  UPDATE orders SET
    status = p_status,
    closed_at = p_closed_at,
    return_status = p_return_status,
    item_integrity = p_item_integrity,
    penalty_amount = p_penalty_amount,
    amount_paid = p_amount_paid,
    total_amount = p_total_amount,
    discount_name = CASE WHEN p_discount_name = '' THEN discount_name ELSE p_discount_name END,
    discount_type = p_discount_type,
    discount_value = p_discount_value
  WHERE id = p_order_id;

  -- 2. Update Order Items (returned/lost/damaged counts)
  FOR item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    UPDATE order_items SET
      returned_qty = (item->>'returned_qty')::integer,
      lost_qty = (item->>'lost_qty')::integer,
      damaged_qty = (item->>'damaged_qty')::integer
    WHERE order_id = p_order_id AND inventory_id = (item->>'inventory_id')::integer;
  END LOOP;
END;
$function$;

-- 4. Seed Default Signup Token
INSERT INTO public.settings (key, value)
VALUES ('signup_token', 'CAROHANS-2026')
ON CONFLICT (key) DO NOTHING;

-- 5. Enable Real-time
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE orders;
    ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
    ALTER PUBLICATION supabase_realtime ADD TABLE inventory;
  END IF;
EXCEPTION WHEN OTHERS THEN
END $$;
