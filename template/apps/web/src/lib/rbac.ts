export type OrgRole = 'owner'|'admin'|'member';
export function ensureRole(current: OrgRole, required: OrgRole) { const order = { member:1, admin:2, owner:3 } as const; if (order[current] < order[required]) throw new Error('forbidden'); }
