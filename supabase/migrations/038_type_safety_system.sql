-- =============================================================================
-- COMPREHENSIVE TYPE SAFETY SYSTEM
-- =============================================================================
-- This migration creates a comprehensive system to detect and prevent 
-- type mismatches between database functions and table schemas.
-- This will help prevent future PostgreSQL "structure of query does not 
-- match function result type" errors.

BEGIN;

-- =============================================================================
-- TYPE VALIDATION FUNCTIONS
-- =============================================================================

-- Function to get detailed column information for a table
CREATE OR REPLACE FUNCTION get_table_column_info(table_name_param TEXT)
RETURNS TABLE(
  column_name TEXT,
  data_type TEXT,
  character_maximum_length INTEGER,
  is_nullable TEXT,
  column_default TEXT,
  ordinal_position INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.column_name::TEXT,
    c.data_type::TEXT,
    c.character_maximum_length::INTEGER,
    c.is_nullable::TEXT,
    c.column_default::TEXT,
    c.ordinal_position::INTEGER
  FROM information_schema.columns c
  WHERE c.table_name = table_name_param
  AND c.table_schema = 'public'
  ORDER BY c.ordinal_position;
END;
$$ LANGUAGE plpgsql;

-- Function to get function return type information
CREATE OR REPLACE FUNCTION get_function_return_info(function_name_param TEXT)
RETURNS TABLE(
  parameter_name TEXT,
  data_type TEXT,
  ordinal_position INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.parameter_name::TEXT,
    p.data_type::TEXT,
    p.ordinal_position::INTEGER
  FROM information_schema.parameters p
  WHERE p.specific_name IN (
    SELECT r.specific_name 
    FROM information_schema.routines r 
    WHERE r.routine_name = function_name_param
    AND r.routine_schema = 'public'
  )
  AND p.parameter_mode = 'OUT'
  ORDER BY p.ordinal_position;
END;
$$ LANGUAGE plpgsql;

-- Comprehensive type comparison function
CREATE OR REPLACE FUNCTION validate_function_table_types(
  function_name_param TEXT,
  table_name_param TEXT
)
RETURNS TABLE(
  column_position INTEGER,
  table_column_name TEXT,
  table_data_type TEXT,
  function_parameter_name TEXT,
  function_data_type TEXT,
  types_match BOOLEAN,
  mismatch_details TEXT
) AS $$
DECLARE
  table_info RECORD;
  function_info RECORD;
  pos INTEGER := 1;
BEGIN
  -- Compare each column/parameter pair
  FOR table_info IN 
    SELECT * FROM get_table_column_info(table_name_param)
  LOOP
    -- Get corresponding function parameter
    SELECT * INTO function_info
    FROM get_function_return_info(function_name_param)
    WHERE ordinal_position = pos;
    
    IF function_info IS NULL THEN
      -- Function has fewer return columns than table has columns
      RETURN QUERY SELECT 
        pos,
        table_info.column_name,
        table_info.data_type,
        NULL::TEXT,
        NULL::TEXT,
        FALSE,
        'Function missing return parameter for table column'::TEXT;
    ELSE
      -- Compare types
      DECLARE
        types_equal BOOLEAN := FALSE;
        details TEXT := '';
      BEGIN
        -- Handle VARCHAR vs TEXT differences
        IF (table_info.data_type = 'character varying' AND function_info.data_type = 'text') THEN
          types_equal := FALSE;
          details := format('Table has VARCHAR(%s) but function returns TEXT', table_info.character_maximum_length);
        ELSIF (table_info.data_type = 'text' AND function_info.data_type = 'character varying') THEN
          types_equal := FALSE;
          details := 'Table has TEXT but function returns VARCHAR';
        ELSIF table_info.data_type = function_info.data_type THEN
          types_equal := TRUE;
          details := 'Types match exactly';
        ELSE
          types_equal := FALSE;
          details := format('Type mismatch: table=%s, function=%s', table_info.data_type, function_info.data_type);
        END IF;
        
        RETURN QUERY SELECT 
          pos,
          table_info.column_name,
          CASE 
            WHEN table_info.data_type = 'character varying' THEN 
              format('VARCHAR(%s)', table_info.character_maximum_length)
            ELSE table_info.data_type
          END,
          function_info.parameter_name,
          function_info.data_type,
          types_equal,
          details;
      END;
    END IF;
    
    pos := pos + 1;
  END LOOP;
  
  -- Check if function has more parameters than table has columns
  FOR function_info IN 
    SELECT * FROM get_function_return_info(function_name_param)
    WHERE ordinal_position > (SELECT COUNT(*) FROM get_table_column_info(table_name_param))
  LOOP
    RETURN QUERY SELECT 
      function_info.ordinal_position,
      NULL::TEXT,
      NULL::TEXT,
      function_info.parameter_name,
      function_info.data_type,
      FALSE,
      'Function has extra return parameter not in table'::TEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- VALIDATION VIEWS
-- =============================================================================

-- View to check create_multiplayer_room function against multiplayer_rooms table
CREATE OR REPLACE VIEW multiplayer_room_function_validation AS
SELECT * FROM validate_function_table_types('create_multiplayer_room', 'multiplayer_rooms');

-- General validation summary view
CREATE OR REPLACE VIEW function_validation_summary AS
SELECT 
  'create_multiplayer_room vs multiplayer_rooms' as validation_target,
  COUNT(*) as total_columns,
  COUNT(*) FILTER (WHERE types_match = TRUE) as matching_columns,
  COUNT(*) FILTER (WHERE types_match = FALSE) as mismatched_columns,
  CASE 
    WHEN COUNT(*) FILTER (WHERE types_match = FALSE) = 0 THEN 'PASS'
    ELSE 'FAIL'
  END as validation_status
FROM multiplayer_room_function_validation;

-- =============================================================================
-- AUTOMATED TYPE MISMATCH DETECTION
-- =============================================================================

-- Function to automatically detect all type mismatches in the database
CREATE OR REPLACE FUNCTION detect_all_type_mismatches()
RETURNS TABLE(
  function_name TEXT,
  table_name TEXT,
  mismatch_count INTEGER,
  mismatch_details TEXT[]
) AS $$
DECLARE
  func_record RECORD;
  table_record RECORD;
  mismatch_count INTEGER;
  mismatch_array TEXT[];
  validation_record RECORD;
BEGIN
  -- Check known function-table pairs
  -- You can extend this list as you add more functions
  
  -- Check create_multiplayer_room vs multiplayer_rooms
  mismatch_count := 0;
  mismatch_array := ARRAY[]::TEXT[];
  
  FOR validation_record IN 
    SELECT * FROM validate_function_table_types('create_multiplayer_room', 'multiplayer_rooms')
    WHERE types_match = FALSE
  LOOP
    mismatch_count := mismatch_count + 1;
    mismatch_array := array_append(mismatch_array, 
      format('Column %s: %s', validation_record.column_position, validation_record.mismatch_details)
    );
  END LOOP;
  
  IF mismatch_count > 0 THEN
    RETURN QUERY SELECT 
      'create_multiplayer_room'::TEXT,
      'multiplayer_rooms'::TEXT,
      mismatch_count,
      mismatch_array;
  END IF;
  
  -- Add more function-table validations here as needed
  -- Example:
  -- FOR validation_record IN 
  --   SELECT * FROM validate_function_table_types('another_function', 'another_table')
  --   WHERE types_match = FALSE
  -- LOOP
  --   ...
  -- END LOOP;
  
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- MIGRATION VALIDATION HELPER
-- =============================================================================

-- Function to validate a migration before applying it
CREATE OR REPLACE FUNCTION validate_migration_safety()
RETURNS TABLE(
  check_name TEXT,
  status TEXT,
  details TEXT
) AS $$
BEGIN
  -- Check for type mismatches
  RETURN QUERY
  SELECT 
    'Type Mismatch Check'::TEXT,
    CASE 
      WHEN EXISTS (SELECT 1 FROM detect_all_type_mismatches()) THEN 'FAIL'
      ELSE 'PASS'
    END,
    CASE 
      WHEN EXISTS (SELECT 1 FROM detect_all_type_mismatches()) THEN 
        'Type mismatches detected - see detect_all_type_mismatches() for details'
      ELSE 'No type mismatches detected'
    END;
  
  -- Check for function conflicts
  RETURN QUERY
  SELECT 
    'Function Conflict Check'::TEXT,
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM pg_proc p1, pg_proc p2 
        WHERE p1.proname = p2.proname 
        AND p1.oid != p2.oid 
        AND p1.proname = 'create_multiplayer_room'
      ) THEN 'FAIL'
      ELSE 'PASS'
    END,
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM pg_proc p1, pg_proc p2 
        WHERE p1.proname = p2.proname 
        AND p1.oid != p2.oid 
        AND p1.proname = 'create_multiplayer_room'
      ) THEN 'Function overload conflicts detected'
      ELSE 'No function conflicts detected'
    END;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TESTING AND VALIDATION
-- =============================================================================

-- Test the type safety system
DO $$
DECLARE
  validation_result RECORD;
  mismatch_result RECORD;
  safety_result RECORD;
BEGIN
  RAISE NOTICE '=== TYPE SAFETY SYSTEM VALIDATION ===';
  
  -- Test function validation
  RAISE NOTICE 'Testing function-table type validation...';
  
  FOR validation_result IN 
    SELECT * FROM multiplayer_room_function_validation
  LOOP
    IF validation_result.types_match THEN
      RAISE NOTICE 'Column %: % ✓', validation_result.column_position, validation_result.mismatch_details;
    ELSE
      RAISE WARNING 'Column %: % ❌', validation_result.column_position, validation_result.mismatch_details;
    END IF;
  END LOOP;
  
  -- Test mismatch detection
  RAISE NOTICE 'Testing automatic mismatch detection...';
  
  FOR mismatch_result IN 
    SELECT * FROM detect_all_type_mismatches()
  LOOP
    RAISE WARNING 'MISMATCH: % vs % has % issues: %', 
      mismatch_result.function_name, 
      mismatch_result.table_name,
      mismatch_result.mismatch_count,
      array_to_string(mismatch_result.mismatch_details, '; ');
  END LOOP;
  
  -- Test migration safety
  RAISE NOTICE 'Testing migration safety validation...';
  
  FOR safety_result IN 
    SELECT * FROM validate_migration_safety()
  LOOP
    IF safety_result.status = 'PASS' THEN
      RAISE NOTICE '% ✓: %', safety_result.check_name, safety_result.details;
    ELSE
      RAISE WARNING '% ❌: %', safety_result.check_name, safety_result.details;
    END IF;
  END LOOP;
  
  RAISE NOTICE '=== TYPE SAFETY SYSTEM VALIDATION COMPLETE ===';
END $$;

COMMIT;

-- =============================================================================
-- USAGE DOCUMENTATION
-- =============================================================================

COMMENT ON FUNCTION validate_function_table_types IS 'Validates that a function return types exactly match table column types';
COMMENT ON FUNCTION detect_all_type_mismatches IS 'Automatically detects all type mismatches between functions and tables';
COMMENT ON FUNCTION validate_migration_safety IS 'Validates that migrations are safe to apply';
COMMENT ON VIEW multiplayer_room_function_validation IS 'Shows type validation for create_multiplayer_room function';
COMMENT ON VIEW function_validation_summary IS 'Summary of function validation status';

-- =============================================================================
-- FUTURE USAGE INSTRUCTIONS
-- =============================================================================
-- 
-- Before creating new functions that return table data:
-- 1. Run: SELECT * FROM get_table_column_info('your_table_name');
-- 2. Ensure function return types match exactly (including VARCHAR lengths)
-- 3. After creating function, run: SELECT * FROM validate_function_table_types('your_function', 'your_table');
-- 4. Before applying migrations, run: SELECT * FROM validate_migration_safety();
-- 
-- Common commands:
-- - Check current status: SELECT * FROM function_validation_summary;
-- - Find all mismatches: SELECT * FROM detect_all_type_mismatches();
-- - Validate specific function: SELECT * FROM validate_function_table_types('func_name', 'table_name');
-- ============================================================================= 