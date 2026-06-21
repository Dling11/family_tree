import { Schema, model, type InferSchemaType } from 'mongoose';

const familyMemberSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 80 },
    middleName: { type: String, trim: true, maxlength: 80 },
    lastName: { type: String, required: true, trim: true, maxlength: 80 },
    maidenName: { type: String, trim: true, maxlength: 80 },
    nickname: { type: String, trim: true, maxlength: 80 },
    gender: { type: String, enum: ['male', 'female', 'non-binary', 'prefer-not-to-say'] },
    lifeStatus: { type: String, enum: ['living', 'deceased', 'pregnancy-loss', 'unknown'], default: 'living', index: true },
    birthDate: Date,
    deathDate: Date,
    birthPlace: { type: String, trim: true, maxlength: 180 },
    currentLocation: { type: String, trim: true, maxlength: 180 },
    occupation: { type: String, trim: true, maxlength: 180 },
    biography: { type: String, trim: true, maxlength: 5000 },
    profileImage: String,
    profileImagePublicId: { type: String, select: false },
    parentIds: [{ type: Schema.Types.ObjectId, ref: 'FamilyMember' }],
    spouseIds: [{ type: Schema.Types.ObjectId, ref: 'FamilyMember' }],
    branch: { type: String, trim: true, maxlength: 100, index: true },
    siblingOrder: { type: Number, min: 1, max: 1000 },
    generation: { type: Number, min: 1, max: 20, index: true },
    isLiving: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
    hideInTree: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

familyMemberSchema.index({ firstName: 'text', lastName: 'text', maidenName: 'text', nickname: 'text', biography: 'text' });
familyMemberSchema.index({ parentIds: 1 });
familyMemberSchema.index({ spouseIds: 1 });
familyMemberSchema.index({ parentIds: 1, siblingOrder: 1, birthDate: 1 });

export type FamilyMemberType = InferSchemaType<typeof familyMemberSchema>;
export const FamilyMember = model('FamilyMember', familyMemberSchema);
