export type OrgRole = 'owner' | 'admin' | 'member';

const roleOrder: Record<OrgRole, number> = {
  member: 1,
  admin: 2,
  owner: 3,
};

export function ensureRole(current: OrgRole, required: OrgRole) {
  if (roleOrder[current] < roleOrder[required]) {
    throw new Error('forbidden');
  }
}
