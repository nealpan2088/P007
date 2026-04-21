-- 临时解决方案：将表移回public schema
ALTER TABLE p007_public."User" SET SCHEMA public;
ALTER TABLE p007_public."Tenant" SET SCHEMA public;
ALTER TABLE p007_public."UserTenant" SET SCHEMA public;
ALTER TABLE p007_public."Session" SET SCHEMA public;
ALTER TABLE p007_public."_prisma_migrations" SET SCHEMA public;

-- 删除p007_public schema
DROP SCHEMA p007_public CASCADE;
