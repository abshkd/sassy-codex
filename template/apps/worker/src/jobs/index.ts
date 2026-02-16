import { handleStripeEvent } from './stripe.process_event';
import { handleLoopsEvent } from './loops.send_event';
import { maintenanceCleanup } from './maintenance.cleanup';
export async function registerJobs() { void handleStripeEvent; void handleLoopsEvent; void maintenanceCleanup; }
