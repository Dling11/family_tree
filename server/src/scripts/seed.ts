import 'dotenv/config';
import { connectDatabase } from '../config/db.js';
import { FamilyMember } from '../models/FamilyMember.js';

const people = [
  { key: 'antonio', firstName: 'Antonio', lastName: 'Reyes', nickname: 'Toning', birthDate: '1938-04-12', birthPlace: 'San Isidro', occupation: 'Farmer and community elder', biography: 'Antonio built the first family home and filled it with stories, music, and Sunday lunches.', branch: 'Reyes', generation: 1, isLiving: false, featured: true },
  { key: 'elena', firstName: 'Elena', lastName: 'Reyes', maidenName: 'Santos', birthDate: '1941-09-03', birthPlace: 'Santa Clara', occupation: 'Teacher', biography: 'Elena preserved family recipes and handwritten letters that continue to connect every generation.', branch: 'Santos', generation: 1, isLiving: true, featured: true },
  { key: 'marco', firstName: 'Marco', lastName: 'Reyes', birthDate: '1964-02-17', occupation: 'Architect', branch: 'Reyes', generation: 2, isLiving: true },
  { key: 'luz', firstName: 'Luz', lastName: 'Reyes', maidenName: 'Garcia', birthDate: '1966-11-22', occupation: 'Nurse', branch: 'Garcia', generation: 2, isLiving: true },
  { key: 'sofia', firstName: 'Sofia', lastName: 'Cruz', maidenName: 'Reyes', birthDate: '1968-07-08', occupation: 'Writer', branch: 'Reyes', generation: 2, isLiving: true },
  { key: 'daniel', firstName: 'Daniel', lastName: 'Cruz', birthDate: '1967-12-14', occupation: 'Chef', branch: 'Cruz', generation: 2, isLiving: true },
  { key: 'mia', firstName: 'Mia', lastName: 'Reyes', birthDate: '1992-05-20', occupation: 'Designer', branch: 'Reyes', generation: 3, isLiving: true },
  { key: 'gabriel', firstName: 'Gabriel', lastName: 'Cruz', birthDate: '1995-10-01', occupation: 'Photographer', branch: 'Cruz', generation: 3, isLiving: true },
];

async function seed() {
  await connectDatabase();
  await FamilyMember.deleteMany({});
  const records = await FamilyMember.insertMany(people.map(({ key: _key, ...person }) => person));
  const id = Object.fromEntries(people.map((person, index) => [person.key, records[index]!._id]));
  await FamilyMember.findByIdAndUpdate(id.antonio, { spouseIds: [id.elena] });
  await FamilyMember.findByIdAndUpdate(id.elena, { spouseIds: [id.antonio] });
  await FamilyMember.findByIdAndUpdate(id.marco, { parentIds: [id.antonio, id.elena], spouseIds: [id.luz] });
  await FamilyMember.findByIdAndUpdate(id.luz, { spouseIds: [id.marco] });
  await FamilyMember.findByIdAndUpdate(id.sofia, { parentIds: [id.antonio, id.elena], spouseIds: [id.daniel] });
  await FamilyMember.findByIdAndUpdate(id.daniel, { spouseIds: [id.sofia] });
  await FamilyMember.findByIdAndUpdate(id.mia, { parentIds: [id.marco, id.luz] });
  await FamilyMember.findByIdAndUpdate(id.gabriel, { parentIds: [id.sofia, id.daniel] });
  console.log(`Seeded ${records.length} family members`);
  process.exit(0);
}

seed().catch((error) => { console.error(error); process.exit(1); });
