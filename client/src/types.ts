export interface FamilyMember {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  maidenName?: string;
  nickname?: string;
  gender?: 'male' | 'female' | 'non-binary' | 'prefer-not-to-say';
  birthDate?: string;
  deathDate?: string;
  birthPlace?: string;
  currentLocation?: string;
  occupation?: string;
  biography?: string;
  profileImage?: string;
  parentIds: string[];
  spouseIds: string[];
  branch?: string;
  generation?: number;
  isLiving?: boolean;
  featured?: boolean;
  hideInTree?: boolean;
}

export interface TreeEdge {
  id: string;
  source: string;
  target: string;
  type: 'parent' | 'spouse';
}

export interface TreeData {
  members: FamilyMember[];
  edges: TreeEdge[];
}

export interface DashboardImage {
  _id: string;
  title: string;
  caption?: string;
  imageUrl: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface FamilyGroup {
  _id: string;
  name: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}
