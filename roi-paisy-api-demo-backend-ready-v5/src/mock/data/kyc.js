const names = [
  ["Ankit Kushwah", "ankit@example.com"],
  ["Sneha Patel", "sneha@example.com"],
  ["Rohit Tiwari", "rohit@example.com"],
  ["Priya Kumari", "priya@example.com"],
  ["Vikas Singh", "vikas@example.com"],
  ["Neha Sharma", "neha@example.com"],
  ["Amit Raj", "amit@example.com"],
  ["Deepa Singh", "deepa@example.com"],
  ["Sameer Khan", "sameer@example.com"],
  ["Ravi Sharma", "ravi@example.com"],
];

const statuses = ["approved", "pending", "approved", "rejected", "pending", "approved", "approved", "pending", "rejected", "approved"];

export const kyc = names.map(([name, email], index) => ({
  id: `KYC${123456 + index}`,
  userId: `USR${String(index + 1).padStart(3, "0")}`,
  name,
  username: name.toLowerCase().replace(/\s+/g, ""),
  email,
  status: statuses[index],
  verificationId: `KYC${123456 + index}`,
  submittedOn: `2026-09-${String(8 - Math.floor(index / 4)).padStart(2, "0")}T${String(14 - index).padStart(2, "0")}:12:00`,
  verificationDate: index === 0 ? "2026-09-08T14:12:00" : null,
  reviewStatus: statuses[index] === "approved" ? "Approved" : statuses[index] === "rejected" ? "Rejected" : "Pending Review",
  idType: "Government ID",
  user: {
    fullName: name,
    email,
    country: "India",
    phone: "+91 98765 43210",
    address: "123, Green Park, New Delhi, 110016",
    dateOfBirth: "1998-01-12",
    joinedAt: "2026-09-05T10:24:00",
  },
  documents: {
    governmentId: { verified: statuses[index] === "approved" },
    selfie: { verified: statuses[index] === "approved" },
  },
  restrictions: [],
}));

export const kycStats = {
  total: 1248,
  verified: 892,
  pending: 213,
  rejected: 143,
};

export function getKycById(id) {
  return kyc.find((record) => record.id === id || record.verificationId === id);
}
