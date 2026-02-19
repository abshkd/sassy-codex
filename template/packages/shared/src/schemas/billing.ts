import { z } from 'zod';
import { BILLING_PLANS, BILLING_PRODUCTS } from '../constants/billing';

export const checkoutRequestSchema = z
  .object({
    scope: z.enum(['org', 'user']).default('org'),
    orgSlug: z.string().min(1).optional(),
    planCode: z.enum(Object.keys(BILLING_PLANS) as [keyof typeof BILLING_PLANS, ...Array<keyof typeof BILLING_PLANS>]).optional(),
    productCode: z.enum(Object.keys(BILLING_PRODUCTS) as [keyof typeof BILLING_PRODUCTS, ...Array<keyof typeof BILLING_PRODUCTS>]).optional(),
  })
  .refine((payload) => Boolean(payload.planCode) !== Boolean(payload.productCode), {
    message: 'Provide either planCode or productCode',
  });
