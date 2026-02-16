export async function handleStripeEvent(stripeEventId = 'dev') { console.log(JSON.stringify({ job:'stripe.process_event', stripeEventId })); }
