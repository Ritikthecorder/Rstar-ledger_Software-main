import { create } from "zustand";

export type OrgRole = "owner" | "staff" | "viewer";

interface OrganizationState {
  organizationId: string | null; // the owner's user id that data is scoped to
  role: OrgRole;
  memberId: string | null; // business_members.id if a member
  setOrganization: (organizationId: string, role: OrgRole, memberId?: string | null) => void;
  reset: () => void;
}

export const useOrganizationStore = create<OrganizationState>((set) => ({
  organizationId: null,
  role: "owner",
  memberId: null,
  setOrganization: (organizationId, role, memberId = null) =>
    set({ organizationId, role, memberId }),
  reset: () => set({ organizationId: null, role: "owner", memberId: null }),
}));