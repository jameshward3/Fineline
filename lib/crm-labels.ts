import type { AccountType, ContactRole, OpportunityStage, SampleStatus, ProgramStatus } from "@/app/generated/prisma/enums";

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  SCHOOL_EDUCATION: "School / Education",
  CORPORATE: "Corporate",
  HOSPITALITY: "Hospitality",
  LUXURY_RESIDENTIAL: "Luxury Residential",
  INTERIOR_DESIGNER: "Interior Designer",
  EVENT_WEDDING: "Event / Wedding",
  RETAIL_BRAND: "Retail / Brand",
  CLUB_MEMBERSHIP: "Club / Membership",
  NONPROFIT: "Nonprofit",
  INDIVIDUAL: "Individual",
  FAMILY_HOUSEHOLD: "Family / Household",
};

export const CONTACT_ROLE_LABELS: Record<ContactRole, string> = {
  PRIMARY: "Primary Contact",
  PURCHASING: "Purchasing",
  ACCOUNTS_PAYABLE: "Accounts Payable",
  CREATIVE_BRAND: "Creative / Brand",
  EXECUTIVE_SPONSOR: "Executive Sponsor",
  DEPARTMENT_HEAD: "Department Head",
  OTHER: "Other",
};

export const OPPORTUNITY_STAGE_LABELS: Record<OpportunityStage, string> = {
  INQUIRY: "Inquiry",
  CONSULTATION: "Consultation",
  SAMPLING: "Sampling",
  QUOTE: "Quote",
  APPROVAL: "Approval",
  PROGRAM_ESTABLISHED: "Program Established",
  ORDER: "Order",
};

export const OPPORTUNITY_STAGE_ORDER: OpportunityStage[] = [
  "INQUIRY",
  "CONSULTATION",
  "SAMPLING",
  "QUOTE",
  "APPROVAL",
  "PROGRAM_ESTABLISHED",
  "ORDER",
];

export const SAMPLE_STATUS_LABELS: Record<SampleStatus, string> = {
  REQUESTED: "Requested",
  DELIVERED: "Delivered",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export const PROGRAM_STATUS_LABELS: Record<ProgramStatus, string> = {
  PLANNING: "Planning",
  ACTIVE: "Active",
  INACTIVE: "Inactive",
};
