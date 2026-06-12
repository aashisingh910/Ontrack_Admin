const mongoose = require("mongoose");

const issuerSchema = new mongoose.Schema(
  {
    issuedBy: { type: String, required: true, trim: true },
    designation: { type: String, trim: true },
  },
  { _id: false }
);

const targetSchema = new mongoose.Schema(
  {
    targetAudience: [{ type: String, enum: ["STAFF", "MANAGER", "ADMIN", "ALL"] }],
    storeScope: { type: String, default: "All Stores" },
    zone: { type: String, default: "All Zones" },
    region: { type: String, default: "All Regions" },
    department: { type: String, default: "All Departments" },
    storeCodes: [{ type: String, trim: true }],
    departments: [{ type: String, trim: true }],
  },
  { _id: false }
);

const contentSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true },
    paragraph1: { type: String, required: true, trim: true },
    paragraph2: { type: String, required: true, trim: true },
    paragraph3: { type: String, trim: true, default: "" },
    importantInstructions: [{ type: String, trim: true }],
  },
  { _id: false }
);

const digitalSignatorySchema = new mongoose.Schema(
  {
    signatoryName: { type: String, required: true, trim: true },
    designation: { type: String, required: true, trim: true },
    signedAt: { type: Date, default: Date.now },
    signatureUrl: { type: String, default: "" },
    signatureFileName: { type: String, default: "" },
  },
  { _id: false }
);

const logoSchema = new mongoose.Schema(
  {
    logoUrl: { type: String, default: "" },
    logoFileName: { type: String, default: "" },
    altText: { type: String, default: "HomeTown Logo" },
  },
  { _id: false }
);

const acknowledgementStatsSchema = new mongoose.Schema(
  {
    totalTargeted: { type: Number, default: 0 },
    acknowledged: { type: Number, default: 0 },
    pending: { type: Number, default: 0 },
    acknowledgementPercent: { type: Number, default: 0 },
  },
  { _id: false }
);

const acknowledgementSchema = new mongoose.Schema(
  {
    employeeCode: { type: String, required: true, trim: true },
    employeeName: { type: String, trim: true },
    role: { type: String, enum: ["STAFF", "MANAGER", "ADMIN"] },
    storeCode: { type: String, trim: true },
    storeName: { type: String, trim: true },
    acknowledgedAt: { type: Date, default: Date.now },
    ipAddress: { type: String, default: "" },
    userAgent: { type: String, default: "" },
  },
  { _id: false }
);

const attachmentSchema = new mongoose.Schema(
  {
    fileName: String,
    fileUrl: String,
    mimeType: String,
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const noticeSchema = new mongoose.Schema(
  {
    noticeId: { type: String, required: true, unique: true, index: true, trim: true },
    noticeTitle: { type: String, required: true, trim: true },
    noticeNumber: { type: String, required: true, unique: true, index: true, trim: true },
    noticeDate: { type: Date, required: true },
    effectiveDate: { type: Date, required: true },
    dueDate: { type: Date, default: null },
    acknowledgementRequired: { type: Boolean, default: true },
    acknowledgementText: { type: String, default: "Yes — Staff must acknowledge" },
    issuer: issuerSchema,
    target: targetSchema,
    content: contentSchema,
    digitalSignatory: digitalSignatorySchema,
    logo: logoSchema,
    attachments: [attachmentSchema],
    acknowledgements: [acknowledgementSchema],
    acknowledgementStats: acknowledgementStatsSchema,
    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED", "ARCHIVED"],
      default: "DRAFT",
      index: true,
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
      default: "MEDIUM",
      index: true,
    },
    visibility: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
      index: true,
    },
  },
  { timestamps: true, collection: "notices" }
);

noticeSchema.pre("save", function (next) {
  const acknowledged = this.acknowledgements?.length || 0;
  const totalTargeted = this.acknowledgementStats?.totalTargeted || 0;

  this.acknowledgementStats.acknowledged = acknowledged;
  this.acknowledgementStats.pending = Math.max(totalTargeted - acknowledged, 0);
  this.acknowledgementStats.acknowledgementPercent =
    totalTargeted > 0 ? Number(((acknowledged / totalTargeted) * 100).toFixed(2)) : 0;

  next();
});

module.exports = mongoose.model("Notice", noticeSchema);
