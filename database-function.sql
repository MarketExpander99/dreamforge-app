-- Create the missing get_user_category_progress function
-- Run this in your Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.get_user_category_progress(user_id_param UUID)
RETURNS TABLE (
  category TEXT,
  progress INTEGER,
  completed INTEGER,
  total INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.name as category,
    ROUND(
      CASE
        WHEN COUNT(ci.id) = 0 THEN 0
        ELSE (COUNT(CASE WHEN up.status = 'completed' THEN 1 END) * 100.0 / COUNT(ci.id))
      END
    )::INTEGER as progress,
    COUNT(CASE WHEN up.status = 'completed' THEN 1 END)::INTEGER as completed,
    COUNT(ci.id)::INTEGER as total
  FROM categories c
  LEFT JOIN content_items ci ON ci.category_id = c.id
  LEFT JOIN user_progress up ON up.content_id = ci.id AND up.user_id = user_id_param
  GROUP BY c.id, c.name
  ORDER BY c.name;
END;
$$;