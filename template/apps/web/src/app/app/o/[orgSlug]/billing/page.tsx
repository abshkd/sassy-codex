'use client';

import { useState } from 'react';
import { BILLING_PLANS, BILLING_PRODUCTS } from '@saas/shared';

type BillingClientProps = {
  orgSlug: string;
};

function BillingClient({ orgSlug }: BillingClientProps) {
  const [loadingCode, setLoadingCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout(payload: { planCode?: string; productCode?: string }) {
    setError(null);
    const code = payload.planCode ?? payload.productCode ?? null;
    setLoadingCode(code);

    const response = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ scope: 'org', orgSlug, ...payload }),
    });

    const data = (await response.json()) as { checkoutUrl?: string; error?: string };
    if (!response.ok || !data.checkoutUrl) {
      setError(data.error ?? 'Unable to start checkout');
      setLoadingCode(null);
      return;
    }

    window.location.assign(data.checkoutUrl);
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Billing</h1>
      <p>Enable Stripe pricing IDs to activate checkout for subscriptions and one-time purchases.</p>
      {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}

      <h2>Subscriptions</h2>
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        {Object.values(BILLING_PLANS).map((plan) => (
          <article key={plan.code} style={{ border: '1px solid #ddd', padding: 16, borderRadius: 8 }}>
            <h3>{plan.name}</h3>
            <ul>
              {plan.placeholderFeatures.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            <button
              type="button"
              disabled={plan.code === 'FREE' || loadingCode === plan.code}
              onClick={() => startCheckout({ planCode: plan.code })}
            >
              {plan.code === 'FREE' ? 'Current default plan' : loadingCode === plan.code ? 'Loading…' : `Choose ${plan.name}`}
            </button>
          </article>
        ))}
      </div>

      <h2 style={{ marginTop: 24 }}>One-time purchases</h2>
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        {Object.values(BILLING_PRODUCTS).map((product) => (
          <article key={product.code} style={{ border: '1px solid #ddd', padding: 16, borderRadius: 8 }}>
            <h3>{product.name}</h3>
            <ul>
              {product.placeholderFeatures.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            <button
              type="button"
              disabled={loadingCode === product.code}
              onClick={() => startCheckout({ productCode: product.code })}
            >
              {loadingCode === product.code ? 'Loading…' : `Buy ${product.name}`}
            </button>
          </article>
        ))}
      </div>
    </main>
  );
}

export default async function BillingPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  return <BillingClient orgSlug={orgSlug} />;
}
