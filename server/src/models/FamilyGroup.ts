import { Schema, model, type InferSchemaType } from 'mongoose';

const familyGroupSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100, unique: true },
    description: { type: String, trim: true, maxlength: 500 },
    sortOrder: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

familyGroupSchema.index({ name: 'text', description: 'text' });

export type FamilyGroupType = InferSchemaType<typeof familyGroupSchema>;
export const FamilyGroup = model('FamilyGroup', familyGroupSchema);
