const mongoose = require("mongoose");

const managerObjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    contactNumber: {
      type: String,
      trim: true,
    },
    remark: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const locationSchema = new mongoose.Schema(
  {
    address: String,
    city: String,
    state: String,
    pincode: String,
    latitude: Number,
    longitude: Number,
    mapLocationUrl: String,
    geofenceRadiusMeters: {
      type: Number,
      default: 200,
    },
  },
  { _id: false }
);

const storeSchema = new mongoose.Schema(
  {
    storeCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    storeName: {
      type: String,
      required: true,
      trim: true,
    },

    city: {
      type: String,
      trim: true,
    },

    state: {
      type: String,
      trim: true,
    },

    region: {
      type: String,
      trim: true,
    },

    zone: {
      type: String,
      trim: true,
    },

    address: {
      type: String,
      trim: true,
    },

    pincode: {
      type: String,
      trim: true,
    },

    latitude: Number,
    longitude: Number,

    geofenceRadiusMeters: {
      type: Number,
      default: 200,
    },

    openingTime: {
      type: String,
      default: "10:00",
    },

    closingTime: {
      type: String,
      default: "22:00",
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },

    managerId: {
      type: String,
      default: null,
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

    managerRemark: {
      type: String,
      trim: true,
    },

    manager: managerObjectSchema,

    mapLocationUrl: {
      type: String,
      trim: true,
    },

    subZoneAreaLocality: {
      type: String,
      trim: true,
    },

    location: locationSchema,
  },
  {
    timestamps: true,
    collection: "stores",
  }
);

module.exports = mongoose.models.Store || mongoose.model("Store", storeSchema);