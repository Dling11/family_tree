# Rodriguez Family Tree

A full-stack family history website with a public interactive tree and a protected admin workspace.

## Stack

- Vite, React, TypeScript, Tailwind CSS, SCSS
- React Flow for the interactive family graph
- Node.js, Express, TypeScript, MongoDB, Mongoose
- Multer and Cloudinary for organized profile photo uploads

## Quick start

```bash
npm run install:all
copy server\.env.example server\.env
copy client\.env.example client\.env
npm run dev
```

Configure `MONGODB_URI` and the three `CLOUDINARY_*` values in `server/.env`. Until MongoDB is connected, the public UI still demonstrates the complete experience with sample family data.

- Client: http://localhost:5173
- API: http://localhost:5000/api
- Admin: http://localhost:5173/admin

## Important

Admin credentials and the token signing secret are configured in `server/.env`. Change the included development values before deployment.

Profile photos are stored in Cloudinary under `kinroot/family-members/<branch>`. MongoDB stores the secure image URL and hidden Cloudinary public ID so replaced and deleted photos can be removed automatically.

## Data model

`FamilyMember` stores profile and life details plus `parentIds` and `spouseIds`. The server's `/api/members/tree` endpoint converts those records into nodes and typed edges for the family graph.
