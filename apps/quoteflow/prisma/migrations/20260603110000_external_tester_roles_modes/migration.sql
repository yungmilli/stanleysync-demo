ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SYSTEM_OWNER';
UPDATE "BusinessWorkspace" SET "businessName" = 'StanleySync App', "industry" = 'General business operations', "serviceCategories" = '["Quotes","Customers","Jobs","Invoices","PDFs"]'::jsonb, "logoPlaceholder" = 'APP' WHERE "workspaceKey" = 'general-service-demo';
UPDATE "BusinessWorkspace" SET "businessName" = 'StanleySync Demo', "industry" = 'Demo environment', "serviceCategories" = '["Demo quotes","Demo jobs","Demo invoices","PDF exports"]'::jsonb, "logoPlaceholder" = 'DEM' WHERE "workspaceKey" = 'auto-repair-demo';
UPDATE "BusinessWorkspace" SET "businessName" = 'StanleySync Labs', "industry" = 'Calibration lab module - Pro', "logoPlaceholder" = 'LAB' WHERE "workspaceKey" = 'calibration-lab-demo';
