UPDATE "Notification"
SET "link" = replace(
  "link",
  '?tab=members',
  '?tab=feedback&feedbackView=inbox'
)
WHERE "type" IN (
  'PEER_KUDOS_RECEIVED',
  'PEER_FEEDBACK_REQUESTED',
  'PEER_FEEDBACK_RESPONSE'
)
AND "link" LIKE '/team/%?tab=members%';
