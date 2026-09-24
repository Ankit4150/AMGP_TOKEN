// GET /user/kyc - the signed-in user's own KYC record.
// Fields follow plan Phase 4: KYC status, Verification ID, Verification date,
// Review status, Restrictions. Documents are NOT stored by the platform - the
// KYC/AML provider (still to be selected, plan decision #14) keeps them.
//
// status: "not_started" | "pending" | "approved" | "rejected"
// Change `status` here to preview the other states in demo mode, e.g.
//   { status: "approved", verificationId: "KYC123456", verificationDate: "2026-09-08T14:12:00",
//     reviewStatus: "Approved", restrictions: [] }
export const userKycRecord = {
  status: "not_started",
  verificationId: null,
  verificationDate: null,
  reviewStatus: "Not Submitted",
  restrictions: [],
};
