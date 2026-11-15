import { useOrganizationStore } from "@/store/organization";

export function usePermissions() {
  const role = useOrganizationStore((s) => s.role);
  return {
    role,
    isOwner: role === "owner",
    isStaff: role === "staff",
    isViewer: role === "viewer",
    canRead: true,
    canWrite: role === "owner" || role === "staff", // create/edit entries & customers
    canDelete: role === "owner", // only owner can delete
    canManageTeam: role === "owner",
  };
}