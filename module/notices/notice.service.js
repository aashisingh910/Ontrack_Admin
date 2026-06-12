const Notice = require("./notice.model");

const generateNoticeId = async () => {
  const count = await Notice.countDocuments();
  return `NOTICE-2026-${String(count + 1).padStart(3, "0")}`;
};

const buildFileUrl = (req, filePath) => {
  if (!filePath) return "";
  const normalizedPath = filePath.replace(/\\/g, "/");
  const uploadIndex = normalizedPath.indexOf("uploads");
  if (uploadIndex === -1) return "";
  const relativePath = normalizedPath.slice(uploadIndex);
  return `${req.protocol}://${req.get("host")}/${relativePath}`;
};

const getAllNotices = async (filters = {}) => {
  const query = {};

  if (filters.status) query.status = filters.status;
  if (filters.priority) query.priority = filters.priority;
  if (filters.visibility) query.visibility = filters.visibility;
  if (filters.targetAudience) query["target.targetAudience"] = filters.targetAudience;

  if (filters.storeCode) {
    query.$or = [
      { "target.storeScope": "All Stores" },
      { "target.storeCodes": String(filters.storeCode) },
    ];
  }

  if (filters.department) {
    query.$or = [
      ...(query.$or || []),
      { "target.department": "All Departments" },
      { "target.departments": new RegExp(filters.department, "i") },
    ];
  }

  if (filters.search) {
    query.$or = [
      { noticeTitle: new RegExp(filters.search, "i") },
      { noticeNumber: new RegExp(filters.search, "i") },
      { "content.description": new RegExp(filters.search, "i") },
      { "issuer.issuedBy": new RegExp(filters.search, "i") },
    ];
  }

  return await Notice.find(query).sort({ noticeDate: -1, createdAt: -1 }).lean();
};

const getNoticeById = async (noticeId) => {
  const notice = await Notice.findOne({
    $or: [{ noticeId }, { noticeNumber: noticeId }],
  }).lean();

  if (!notice) {
    const error = new Error("Notice not found");
    error.statusCode = 404;
    throw error;
  }

  return notice;
};

const createNotice = async (payload) => {
  const {
    noticeId,
    noticeTitle,
    noticeNumber,
    noticeDate,
    effectiveDate,
    dueDate,
    acknowledgementRequired = true,
    acknowledgementText,
    issuer,
    target,
    content,
    digitalSignatory,
    logo,
    attachments = [],
    status = "DRAFT",
    priority = "MEDIUM",
    visibility = "ACTIVE",
  } = payload;

  if (!noticeTitle || !noticeNumber || !noticeDate || !effectiveDate) {
    const error = new Error("noticeTitle, noticeNumber, noticeDate and effectiveDate are required");
    error.statusCode = 400;
    throw error;
  }

  if (!issuer?.issuedBy) {
    const error = new Error("issuer.issuedBy is required");
    error.statusCode = 400;
    throw error;
  }

  if (!content?.description || !content?.paragraph1 || !content?.paragraph2) {
    const error = new Error("content.description, content.paragraph1 and content.paragraph2 are required");
    error.statusCode = 400;
    throw error;
  }

  if (!digitalSignatory?.signatoryName || !digitalSignatory?.designation) {
    const error = new Error("digitalSignatory.signatoryName and digitalSignatory.designation are required");
    error.statusCode = 400;
    throw error;
  }

  const existing = await Notice.findOne({ noticeNumber });
  if (existing) {
    const error = new Error("Notice already exists with this noticeNumber");
    error.statusCode = 409;
    throw error;
  }

  const finalNoticeId = noticeId || (await generateNoticeId());

  const notice = await Notice.create({
    noticeId: finalNoticeId,
    noticeTitle,
    noticeNumber,
    noticeDate,
    effectiveDate,
    dueDate,
    acknowledgementRequired,
    acknowledgementText:
      acknowledgementText ||
      (acknowledgementRequired ? "Yes — Staff must acknowledge" : "No acknowledgement required"),
    issuer,
    target: {
      targetAudience: target?.targetAudience || ["STAFF"],
      storeScope: target?.storeScope || "All Stores",
      zone: target?.zone || "All Zones",
      region: target?.region || "All Regions",
      department: target?.department || "All Departments",
      storeCodes: target?.storeCodes || [],
      departments: target?.departments || [],
    },
    content: {
      description: content.description,
      paragraph1: content.paragraph1,
      paragraph2: content.paragraph2,
      paragraph3: content.paragraph3 || "",
      importantInstructions: content.importantInstructions || [],
    },
    digitalSignatory: {
      signatoryName: digitalSignatory.signatoryName,
      designation: digitalSignatory.designation,
      signedAt: digitalSignatory.signedAt || new Date(),
      signatureUrl: digitalSignatory.signatureUrl || "",
      signatureFileName: digitalSignatory.signatureFileName || "",
    },
    logo: {
      logoUrl: logo?.logoUrl || "",
      logoFileName: logo?.logoFileName || "",
      altText: logo?.altText || "HomeTown Logo",
    },
    attachments,
    acknowledgementStats: { totalTargeted: 0, acknowledged: 0, pending: 0, acknowledgementPercent: 0 },
    status,
    priority,
    visibility,
  });

  return notice;
};

const updateNotice = async (noticeId, updates) => {
  const notice = await Notice.findOneAndUpdate(
    { $or: [{ noticeId }, { noticeNumber: noticeId }] },
    updates,
    { new: true, runValidators: true }
  );

  if (!notice) {
    const error = new Error("Notice not found");
    error.statusCode = 404;
    throw error;
  }

  return notice;
};

const publishNotice = async (noticeId) =>
  updateNotice(noticeId, { status: "PUBLISHED", visibility: "ACTIVE" });

const archiveNotice = async (noticeId) =>
  updateNotice(noticeId, { status: "ARCHIVED", visibility: "INACTIVE" });

const uploadLogo = async ({ noticeId, file, req }) => {
  const notice = await Notice.findOne({ $or: [{ noticeId }, { noticeNumber: noticeId }] });
  if (!notice) {
    const error = new Error("Notice not found");
    error.statusCode = 404;
    throw error;
  }

  notice.logo = {
    logoUrl: buildFileUrl(req, file.path),
    logoFileName: file.filename,
    altText: "HomeTown Logo",
  };

  await notice.save();
  return notice;
};

const uploadSignature = async ({ noticeId, file, req }) => {
  const notice = await Notice.findOne({ $or: [{ noticeId }, { noticeNumber: noticeId }] });
  if (!notice) {
    const error = new Error("Notice not found");
    error.statusCode = 404;
    throw error;
  }

  notice.digitalSignatory.signatureUrl = buildFileUrl(req, file.path);
  notice.digitalSignatory.signatureFileName = file.filename;
  notice.digitalSignatory.signedAt = new Date();

  await notice.save();
  return notice;
};

const acknowledgeNotice = async ({
  noticeId,
  employeeCode,
  employeeName,
  role,
  storeCode,
  storeName,
  ipAddress,
  userAgent,
}) => {
  const notice = await Notice.findOne({ $or: [{ noticeId }, { noticeNumber: noticeId }] });
  if (!notice) {
    const error = new Error("Notice not found");
    error.statusCode = 404;
    throw error;
  }

  if (!notice.acknowledgementRequired) {
    const error = new Error("Acknowledgement is not required for this notice");
    error.statusCode = 400;
    throw error;
  }

  const alreadyAcknowledged = notice.acknowledgements.some(
    (item) => item.employeeCode === employeeCode
  );
  if (alreadyAcknowledged) {
    const error = new Error("Notice already acknowledged by this employee");
    error.statusCode = 409;
    throw error;
  }

  notice.acknowledgements.push({
    employeeCode,
    employeeName,
    role,
    storeCode,
    storeName,
    acknowledgedAt: new Date(),
    ipAddress,
    userAgent,
  });

  await notice.save();
  return notice;
};

const updateTargetCount = async ({ noticeId, totalTargeted }) => {
  const notice = await Notice.findOne({ $or: [{ noticeId }, { noticeNumber: noticeId }] });
  if (!notice) {
    const error = new Error("Notice not found");
    error.statusCode = 404;
    throw error;
  }

  notice.acknowledgementStats.totalTargeted = Number(totalTargeted || 0);
  await notice.save();
  return notice;
};

const getNoticePrintData = async (noticeId) => {
  const notice = await getNoticeById(noticeId);
  return {
    company: { name: "HomeTown", ownedBy: "Praxis Home Retail Limited" },
    notice,
    printMeta: {
      generatedAt: new Date(),
      format: "NOTICE_PRINT_VIEW",
      hasLogo: Boolean(notice.logo?.logoUrl),
      hasSignature: Boolean(notice.digitalSignatory?.signatureUrl),
    },
  };
};

module.exports = {
  getAllNotices,
  getNoticeById,
  createNotice,
  updateNotice,
  publishNotice,
  archiveNotice,
  uploadLogo,
  uploadSignature,
  acknowledgeNotice,
  updateTargetCount,
  getNoticePrintData,
};
