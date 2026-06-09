const mongoose = require("mongoose");

const assignedStoreSchema = new mongoose.Schema(
  {
    storeCode: {
      type: String,
      trim: true,
    },
    storeName: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    region: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const managerSchema = new mongoose.Schema(
  {
    employeeCode: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    contactNumber: {
      type: String,
      trim: true,
    },

    role: {
      type: String,
      enum: ["MANAGER"],
      default: "MANAGER",
    },

    designation: {
      type: String,
      default: "Store Manager",
      trim: true,
    },

    department: {
      type: String,
      default: "OPERATIONS",
      trim: true,
    },

    storeCode: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    storeName: {
      type: String,
      trim: true,
    },

    city: {
      type: String,
      trim: true,
    },

    region: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },

    managerId: {
      type: String,
      trim: true,
    },

    managerName: {
      type: String,
      trim: true,
    },

    managerEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },

    managerContactNumber: {
      type: String,
      trim: true,
    },

    assignedStore: assignedStoreSchema,

    reportingManager: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "managers",
  }
);

managerSchema.pre("save", function (next) {
  this.role = "MANAGER";

  if (!this.managerId) {
    this.managerId = this.employeeCode;
  }

  if (!this.managerName) {
    this.managerName = this.name;
  }

  if (!this.managerEmail) {
    this.managerEmail = this.email;
  }

  if (!this.managerContactNumber) {
    this.managerContactNumber = this.contactNumber;
  }

  if (!this.assignedStore) {
    this.assignedStore = {
      storeCode: this.storeCode,
      storeName: this.storeName,
      city: this.city,
      region: this.region,
    };
  }

  next();
});

module.exports = mongoose.model("Manager", managerSchema);