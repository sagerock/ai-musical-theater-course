-- Create a webhook function that triggers when new contact requests are inserted
-- This will work in production with Supabase Edge Functions

-- First, create a function that gets called on insert
CREATE OR REPLACE FUNCTION notify_new_contact_request()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the new contact request
  RAISE LOG 'New contact request from: % (%) at %', NEW.name, NEW.email, NEW.organization;
  
  -- In production, you could call a webhook here using pg_net extension
  -- For now, we'll just log it and rely on the cron job
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that fires on INSERT
DROP TRIGGER IF EXISTS trigger_new_contact_request ON contact_requests;
CREATE TRIGGER trigger_new_contact_request
  AFTER INSERT ON contact_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_contact_request();

-- Verify the trigger was created
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE event_object_table = 'contact_requests';