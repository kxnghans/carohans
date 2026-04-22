-- 1. Inventory Availability RPC (Batch version)
CREATE OR REPLACE FUNCTION public.get_available_stock(check_start date, check_end date)
 RETURNS TABLE(item_id integer, total_stock integer, active_rentals integer, available_stock integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    i.id as item_id,
    i.stock as total_stock,
    COALESCE(SUM(oi.quantity), 0)::integer as active_rentals,
    (i.stock - COALESCE(SUM(oi.quantity), 0))::integer as available_stock
  FROM inventory i
  LEFT JOIN order_items oi ON i.id = oi.inventory_id
  LEFT JOIN orders o ON oi.order_id = o.id AND o.status IN ('Pending', 'Approved', 'Active', 'Late', 'Overdue') AND o.start_date <= check_end AND o.end_date >= check_start
  GROUP BY i.id, i.stock;
END;
$function$;

-- 2. Inventory Availability RPC (Single item version)
CREATE OR REPLACE FUNCTION public.get_available_stock(check_start date, check_end date, p_item_id integer)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_available integer;
BEGIN
  SELECT (i.stock - COALESCE(SUM(oi.quantity), 0))::integer INTO v_available
  FROM inventory i
  LEFT JOIN order_items oi ON i.id = oi.inventory_id
  LEFT JOIN orders o ON oi.order_id = o.id AND o.status IN ('Pending', 'Approved', 'Active', 'Late', 'Overdue') AND o.start_date <= check_end AND o.end_date >= check_start
  WHERE i.id = p_item_id
  GROUP BY i.id, i.stock;
  
  RETURN COALESCE(v_available, (SELECT stock FROM inventory WHERE id = p_item_id));
END;
$function$;
