-- 1. Client Metrics Refresh Function
CREATE OR REPLACE FUNCTION public.refresh_client_metrics(p_client_id integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.clients
  SET 
    total_orders = (SELECT COUNT(*)::integer FROM orders WHERE client_id = p_client_id AND status = 'Closed'),
    total_spent = (SELECT COALESCE(SUM(amount_paid), 0)::numeric FROM orders WHERE client_id = p_client_id AND status = 'Closed'),
    last_order = (SELECT MAX(created_at) FROM orders WHERE client_id = p_client_id)
  WHERE id = p_client_id;
END;
$function$;

-- 2. Trigger Function
CREATE OR REPLACE FUNCTION public.on_order_metrics_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- If client_id changed (rare but possible), refresh both old and new
  IF (OLD.client_id IS NOT NULL AND (NEW.client_id IS NULL OR NEW.client_id != OLD.client_id)) THEN
    PERFORM refresh_client_metrics(OLD.client_id);
  END IF;
  
  IF (NEW.client_id IS NOT NULL) THEN
    PERFORM refresh_client_metrics(NEW.client_id);
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 3. Triggers
-- We only need to trigger on status change or amount change for terminal orders
CREATE TRIGGER trg_refresh_client_metrics_on_update 
AFTER UPDATE OF status, amount_paid, client_id ON public.orders 
FOR EACH ROW EXECUTE FUNCTION on_order_metrics_change();

CREATE TRIGGER trg_refresh_client_metrics_on_delete
AFTER DELETE ON public.orders
FOR EACH ROW EXECUTE FUNCTION on_order_metrics_change();
