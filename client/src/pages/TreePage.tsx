import { Search, SlidersHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';
import { FamilyTree } from '../components/tree/FamilyTree';
import { useFamilyTree } from '../hooks/useFamilyTree';

export function TreePage() {
  const { tree, loading } = useFamilyTree();
  const [query, setQuery] = useState('');
  const [branch, setBranch] = useState('All branches');

  const branches = useMemo(() => ['All branches', ...new Set(tree.members.map((member) => member.branch).filter(Boolean) as string[])], [tree.members]);
  const result = useMemo(() => tree.members.find((member) => `${member.firstName} ${member.lastName}`.toLowerCase().includes(query.toLowerCase())), [tree.members, query]);
  const filtered = useMemo(() => {
    if (branch === 'All branches') return tree;
    const ids = new Set(tree.members.filter((member) => member.branch === branch).map((member) => member._id));
    return { members: tree.members.filter((member) => ids.has(member._id)), edges: tree.edges.filter((edge) => ids.has(edge.source) && ids.has(edge.target)) };
  }, [tree, branch]);

  return (
    <section className="min-h-[calc(100vh-80px)] px-4 py-8 lg:px-8">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-6 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="eyebrow">The family map</p>
            <h1 className="mt-2 font-display text-4xl text-forest md:text-5xl">Explore our generations</h1>
            <p className="mt-2 text-sm text-ink/55">Select any person to open their story. Drag the canvas to travel through time.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="input-shell min-w-72">
              <Search size={18} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a family member..." />
              {query && <span className="text-xs text-ink/40">{result ? 'Found' : 'No match'}</span>}
            </label>
            <label className="input-shell">
              <SlidersHorizontal size={17} />
              <select value={branch} onChange={(e) => setBranch(e.target.value)}>
                {branches.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
          </div>
        </div>
        {loading ? (
          <div className="tree-canvas grid place-items-center text-forest/50">Growing the family tree...</div>
        ) : (
          <FamilyTree key={`${branch}-${result?._id || 'all'}`} data={filtered} focusId={result?._id} />
        )}
      </div>
    </section>
  );
}
