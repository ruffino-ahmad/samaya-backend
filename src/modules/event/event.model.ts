import mongoose, { Document, Schema, Types } from "mongoose";

export interface IRegionItem extends Document {
  id: string;
  name: string;
}

export interface ICoordinates {
  lat: number;
  lng: number;
}

export interface IEventLocation {
  venueName?: string;
  address?: string;
  province?: IRegionItem;
  regency?: IRegionItem;
  district?: IRegionItem;
  village?: IRegionItem;
  coordinates?: ICoordinates;
}

export interface IEvent extends Document {
  name: string;
  startDate: Date;
  endDate: Date;
  description: string;
  banner: string;
  isFeatured: boolean;
  isOnline: boolean;
  isPublish: boolean;
  category: Types.ObjectId | string;
  slug: string;
  createdBy: Types.ObjectId | string;
  createdAt: string;
  updatedAt: string;
  location?: IEventLocation;
}

const regionItemSchema = new mongoose.Schema<IRegionItem>(
  {
    id: {
      type: String,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
    },
  },
  {
    _id: false,
  },
);

const coordinatesSchema = new mongoose.Schema<ICoordinates>(
  {
    lat: {
      type: Number,
      default: 0,
    },
    lng: {
      type: Number,
      default: 0,
    },
  },
  {
    _id: false,
  },
);

const eventLocationSchema = new mongoose.Schema<IEventLocation>({
  venueName: {
    type: String,
    trim: true,
  },
  address: {
    type: String,
    trim: true,
  },
  province: {
    type: regionItemSchema,
  },
  regency: {
    type: regionItemSchema,
  },
  district: {
    type: regionItemSchema,
  },
  village: {
    type: regionItemSchema,
  },
  coordinates: {
    type: coordinatesSchema,
    default: () => ({ lat: 0, lng: 0 }),
  },
});

const EventSchema = new mongoose.Schema<IEvent>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    banner: {
      type: String,
      required: true,
    },
    isFeatured: {
      type: Boolean,
      default: true,
    },
    isOnline: {
      type: Boolean,
      default: true,
    },
    isPublish: {
      type: Boolean,
      default: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    location: {
      type: eventLocationSchema,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

const EventModel = mongoose.model("Event", EventSchema);

export default EventModel;
