interface OpsUser {
  id: string;
}

const OPS_ADMIN_USER_IDS = new Set<string>(["user-muneeb-001"]);

export function canAccessOpsHub(user: OpsUser): boolean {
  return OPS_ADMIN_USER_IDS.has(user.id);
}
