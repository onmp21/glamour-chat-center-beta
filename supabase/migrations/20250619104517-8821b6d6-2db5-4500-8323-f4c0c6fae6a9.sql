
-- Create function to count unique sessions in a conversation table
CREATE OR REPLACE FUNCTION public.count_unique_sessions(table_name text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  unique_count integer;
BEGIN
  EXECUTE format('SELECT COUNT(DISTINCT session_id) FROM %I', table_name)
  INTO unique_count;
  
  RETURN COALESCE(unique_count, 0);
END;
$function$;

-- Create function to count total unread messages in a conversation table
CREATE OR REPLACE FUNCTION public.count_unread_messages_total(table_name text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  unread_count integer;
BEGIN
  EXECUTE format('SELECT COUNT(*) FROM %I WHERE is_read = false', table_name)
  INTO unread_count;
  
  RETURN COALESCE(unread_count, 0);
END;
$function$;
