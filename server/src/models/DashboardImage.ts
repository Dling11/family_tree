import { Schema, model, type InferSchemaType } from 'mongoose';

const dashboardImageSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    caption: { type: String, trim: true, maxlength: 260 },
    imageUrl: { type: String, required: true },
    imagePublicId: { type: String, required: true, select: false },
    sortOrder: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

export type DashboardImageType = InferSchemaType<typeof dashboardImageSchema>;
export const DashboardImage = model('DashboardImage', dashboardImageSchema);
