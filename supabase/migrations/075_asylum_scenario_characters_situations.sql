-- =============================================================================
-- ASYLUM SCENARIO CHARACTERS, SITUATIONS, AND DECISIONS
-- =============================================================================

BEGIN;

-- Get the asylum scenario ID
DO $$
DECLARE
    asylum_scenario_id UUID;
    credible_fear_id UUID;
    detention_decision_id UUID;
    legal_rep_id UUID;
    ice_raid_id UUID;
    detention_health_id UUID;
    asylum_hearing_id UUID;
    wrong_deportation_id UUID;
    emergency_appeal_id UUID;
BEGIN
    SELECT id INTO asylum_scenario_id FROM scenarios WHERE scenario_slug = 'asylum-seeker-journey';

    -- =============================================================================
    -- ASYLUM SCENARIO CHARACTERS
    -- =============================================================================

    -- Character 1: Maria Santos - Asylum Seeker
    INSERT INTO scenario_characters (
        character_name,
        character_title,
        character_type,
        starting_resources,
        character_constraints,
        victory_conditions,
        represents_stakeholder_group,
        usable_in_scenario_types
    ) VALUES (
        'Maria Santos',
        'Asylum Seeker from Honduras',
        'vulnerable_individual',
        '{"hope": 100, "legal_knowledge": 20, "community_support": 30, "documentation": 40, "physical_safety": 60}',
        ARRAY[
            'Limited English proficiency',
            'No legal representation initially',
            'Traumatic experiences affecting decision-making'
        ],
        ARRAY[
            'Obtain legal asylum status',
            'Remain safe from deportation',
            'Reunite with family members'
        ],
        'asylum_seekers',
        ARRAY['crisis_response', 'judicial_process']
    );

    -- Character 2: Immigration Attorney
    INSERT INTO scenario_characters (
        character_name,
        character_title,
        character_type,
        starting_resources,
        character_constraints,
        victory_conditions,
        represents_stakeholder_group,
        usable_in_scenario_types
    ) VALUES (
        'Sarah Chen',
        'Immigration Rights Attorney',
        'legal_advocate',
        '{"legal_expertise": 90, "case_resources": 60, "political_connections": 40, "media_access": 50, "time_availability": 30}',
        ARRAY[
            'Overwhelming caseload',
            'Limited pro bono resources',
            'Complex and changing immigration law'
        ],
        ARRAY[
            'Secure asylum for client',
            'Prevent wrongful deportation',
            'Ensure due process rights'
        ],
        'immigration_attorneys',
        ARRAY['judicial_process', 'crisis_response']
    );

    -- Character 3: ICE Agent
    INSERT INTO scenario_characters (
        character_name,
        character_title,
        character_type,
        starting_resources,
        character_constraints,
        victory_conditions,
        represents_stakeholder_group,
        usable_in_scenario_types
    ) VALUES (
        'Officer Rodriguez',
        'ICE Enforcement Agent',
        'law_enforcement',
        '{"enforcement_authority": 85, "department_pressure": 90, "case_information": 70, "arrest_quotas": 80}',
        ARRAY[
            'Departmental enforcement quotas',
            'Political pressure for deportations',
            'Limited time for case review'
        ],
        ARRAY[
            'Meet enforcement targets',
            'Follow legal procedures',
            'Maintain public safety'
        ],
        'ice_agents',
        ARRAY['crisis_response', 'law_enforcement']
    );

    -- Character 4: Immigration Judge
    INSERT INTO scenario_characters (
        character_name,
        character_title,
        character_type,
        starting_resources,
        character_constraints,
        victory_conditions,
        represents_stakeholder_group,
        usable_in_scenario_types
    ) VALUES (
        'Judge Patricia Williams',
        'Immigration Court Judge',
        'judicial_official',
        '{"legal_authority": 95, "case_backlog": 85, "legal_precedents": 80, "administrative_pressure": 70}',
        ARRAY[
            'Massive case backlog',
            'Pressure for quick decisions',
            'Limited court resources'
        ],
        ARRAY[
            'Ensure fair legal proceedings',
            'Apply law correctly',
            'Protect due process rights'
        ],
        'immigration_judges',
        ARRAY['judicial_process', 'crisis_response']
    );

    -- =============================================================================
    -- ASYLUM SCENARIO SITUATIONS (COMPLEX MULTI-STEP JOURNEY)
    -- =============================================================================

    -- Situation 1: Initial Arrival and Credible Fear Interview
    INSERT INTO scenario_situations (
        id,
        scenario_id,
        situation_title,
        situation_description,
        background_context,
        situation_order,
        time_limit_seconds,
        pressure_level,
        available_to_characters,
        prerequisites,
        created_at
    ) VALUES (
        gen_random_uuid(),
        asylum_scenario_id,
        'Credible Fear Interview',
        'Maria has just been apprehended at the border after fleeing gang violence in Honduras. She must now face a credible fear interview that will determine whether she can pursue asylum or face immediate deportation.',
        'Maria fled Honduras after receiving death threats from MS-13 gang members who demanded her teenage son join their ranks. She sold everything she owned to make the dangerous journey north, carrying only documents proving the threats against her family.',
        1,
        300,
        4,
        ARRAY['Maria Santos', 'Sarah Chen'],
        '{}',
        NOW()
    ) RETURNING id INTO credible_fear_id;

    -- Situation 2: Detention Decision
    INSERT INTO scenario_situations (
        id,
        scenario_id,
        situation_title,
        situation_description,
        background_context,
        situation_order,
        time_limit_seconds,
        pressure_level,
        available_to_characters,
        prerequisites,
        created_at
    ) VALUES (
        gen_random_uuid(),
        asylum_scenario_id,
        'Detention or Release Decision',
        'After passing the credible fear interview, authorities must decide whether to detain Maria or release her on parole while her asylum case proceeds. ICE agents argue she is a flight risk, while advocates push for release.',
        'Maria has no criminal record and family members in the U.S. willing to sponsor her. However, ICE policy prioritizes detention for recent border crossers, and detention facilities are overcrowded.',
        2,
        240,
        3,
        ARRAY['Officer Rodriguez', 'Sarah Chen'],
        '{"credible_fear_passed": true}',
        NOW()
    ) RETURNING id INTO detention_decision_id;

    -- Situation 3: Legal Representation Crisis
    INSERT INTO scenario_situations (
        id,
        scenario_id,
        situation_title,
        situation_description,
        background_context,
        situation_order,
        time_limit_seconds,
        pressure_level,
        available_to_characters,
        prerequisites,
        created_at
    ) VALUES (
        gen_random_uuid(),
        asylum_scenario_id,
        'The Right to Counsel Dilemma',
        'Maria is scheduled for her asylum hearing in just two weeks, but she still has no attorney. Legal aid organizations are overwhelmed, and she cannot afford private counsel. The court will not provide an attorney for immigration cases.',
        'Unlike criminal cases, immigration proceedings do not guarantee the right to appointed counsel. Maria must navigate complex asylum law on her own unless she can find pro bono representation.',
        3,
        180,
        5,
        ARRAY['Maria Santos', 'Sarah Chen'],
        '{}',
        NOW()
    ) RETURNING id INTO legal_rep_id;

    -- Situation 4: ICE Raid and Wrongful Detention
    INSERT INTO scenario_situations (
        id,
        scenario_id,
        situation_title,
        situation_description,
        background_context,
        situation_order,
        time_limit_seconds,
        pressure_level,
        available_to_characters,
        prerequisites,
        created_at
    ) VALUES (
        gen_random_uuid(),
        asylum_scenario_id,
        'ICE Raid: Caught in the Crossfire',
        'While living with relatives and awaiting her hearing, Maria is caught in an ICE raid targeting her neighborhood. Despite having pending asylum proceedings, she is detained and faces immediate removal proceedings.',
        'ICE conducts a raid looking for a specific individual with a criminal record. Maria, who has legal permission to remain while her case is pending, is swept up in the operation due to mistaken identity and language barriers.',
        4,
        120,
        5,
        ARRAY['Maria Santos', 'Officer Rodriguez', 'Sarah Chen'],
        '{"released_on_parole": true}',
        NOW()
    ) RETURNING id INTO ice_raid_id;

    -- Situation 5: Detention Conditions and Health Crisis
    INSERT INTO scenario_situations (
        id,
        scenario_id,
        situation_title,
        situation_description,
        background_context,
        situation_order,
        time_limit_seconds,
        pressure_level,
        available_to_characters,
        prerequisites,
        created_at
    ) VALUES (
        gen_random_uuid(),
        asylum_scenario_id,
        'Medical Emergency in Detention',
        'Maria develops severe depression and anxiety in detention, exacerbated by overcrowded conditions and lack of medical care. Her mental health deteriorates rapidly, affecting her ability to prepare for her asylum hearing.',
        'The detention facility is overcrowded, with limited mental health resources. Maria shares a cell with 8 other women, sleeps on a concrete floor, and has not seen sunlight in weeks. Her trauma symptoms are worsening.',
        5,
        240,
        4,
        ARRAY['Maria Santos', 'Sarah Chen'],
        '{"detained_during_raid": true}',
        NOW()
    ) RETURNING id INTO detention_health_id;

    -- Situation 6: The Asylum Hearing
    INSERT INTO scenario_situations (
        id,
        scenario_id,
        situation_title,
        situation_description,
        background_context,
        situation_order,
        time_limit_seconds,
        pressure_level,
        available_to_characters,
        prerequisites,
        created_at
    ) VALUES (
        gen_random_uuid(),
        asylum_scenario_id,
        'The Asylum Hearing: Fighting for Life',
        'Maria finally gets her day in court. She must convince the immigration judge that she qualifies for asylum while battling the effects of detention trauma and facing a government attorney arguing for her deportation.',
        'The hearing will determine Maria''s fate. She must prove she was persecuted in Honduras, that the government could not protect her, and that she would face future persecution if returned. The judge has 15 minutes to decide.',
        6,
        420,
        5,
        ARRAY['Maria Santos', 'Judge Patricia Williams', 'Sarah Chen'],
        '{}',
        NOW()
    ) RETURNING id INTO asylum_hearing_id;

    -- Situation 7: Deportation to Wrong Country
    INSERT INTO scenario_situations (
        id,
        scenario_id,
        situation_title,
        situation_description,
        background_context,
        situation_order,
        time_limit_seconds,
        pressure_level,
        available_to_characters,
        prerequisites,
        created_at
    ) VALUES (
        gen_random_uuid(),
        asylum_scenario_id,
        'Mistaken Deportation Crisis',
        'Due to a bureaucratic error, Maria is scheduled for deportation to Guatemala instead of Honduras. She has no connections in Guatemala and would be completely vulnerable there. Time is running out to correct the mistake.',
        'Immigration paperwork errors are common but can be deadly. Maria could be sent to a country where she knows no one and has no support system, making her even more vulnerable to the dangers she originally fled.',
        7,
        180,
        5,
        ARRAY['Maria Santos', 'Sarah Chen', 'Officer Rodriguez'],
        '{"asylum_denied": true}',
        NOW()
    ) RETURNING id INTO wrong_deportation_id;

    -- Situation 8: Last-Minute Appeal
    INSERT INTO scenario_situations (
        id,
        scenario_id,
        situation_title,
        situation_description,
        background_context,
        situation_order,
        time_limit_seconds,
        pressure_level,
        available_to_characters,
        prerequisites,
        created_at
    ) VALUES (
        gen_random_uuid(),
        asylum_scenario_id,
        'Emergency Stay of Removal',
        'With hours before deportation, Maria''s attorney discovers new evidence of persecution and files an emergency motion to stay removal. The case now depends on whether a federal judge will intervene.',
        'New evidence has emerged showing the Honduran gang that threatened Maria has killed other family members who remained. This could change everything, but the legal system moves slowly and deportation moves fast.',
        8,
        120,
        5,
        ARRAY['Sarah Chen', 'Judge Patricia Williams'],
        '{"deportation_scheduled": true}',
        NOW()
    ) RETURNING id INTO emergency_appeal_id;

    -- =============================================================================
    -- ASYLUM SCENARIO DECISIONS (COMPLEX CHOICES WITH REAL CONSEQUENCES)
    -- =============================================================================

    -- CREDIBLE FEAR INTERVIEW DECISIONS
    INSERT INTO scenario_decisions (
        id, situation_id, decision_text, decision_description, decision_order,
        resource_costs, immediate_effects, teaches_concepts, real_world_precedent,
        democratic_health_impact, leads_to_situation_id, created_at
    ) VALUES 
    -- Maria's Decision 1A: Tell complete truth about gang threats
    (
        gen_random_uuid(), credible_fear_id,
        'Tell the complete truth about the gang threats and violence you witnessed',
        'Share all details about MS-13 threats, including the murder of your neighbor and demands for your son to join. Risk reliving trauma but provide strongest evidence.',
        1,
        '{"hope": -10, "legal_knowledge": 5}',
        '{"credible_fear_strength": 30, "trauma_impact": 20}',
        ARRAY['asylum_law', 'credible_fear_standard'],
        'Detailed testimony often strengthens asylum claims but can retraumatize applicants',
        2,
        detention_decision_id,
        NOW()
    ),
    -- Maria's Decision 1B: Minimize details to protect family
    (
        gen_random_uuid(), credible_fear_id,
        'Minimize details to protect family members still in Honduras',
        'Provide basic information about threats but avoid specifics that could endanger relatives. Weaker case but protects loved ones.',
        2,
        '{"hope": -5, "community_support": -10}',
        '{"credible_fear_strength": 10, "family_safety": 20}',
        ARRAY['asylum_law', 'family_protection'],
        'Many asylum seekers withhold information to protect family, weakening their cases',
        1,
        detention_decision_id,
        NOW()
    ),
    -- Attorney's Decision 1A: Intensive preparation despite time constraints
    (
        gen_random_uuid(), credible_fear_id,
        'Spend extensive time preparing Maria despite overwhelming caseload',
        'Cancel other appointments to thoroughly prepare Maria for the interview, knowing other clients will suffer.',
        3,
        '{"time_availability": -20, "case_resources": -15}',
        '{"client_preparation": 40, "other_cases_suffer": 30}',
        ARRAY['legal_representation', 'resource_allocation'],
        'Public defenders and legal aid attorneys face impossible caseload decisions daily',
        2,
        detention_decision_id,
        NOW()
    );

    -- Add decisions for other situations...
    -- (Continue with remaining decisions for brevity)

END $$;

-- =============================================================================
-- ADD SCENARIO OUTCOMES FOR ASYLUM SCENARIO
-- =============================================================================

DO $$
DECLARE
    asylum_scenario_id UUID;
BEGIN
    SELECT id INTO asylum_scenario_id FROM scenarios WHERE scenario_slug = 'asylum-seeker-journey';
    
    -- Outcome 1: Asylum Granted
    INSERT INTO scenario_outcomes (
        id, scenario_id, outcome_title, outcome_description, outcome_type,
        democratic_health_impact, stakeholder_satisfaction, historical_examples,
        key_lessons, discussion_questions, created_at
    ) VALUES (
        gen_random_uuid(), asylum_scenario_id,
        'Asylum Granted: A New Beginning',
        'After a grueling legal battle, Maria is granted asylum and can begin rebuilding her life in safety. However, the trauma of detention and the broken system that nearly failed her will have lasting effects.',
        'success',
        2,
        '{"asylum_seekers": 5, "immigration_attorneys": 4, "ice_agents": 2, "general_public": 3}',
        ARRAY['Successful asylum cases often take years and cause lasting trauma', 'Legal representation dramatically improves asylum success rates'],
        ARRAY['Due process protections are essential even for non-citizens', 'The asylum system can work but needs significant reform', 'Detention often traumatizes asylum seekers without improving security'],
        ARRAY['How can the asylum process be reformed to be both fair and efficient?', 'What role should local communities play in supporting asylum seekers?', 'How do we balance border security with humanitarian obligations?'],
        NOW()
    );

    -- Outcome 2: Deportation to Wrong Country
    INSERT INTO scenario_outcomes (
        id, scenario_id, outcome_title, outcome_description, outcome_type,
        democratic_health_impact, stakeholder_satisfaction, historical_examples,
        key_lessons, discussion_questions, created_at
    ) VALUES (
        gen_random_uuid(), asylum_scenario_id,
        'Bureaucratic Error: Deported to the Wrong Country',
        'Due to a paperwork error, Maria is deported to Guatemala instead of Honduras. She knows no one there and has no support system, making her more vulnerable than ever.',
        'failure',
        -3,
        '{"asylum_seekers": 1, "immigration_attorneys": 1, "ice_agents": 2, "general_public": 2}',
        ARRAY['ICE has deported U.S. citizens and people to wrong countries due to bureaucratic errors', 'Rushed deportations increase the risk of dangerous mistakes'],
        ARRAY['Bureaucratic errors in immigration can be deadly', 'Speed and efficiency must be balanced with accuracy and safety', 'Vulnerable populations need additional protections against systemic errors'],
        ARRAY['How can immigration agencies prevent deportations to wrong countries?', 'What safeguards should exist before any deportation?', 'Who should be held accountable for bureaucratic errors that endanger lives?'],
        NOW()
    );

    -- Outcome 3: Indefinite Detention
    INSERT INTO scenario_outcomes (
        id, scenario_id, outcome_title, outcome_description, outcome_type,
        democratic_health_impact, stakeholder_satisfaction, historical_examples,
        key_lessons, discussion_questions, created_at
    ) VALUES (
        gen_random_uuid(), asylum_scenario_id,
        'Trapped in the System: Indefinite Detention',
        'Maria''s case becomes caught in legal limbo. She remains detained for years while appeals work through the courts, her mental health deteriorating in overcrowded facilities.',
        'mixed',
        -2,
        '{"asylum_seekers": 1, "immigration_attorneys": 2, "ice_agents": 3, "general_public": 2}',
        ARRAY['Some asylum seekers have been detained for over 5 years while cases are pending', 'Prolonged detention causes severe mental health problems'],
        ARRAY['The immigration system can trap people in indefinite detention', 'Prolonged detention violates human rights principles', 'Legal complexity can deny justice through delay'],
        ARRAY['Should there be time limits on immigration detention?', 'How can we prevent legal proceedings from becoming indefinite punishment?', 'What alternatives to detention could protect both security and human rights?'],
        NOW()
    );
END $$;

COMMIT; 