const mongoose = require("mongoose");

const assignedStoreSchema = new mongoose.Schema(
  {
    storeCode: String,
    storeName: String,
    city: String,
    region: String,
  },
  { _id: false }
);

const staffSchema = new mongoose.Schema(
  {
    employeeCode: { type: String, required: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    contactNumber: { type: String, trim: true },
    role: { type: String, default: "STAFF", index: true },
    designation: { type: String, trim: true },
    department: { type: String, trim: true },
    storeCode: { type: String, trim: true, index: true },
    storeName: { type: String, trim: true },
    city: { type: String, trim: true },
    region: { type: String, trim: true },
    status: { type: String, default: "ACTIVE", index: true },
    managerId: { type: String, trim: true },
    managerName: { type: String, trim: true },
    managerEmail: { type: String, trim: true, lowercase: true },
    managerContactNumber: { type: String, trim: true },
    assignedStore: assignedStoreSchema,
    weeklyOff: {
      type: String,
      enum: ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      default: "",
      index: true,
    },
  },
  { timestamps: true, collection: "staff" }
);

module.exports = mongoose.model("Staff", staffSchema);
