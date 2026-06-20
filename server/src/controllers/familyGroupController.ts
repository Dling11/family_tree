import type { NextFunction, Request, Response } from 'express';
import { FamilyGroup } from '../models/FamilyGroup.js';
import { FamilyMember } from '../models/FamilyMember.js';

async function syncGroupsFromMembers() {
  const names = (await FamilyMember.distinct('branch')).filter((name): name is string => typeof name === 'string' && Boolean(name.trim()));
  await Promise.all(names.map((name, index) => FamilyGroup.updateOne(
    { name },
    { $setOnInsert: { name, sortOrder: index, isActive: true } },
    { upsert: true },
  )));
}

export async function listFamilyGroups(_request: Request, response: Response, next: NextFunction) {
  try {
    await syncGroupsFromMembers();
    const groups = await FamilyGroup.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean();
    response.json(groups);
  } catch (error) { next(error); }
}

export async function createFamilyGroup(request: Request, response: Response, next: NextFunction) {
  try {
    const name = String(request.body.name || '').trim();
    if (!name) return response.status(400).json({ message: 'Family group name is required' });

    const group = await FamilyGroup.findOneAndUpdate(
      { name },
      {
        $set: {
          name,
          description: String(request.body.description || '').trim(),
          isActive: true,
        },
        $setOnInsert: {
          sortOrder: Number(request.body.sortOrder || 0),
        },
      },
      { upsert: true, new: true, runValidators: true },
    );

    response.status(201).json(group);
  } catch (error) { next(error); }
}
