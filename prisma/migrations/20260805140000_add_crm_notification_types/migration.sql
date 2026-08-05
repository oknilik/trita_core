-- CRM emlékeztetők: két új értesítés-típus (lejárt next action, lejáró
-- ajánlat). Additív enum-bővítés a reflection_prompt_type minta szerint.
ALTER TYPE "NotificationType" ADD VALUE 'CRM_NEXT_ACTION_DUE';
ALTER TYPE "NotificationType" ADD VALUE 'CRM_QUOTE_EXPIRING';
