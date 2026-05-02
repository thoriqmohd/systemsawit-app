export type Role = "Super Admin" | "Estate Owner" | "Plantation Supervisor" | "Worker" | "Lorry Driver" | "Weighbridge Operator" | "Finance Officer";
export type CollectionStatus = "Draft" | "Collected" | "Delivered" | "Graded" | "Approved" | "Paid";
export type Grade = "Pending" | "A" | "B" | "C" | "Reject";
export type PaymentStatus = "Pending" | "Processing" | "Paid";

export type Estate = {
  id: string;
  name: string;
  owner: string;
  state: string;
  district: string;
  supervisor: string;
  status: "Excellent" | "Watchlist" | "New";
  hectares: number;
  palmAge: number;
  blocks: string[];
  monthlyYield: number;
  productivity: number;
  location: string;
};

export type Worker = {
  id: string;
  name: string;
  role: "Mandor" | "Harvester" | "Field Clerk" | "Sprayer" | "Driver";
  estateId: string;
  block: string;
  phone: string;
  attendance: "Present" | "Late" | "Absent" | "Leave";
  collections: number;
  earnings: number;
  status: "Active" | "On Leave" | "Inactive";
};

export type Lorry = {
  id: string;
  plateNo: string;
  driver: string;
  status: "Available" | "On Trip" | "Maintenance";
  trips: number;
  deliveredKg: number;
  fuelCost: number;
};

export type CollectionRecord = {
  id: string;
  estateId: string;
  block: string;
  workerId: string;
  team: string;
  date: string;
  lorryId: string;
  centre: string;
  bunchCount: number;
  estimatedWeight: number;
  actualWeight: number;
  grossWeight: number;
  tareWeight: number;
  grade: Grade;
  deductionPercent: number;
  moisturePercent: number;
  dirtPercent: number;
  rate: number;
  status: CollectionStatus;
  photo: string;
  remarks: string;
};

export type Activity = {
  id: string;
  title: string;
  detail: string;
  time: string;
  tone: "green" | "amber" | "red" | "blue";
};

export type AppState = {
  estates: Estate[];
  workers: Worker[];
  lorries: Lorry[];
  collections: CollectionRecord[];
  activities: Activity[];
};

export const demoAccounts: Array<{ role: Role; email: string; password: string; accent: string }> = [
  { role: "Super Admin", email: "admin@sistemsawit.com", password: "demo123", accent: "Platform control" },
  { role: "Estate Owner", email: "owner@serimurni.my", password: "demo123", accent: "Company overview" },
  { role: "Plantation Supervisor", email: "supervisor@sistemsawit.com", password: "demo123", accent: "Field operations" },
  { role: "Worker", email: "worker@sistemsawit.com", password: "demo123", accent: "Daily task view" },
  { role: "Lorry Driver", email: "driver@sistemsawit.com", password: "demo123", accent: "Trip assignments" },
  { role: "Weighbridge Operator", email: "weighbridge@sistemsawit.com", password: "demo123", accent: "Grading and receipts" },
  { role: "Finance Officer", email: "finance@sistemsawit.com", password: "demo123", accent: "Payments and billing" }
];

export const initialState: AppState = {
  estates: [
    { id: "est-1", name: "Seri Murni Estate", owner: "Murni Agro Sdn Bhd", state: "Johor", district: "Kluang", supervisor: "Amin Abdullah", status: "Excellent", hectares: 842, palmAge: 8, blocks: ["B12", "B13", "C04"], monthlyYield: 128430, productivity: 24.8, location: "2.0301, 103.3184" },
    { id: "est-2", name: "Bukit Aman Plantation", owner: "Sawit Aman Holdings", state: "Pahang", district: "Maran", supervisor: "Nor Salmah", status: "Watchlist", hectares: 560, palmAge: 12, blocks: ["A08", "A09", "D01"], monthlyYield: 86300, productivity: 18.2, location: "3.8077, 102.5421" },
    { id: "est-3", name: "Ladang Sungai Bayu", owner: "Bayu Palm Ventures", state: "Sabah", district: "Lahad Datu", supervisor: "James Lau", status: "New", hectares: 410, palmAge: 5, blocks: ["S01", "S02"], monthlyYield: 59210, productivity: 21.6, location: "5.0221, 118.3281" }
  ],
  workers: [
    { id: "wrk-1", name: "Ravi Kumar", role: "Harvester", estateId: "est-1", block: "B12", phone: "011-234 7781", attendance: "Present", collections: 42, earnings: 3820, status: "Active" },
    { id: "wrk-2", name: "Amin Abdullah", role: "Mandor", estateId: "est-1", block: "B13", phone: "012-555 0198", attendance: "Present", collections: 38, earnings: 4210, status: "Active" },
    { id: "wrk-3", name: "Siti Nora", role: "Field Clerk", estateId: "est-2", block: "A08", phone: "013-890 4412", attendance: "Late", collections: 19, earnings: 2180, status: "Active" },
    { id: "wrk-4", name: "Musa Jamil", role: "Harvester", estateId: "est-3", block: "S01", phone: "016-481 9021", attendance: "Leave", collections: 26, earnings: 2910, status: "On Leave" }
  ],
  lorries: [
    { id: "lor-1", plateNo: "JTN 4821", driver: "Faizal Rahman", status: "On Trip", trips: 18, deliveredKg: 122400, fuelCost: 3280 },
    { id: "lor-2", plateNo: "WYD 9140", driver: "Kumar Raj", status: "Available", trips: 14, deliveredKg: 98300, fuelCost: 2810 },
    { id: "lor-3", plateNo: "SAA 7728", driver: "Azlan Muda", status: "Maintenance", trips: 9, deliveredKg: 60200, fuelCost: 1940 }
  ],
  collections: [
    { id: "FFB-2405-018", estateId: "est-1", block: "B12", workerId: "wrk-1", team: "Team Alpha", date: "2026-05-03", lorryId: "lor-1", centre: "Kluang Collection Centre", bunchCount: 420, estimatedWeight: 8200, actualWeight: 8600, grossWeight: 14850, tareWeight: 6240, grade: "A", deductionPercent: 1.5, moisturePercent: 0.8, dirtPercent: 0.4, rate: 760, status: "Approved", photo: "Photo proof attached", remarks: "Clean bunches, good ripeness" },
    { id: "FFB-2405-017", estateId: "est-2", block: "A08", workerId: "wrk-3", team: "Team Beta", date: "2026-05-03", lorryId: "lor-2", centre: "Maran Weighbridge", bunchCount: 315, estimatedWeight: 6100, actualWeight: 5950, grossWeight: 11870, tareWeight: 5920, grade: "B", deductionPercent: 3.5, moisturePercent: 1.2, dirtPercent: 0.9, rate: 710, status: "Graded", photo: "Awaiting final receipt", remarks: "Minor loose fruit mixed" },
    { id: "FFB-2405-016", estateId: "est-3", block: "S01", workerId: "wrk-4", team: "Team Sabah", date: "2026-05-02", lorryId: "lor-1", centre: "Lahad Datu Mill", bunchCount: 280, estimatedWeight: 5300, actualWeight: 0, grossWeight: 0, tareWeight: 0, grade: "Pending", deductionPercent: 0, moisturePercent: 0, dirtPercent: 0, rate: 710, status: "Collected", photo: "Mobile upload pending", remarks: "Collection waiting for transport" },
    { id: "FFB-2405-015", estateId: "est-1", block: "C04", workerId: "wrk-2", team: "Team Alpha", date: "2026-05-02", lorryId: "lor-2", centre: "Kluang Collection Centre", bunchCount: 510, estimatedWeight: 10200, actualWeight: 10080, grossWeight: 16280, tareWeight: 6200, grade: "A", deductionPercent: 1.2, moisturePercent: 0.6, dirtPercent: 0.3, rate: 760, status: "Paid", photo: "Receipt generated", remarks: "Paid in batch PAY-0029" }
  ],
  activities: [
    { id: "act-1", title: "Collection approved", detail: "FFB-2405-018 approved by estate owner", time: "8 min ago", tone: "green" },
    { id: "act-2", title: "Low productivity alert", detail: "Bukit Aman block A08 below 20 t/ha", time: "26 min ago", tone: "amber" },
    { id: "act-3", title: "Weighbridge updated", detail: "Maran Weighbridge posted grade B receipt", time: "42 min ago", tone: "blue" },
    { id: "act-4", title: "Payment pending", detail: "2 approved collections await finance", time: "1 hr ago", tone: "red" }
  ]
};

export const yieldTrend = [
  { month: "Jan", yield: 198, payment: 142 },
  { month: "Feb", yield: 213, payment: 151 },
  { month: "Mar", yield: 224, payment: 163 },
  { month: "Apr", yield: 238, payment: 174 },
  { month: "May", yield: 274, payment: 201 }
];

export const estatePerformance = [
  { name: "Seri Murni", value: 24.8 },
  { name: "Bukit Aman", value: 18.2 },
  { name: "Sg Bayu", value: 21.6 }
];
