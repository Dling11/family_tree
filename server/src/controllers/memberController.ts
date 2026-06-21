import type { NextFunction, Request, Response } from 'express';
import { FamilyMember } from '../models/FamilyMember.js';
import { deleteProfileImage, uploadProfileImage } from '../services/imageService.js';

const parseArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value !== 'string' || !value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return value.split(',').filter(Boolean);
  }
};

const normalizeBody = (request: Request) => {
  const body = { ...request.body };
  body.parentIds = parseArray(body.parentIds);
  body.spouseIds = parseArray(body.spouseIds);
  body.isLiving = body.isLiving === true || body.isLiving === 'true';
  body.featured = body.featured === true || body.featured === 'true';
  body.hideInTree = body.hideInTree === true || body.hideInTree === 'true';
  Object.keys(body).forEach((key) => body[key] === '' && delete body[key]);
  return body;
};

export async function listMembers(request: Request, response: Response, next: NextFunction) {
  try {
    const query = String(request.query.q || '').trim();
    const branch = String(request.query.branch || '').trim();
    const filter: Record<string, unknown> = {};
    if (query) filter.$text = { $search: query };
    if (branch) filter.branch = branch;
    const members = await FamilyMember.find(filter).sort({ generation: 1, birthDate: 1, lastName: 1 }).lean();
    response.json(members);
  } catch (error) { next(error); }
}

export async function getTree(_request: Request, response: Response, next: NextFunction) {
  try {
    const members = await FamilyMember.find().sort({ generation: 1, birthDate: 1 }).lean();
    const edges: Array<{ id: string; source: string; target: string; type: 'parent' | 'spouse' }> = [];
    const spouseKeys = new Set<string>();
    members.forEach((member) => {
      const childId = member._id.toString();
      member.parentIds.forEach((parentId) => edges.push({ id: `parent-${parentId}-${childId}`, source: parentId.toString(), target: childId, type: 'parent' }));
      member.spouseIds.forEach((spouseId) => {
        const pair = [childId, spouseId.toString()].sort();
        const key = pair.join('-');
        if (!spouseKeys.has(key)) {
          spouseKeys.add(key);
          edges.push({ id: `spouse-${key}`, source: pair[0]!, target: pair[1]!, type: 'spouse' });
        }
      });
    });
    response.json({ members, edges });
  } catch (error) { next(error); }
}

export async function getMember(request: Request, response: Response, next: NextFunction) {
  try {
    const member = await FamilyMember.findById(request.params.id).populate('parentIds spouseIds');
    if (!member) return response.status(404).json({ message: 'Family member not found' });
    response.json(member);
  } catch (error) { next(error); }
}

export async function createMember(request: Request, response: Response, next: NextFunction) {
  let uploadedPublicId: string | undefined;
  try {
    const body = normalizeBody(request);
    if (request.file) {
      const uploaded = await uploadProfileImage(request.file, body.branch);
      body.profileImage = uploaded.url;
      body.profileImagePublicId = uploaded.publicId;
      uploadedPublicId = uploaded.publicId;
    }
    const member = await FamilyMember.create(body);
    if (member.spouseIds.length) {
      await FamilyMember.updateMany({ _id: { $in: member.spouseIds } }, { $addToSet: { spouseIds: member._id } });
    }
    response.status(201).json(member);
  } catch (error) {
    await deleteProfileImage(uploadedPublicId).catch(console.error);
    next(error);
  }
}

export async function updateMember(request: Request, response: Response, next: NextFunction) {
  let uploadedPublicId: string | undefined;
  try {
    const previous = await FamilyMember.findById(request.params.id).select('+profileImagePublicId');
    if (!previous) {
      return response.status(404).json({ message: 'Family member not found' });
    }
    const body = normalizeBody(request);
    if (request.file) {
      const uploaded = await uploadProfileImage(request.file, body.branch || previous.branch || undefined);
      body.profileImage = uploaded.url;
      body.profileImagePublicId = uploaded.publicId;
      uploadedPublicId = uploaded.publicId;
    }
    const nextSpouses = parseArray(body.spouseIds);
    const removed = previous.spouseIds.map(String).filter((id) => !nextSpouses.includes(id));
    const added = nextSpouses.filter((id) => !previous.spouseIds.map(String).includes(id));
    const member = await FamilyMember.findByIdAndUpdate(request.params.id, body, { new: true, runValidators: true });
    if (removed.length) await FamilyMember.updateMany({ _id: { $in: removed } }, { $pull: { spouseIds: previous._id } });
    if (added.length) await FamilyMember.updateMany({ _id: { $in: added } }, { $addToSet: { spouseIds: previous._id } });
    if (uploadedPublicId) await deleteProfileImage(previous.profileImagePublicId);
    response.json(member);
  } catch (error) {
    await deleteProfileImage(uploadedPublicId).catch(console.error);
    next(error);
  }
}

export async function deleteMember(request: Request, response: Response, next: NextFunction) {
  try {
    const member = await FamilyMember.findByIdAndDelete(request.params.id).select('+profileImagePublicId');
    if (!member) return response.status(404).json({ message: 'Family member not found' });
    await FamilyMember.updateMany({}, { $pull: { parentIds: member._id, spouseIds: member._id } });
    await deleteProfileImage(member.profileImagePublicId);
    response.status(204).send();
  } catch (error) { next(error); }
}
