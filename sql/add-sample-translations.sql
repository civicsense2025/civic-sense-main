-- Sample SQL script for adding translations to CivicSense topics
-- This demonstrates how to use the helper functions from migration 043_add_jsonb_translations.sql

-- Example 1: Add Spanish translations to a constitutional rights topic
UPDATE question_topics 
SET translations = jsonb_build_object(
  'topic_title', jsonb_build_object(
    'es', jsonb_build_object(
      'text', 'Derechos Constitucionales',
      'lastUpdated', NOW(),
      'autoTranslated', true
    )
  ),
  'description', jsonb_build_object(
    'es', jsonb_build_object(
      'text', 'Aprende sobre los derechos fundamentales protegidos por la Constitución de EE.UU.',
      'lastUpdated', NOW(),
      'autoTranslated', true
    )
  ),
  'why_this_matters', jsonb_build_object(
    'es', jsonb_build_object(
      'text', '<p>Entender tus derechos constitucionales es fundamental para la participación democrática. Cuando conoces tus derechos, puedes ejercerlos efectivamente y defender la democracia.</p>',
      'lastUpdated', NOW(),
      'autoTranslated', true
    )
  )
)
WHERE topic_id = 'constitutional-rights';

-- Example 2: Add French translations using the helper function
UPDATE question_topics 
SET translations = set_translation(
  COALESCE(translations, '{}'),
  'topic_title', 
  'fr', 
  'Droits Constitutionnels',
  true
)
WHERE topic_id = 'constitutional-rights';

-- Example 3: Add multiple language translations to a voting rights topic
UPDATE question_topics 
SET translations = jsonb_build_object(
  'topic_title', jsonb_build_object(
    'es', jsonb_build_object(
      'text', 'Derechos de Voto',
      'lastUpdated', NOW(),
      'autoTranslated', true
    ),
    'fr', jsonb_build_object(
      'text', 'Droits de Vote',
      'lastUpdated', NOW(),
      'autoTranslated', true
    ),
    'de', jsonb_build_object(
      'text', 'Wahlrechte',
      'lastUpdated', NOW(),
      'autoTranslated', true
    )
  ),
  'description', jsonb_build_object(
    'es', jsonb_build_object(
      'text', 'Descubre cómo funciona el sistema electoral y cómo proteger tu derecho al voto.',
      'lastUpdated', NOW(),
      'autoTranslated', true
    ),
    'fr', jsonb_build_object(
      'text', 'Découvrez comment fonctionne le système électoral et comment protéger votre droit de vote.',
      'lastUpdated', NOW(),
      'autoTranslated', true
    ),
    'de', jsonb_build_object(
      'text', 'Erfahren Sie, wie das Wahlsystem funktioniert und wie Sie Ihr Wahlrecht schützen können.',
      'lastUpdated', NOW(),
      'autoTranslated', true
    )
  )
)
WHERE topic_id = 'voting-rights';

-- Example 4: Add translations to questions table
UPDATE questions 
SET translations = jsonb_build_object(
  'question', jsonb_build_object(
    'es', jsonb_build_object(
      'text', '¿Cuál enmienda garantiza la libertad de expresión?',
      'lastUpdated', NOW(),
      'autoTranslated', true
    ),
    'fr', jsonb_build_object(
      'text', 'Quel amendement garantit la liberté d''expression?',
      'lastUpdated', NOW(),
      'autoTranslated', true
    )
  ),
  'explanation', jsonb_build_object(
    'es', jsonb_build_object(
      'text', 'La Primera Enmienda protege la libertad de expresión, religión, prensa y asamblea.',
      'lastUpdated', NOW(),
      'autoTranslated', true
    ),
    'fr', jsonb_build_object(
      'text', 'Le Premier Amendement protège la liberté d''expression, de religion, de presse et d''assemblée.',
      'lastUpdated', NOW(),
      'autoTranslated', true
    )
  )
)
WHERE topic_id = 'constitutional-rights' 
  AND question_number = 1;

-- Example 5: Query to check available languages for a topic
SELECT 
  topic_id,
  topic_title,
  (
    SELECT ARRAY(
      SELECT DISTINCT jsonb_object_keys(field_translations)
      FROM jsonb_each(translations) AS field(field_name, field_translations)
      WHERE jsonb_typeof(field_translations) = 'object'
    )
  ) AS available_languages
FROM question_topics 
WHERE topic_id = 'constitutional-rights';

-- Example 6: Query to get translated content using helper function
SELECT 
  topic_id,
  topic_title AS original_title,
  get_translation(translations, 'topic_title', 'es') AS spanish_title,
  get_translation(translations, 'topic_title', 'fr') AS french_title
FROM question_topics 
WHERE translations IS NOT NULL;

-- Example 7: Bulk add English content as default translations
UPDATE question_topics 
SET translations = COALESCE(translations, '{}') || jsonb_build_object(
  'topic_title', jsonb_build_object(
    'en', jsonb_build_object(
      'text', topic_title,
      'lastUpdated', NOW(),
      'autoTranslated', false
    )
  ),
  'description', jsonb_build_object(
    'en', jsonb_build_object(
      'text', description,
      'lastUpdated', NOW(),
      'autoTranslated', false
    )
  )
)
WHERE translations IS NULL OR NOT translations ? 'topic_title';

-- Example 8: Clean up invalid translations (validation)
SELECT 
  topic_id,
  validate_translation_structure(translations) AS is_valid
FROM question_topics 
WHERE translations IS NOT NULL;

-- Example 9: Find topics that need translation to Spanish
SELECT 
  topic_id,
  topic_title,
  CASE 
    WHEN get_translation(translations, 'topic_title', 'es') IS NULL 
    THEN 'Needs Spanish translation'
    ELSE 'Already translated'
  END AS translation_status
FROM question_topics 
WHERE topic_title IS NOT NULL;

-- Example 10: Update translation metadata
UPDATE question_topics 
SET translations = jsonb_set(
  translations,
  '{topic_title,es,lastUpdated}',
  to_jsonb(NOW()::text)
)
WHERE get_translation(translations, 'topic_title', 'es') IS NOT NULL; 