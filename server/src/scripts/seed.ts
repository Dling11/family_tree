import 'dotenv/config';
import { connectDatabase } from '../config/db.js';
import { FamilyGroup } from '../models/FamilyGroup.js';
import { FamilyMember } from '../models/FamilyMember.js';

const people = [
  { key: 'elpidio-yuzon-rodriguez', firstName: 'Elpidio', middleName: 'Yuzon', lastName: 'Rodriguez', branch: 'Rodriguez', generation: 1, isLiving: false, featured: true },
  { key: 'angles-l-rodriguez', firstName: 'Angles', middleName: 'L.', lastName: 'Rodriguez', maidenName: 'de-Leon', branch: 'de-Leon', generation: 1, isLiving: false, featured: true },
  { key: 'rodrigo-l-rodriguez', firstName: 'Rodrigo', middleName: 'L.', lastName: 'Rodriguez', branch: 'Rodriguez', generation: 2, isLiving: true },
  { key: 'marlyn-hapay-rodriguez', firstName: 'Marlyn', middleName: 'Hapay', lastName: 'Rodriguez', maidenName: 'Hapay', branch: 'Hapay', generation: 2, isLiving: true },
  { key: 'anita-rodriguez-magcaling', firstName: 'Anita', middleName: 'Rodriguez', lastName: 'Magcaling', maidenName: 'Rodriguez', branch: 'Rodriguez', generation: 2, isLiving: true },
  { key: 'ramon-magcaling', firstName: 'Ramon', lastName: 'Magcaling', branch: 'Magcaling', generation: 2, isLiving: true },
  { key: 'teddy-rodriguez', firstName: 'Teddy', lastName: 'Rodriguez', branch: 'Rodriguez', generation: 2, isLiving: true },
  { key: 'anonymous-teddy-spouse', firstName: 'Anonymous', lastName: 'Spouse', branch: 'To be updated', generation: 2, isLiving: true },
  { key: 'perla-rodriguez-ortega', firstName: 'Perla', middleName: 'Rodriguez', lastName: 'Ortega', maidenName: 'Rodriguez', branch: 'Rodriguez', generation: 2, isLiving: true },
  { key: 'nestor-ortega', firstName: 'Nestor', lastName: 'Ortega', branch: 'Ortega', generation: 2, isLiving: true },
  { key: 'elvira-rodriguez-sacramento', firstName: 'Elvira', middleName: 'Rodriguez', lastName: 'Sacramento', maidenName: 'Rodriguez', branch: 'Rodriguez', generation: 2, isLiving: true },
  { key: 'mel-sacramento', firstName: 'Mel', lastName: 'Sacramento', branch: 'Sacramento', generation: 2, isLiving: true },
  { key: 'teresita-rodriguez', firstName: 'Teresita', lastName: 'Rodriguez', branch: 'Rodriguez', generation: 2, isLiving: true },
  { key: 'greg-tuliao', firstName: 'Greg', lastName: 'Tuliao', branch: 'Tuliao', generation: 2, isLiving: true },
  { key: 'rowena-rodriguez-peguit', firstName: 'Rowena', middleName: 'Rodriguez', lastName: 'Peguit', branch: 'Rodriguez', generation: 2, isLiving: true },
  { key: 'anastacio-batoy-peguit-jr', firstName: 'Anastacio', middleName: 'Batoy', lastName: 'Peguit Jr.', branch: 'Peguit', generation: 2, isLiving: true },
  { key: 'elpidio-de-leon-rodriguez', firstName: 'Elpidio', middleName: 'de-Leon', lastName: 'Rodriguez', branch: 'Rodriguez', generation: 2, isLiving: true },
  { key: 'anonymous-elpidio-spouse', firstName: 'Anonymous', lastName: 'Spouse', branch: 'To be updated', generation: 2, isLiving: true },
  { key: 'daisy-de-leon-rodriguez', firstName: 'Daisy', middleName: 'de-Leon', lastName: 'Rodriguez', branch: 'Rodriguez', generation: 2, isLiving: true },
  { key: 'anonymous-daisy-spouse', firstName: 'Anonymous', lastName: 'Spouse', branch: 'To be updated', generation: 2, isLiving: true },
  { key: 'cristina-rodriguez-escoto', firstName: 'Cristina', middleName: 'Rodriguez', lastName: 'Escoto', maidenName: 'Rodriguez', branch: 'Rodriguez', generation: 2, isLiving: true },
  { key: 'loreto-escoto', firstName: 'Loreto', lastName: 'Escoto', branch: 'Escoto', generation: 2, isLiving: true },
  { key: 'ofelia-rodriguez-empe', firstName: 'Ofelia', middleName: 'Rodriguez', lastName: 'Empe', maidenName: 'Rodriguez', branch: 'Rodriguez', generation: 2, isLiving: true },
  { key: 'dindo-empe', firstName: 'Dindo', lastName: 'Empe', branch: 'Empe', generation: 2, isLiving: true },
  { key: 'wilma-rodriguez-del-rosario', firstName: 'Wilma', middleName: 'Rodriguez', lastName: 'del-Rosario', maidenName: 'Rodriguez', branch: 'Rodriguez', generation: 2, isLiving: true },
  { key: 'peter-john-delrosario', firstName: 'Peter John', lastName: 'Delrosario', branch: 'Delrosario', generation: 2, isLiving: true },
];

const parents = ['elpidio-yuzon-rodriguez', 'angles-l-rodriguez'];

const children = [
  'rodrigo-l-rodriguez',
  'anita-rodriguez-magcaling',
  'teddy-rodriguez',
  'perla-rodriguez-ortega',
  'elvira-rodriguez-sacramento',
  'teresita-rodriguez',
  'rowena-rodriguez-peguit',
  'elpidio-de-leon-rodriguez',
  'daisy-de-leon-rodriguez',
  'cristina-rodriguez-escoto',
  'ofelia-rodriguez-empe',
  'wilma-rodriguez-del-rosario',
];

const spouses: Array<[string, string]> = [
  ['elpidio-yuzon-rodriguez', 'angles-l-rodriguez'],
  ['rodrigo-l-rodriguez', 'marlyn-hapay-rodriguez'],
  ['anita-rodriguez-magcaling', 'ramon-magcaling'],
  ['teddy-rodriguez', 'anonymous-teddy-spouse'],
  ['perla-rodriguez-ortega', 'nestor-ortega'],
  ['elvira-rodriguez-sacramento', 'mel-sacramento'],
  ['teresita-rodriguez', 'greg-tuliao'],
  ['rowena-rodriguez-peguit', 'anastacio-batoy-peguit-jr'],
  ['elpidio-de-leon-rodriguez', 'anonymous-elpidio-spouse'],
  ['daisy-de-leon-rodriguez', 'anonymous-daisy-spouse'],
  ['cristina-rodriguez-escoto', 'loreto-escoto'],
  ['ofelia-rodriguez-empe', 'dindo-empe'],
  ['wilma-rodriguez-del-rosario', 'peter-john-delrosario'],
];

async function seed() {
  await connectDatabase();
  await FamilyMember.deleteMany({});
  await FamilyGroup.deleteMany({});
  const groups = [...new Set(people.map((person) => person.branch).filter(Boolean))];
  await FamilyGroup.insertMany(groups.map((name, index) => ({ name, sortOrder: index, isActive: true })));
  const records = await FamilyMember.insertMany(people.map(({ key: _key, ...person }) => person));
  const id = Object.fromEntries(people.map((person, index) => [person.key, records[index]!._id])) as Record<string, typeof records[number]['_id']>;

  await Promise.all(children.map((childKey) => FamilyMember.findByIdAndUpdate(id[childKey], { parentIds: parents.map((parentKey) => id[parentKey]) })));
  await Promise.all(spouses.flatMap(([firstKey, secondKey]) => [
    FamilyMember.findByIdAndUpdate(id[firstKey], { $addToSet: { spouseIds: id[secondKey] } }),
    FamilyMember.findByIdAndUpdate(id[secondKey], { $addToSet: { spouseIds: id[firstKey] } }),
  ]));

  console.log(`Seeded ${records.length} Rodriguez family members`);
  process.exit(0);
}

seed().catch((error) => { console.error(error); process.exit(1); });
