-- Foreign Key Indexes Migration - Part 3
-- Figure, Friend, and Gift related indexes
-- Generated: 2024-12-19

BEGIN;

-- Figure Quiz Topics
CREATE INDEX IF NOT EXISTS idx_figure_quiz_topics_primary_figure_id 
ON public.figure_quiz_topics(primary_figure_id);

CREATE INDEX IF NOT EXISTS idx_figure_quiz_topics_topic_id 
ON public.figure_quiz_topics(topic_id);

-- Friend Requests
CREATE INDEX IF NOT EXISTS idx_friend_requests_approved_by 
ON public.friend_requests(approved_by);

CREATE INDEX IF NOT EXISTS idx_friend_requests_pod_id 
ON public.friend_requests(pod_id);

-- Gift Redemptions
CREATE INDEX IF NOT EXISTS idx_gift_redemptions_gift_credit_id 
ON public.gift_redemptions(gift_credit_id);

CREATE INDEX IF NOT EXISTS idx_gift_redemptions_recipient_user_id 
ON public.gift_redemptions(recipient_user_id);

-- Image AB Test Results
CREATE INDEX IF NOT EXISTS idx_image_ab_test_results_image_id 
ON public.image_ab_test_results(image_id);

CREATE INDEX IF NOT EXISTS idx_image_ab_test_results_user_id 
ON public.image_ab_test_results(user_id);

COMMIT; 