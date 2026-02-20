CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE "User" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "clerkUserId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Org" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "clerkOrgId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Org_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrgMember" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "orgId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "clerkOrgMembershipId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  CONSTRAINT "OrgMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Subscription" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "scope" TEXT NOT NULL,
  "orgId" TEXT,
  "userId" TEXT,
  "stripeCustomerId" TEXT,
  "stripeSubscriptionId" TEXT,
  "stripePriceId" TEXT,
  "status" TEXT NOT NULL,
  "plan" TEXT NOT NULL,
  "currentPeriodEnd" TIMESTAMP(3),
  "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
  "metadataJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Purchase" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "scope" TEXT NOT NULL,
  "orgId" TEXT,
  "userId" TEXT,
  "stripeCustomerId" TEXT,
  "stripeCheckoutSessionId" TEXT,
  "stripePaymentIntentId" TEXT,
  "stripeInvoiceId" TEXT,
  "productCode" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "amountSubtotal" INTEGER,
  "amountTotal" INTEGER,
  "currency" TEXT,
  "metadataJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StripeEvent" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "stripeEventId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "payloadJson" JSONB NOT NULL,
  "processedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StripeEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClerkEvent" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "clerkEventId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ClerkEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EmailEvent" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "eventName" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "orgId" TEXT,
  "userId" TEXT,
  "payloadJson" JSONB NOT NULL,
  "status" TEXT NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmailEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_clerkUserId_key" ON "User"("clerkUserId");
CREATE UNIQUE INDEX "Org_clerkOrgId_key" ON "Org"("clerkOrgId");
CREATE UNIQUE INDEX "Org_slug_key" ON "Org"("slug");
CREATE UNIQUE INDEX "OrgMember_clerkOrgMembershipId_key" ON "OrgMember"("clerkOrgMembershipId");
CREATE UNIQUE INDEX "OrgMember_orgId_userId_key" ON "OrgMember"("orgId", "userId");
CREATE UNIQUE INDEX "Subscription_stripeCustomerId_key" ON "Subscription"("stripeCustomerId");
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");
CREATE INDEX "Subscription_orgId_idx" ON "Subscription"("orgId");
CREATE INDEX "Subscription_userId_idx" ON "Subscription"("userId");
CREATE UNIQUE INDEX "Purchase_stripeCheckoutSessionId_key" ON "Purchase"("stripeCheckoutSessionId");
CREATE UNIQUE INDEX "Purchase_stripePaymentIntentId_key" ON "Purchase"("stripePaymentIntentId");
CREATE UNIQUE INDEX "Purchase_stripeInvoiceId_key" ON "Purchase"("stripeInvoiceId");
CREATE INDEX "Purchase_orgId_idx" ON "Purchase"("orgId");
CREATE INDEX "Purchase_userId_idx" ON "Purchase"("userId");
CREATE UNIQUE INDEX "StripeEvent_stripeEventId_key" ON "StripeEvent"("stripeEventId");
CREATE UNIQUE INDEX "ClerkEvent_clerkEventId_key" ON "ClerkEvent"("clerkEventId");

ALTER TABLE "OrgMember" ADD CONSTRAINT "OrgMember_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrgMember" ADD CONSTRAINT "OrgMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
