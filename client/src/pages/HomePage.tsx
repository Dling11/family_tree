import { BookHeart, Expand, GitBranch, Search, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FamilyTree } from '../components/tree/FamilyTree';
import { DashboardCarousel } from '../components/ui/DashboardCarousel';
import { usePublicDashboardImages } from '../hooks/useDashboardImages';
import { useFamilyTree } from '../hooks/useFamilyTree';

export function HomePage() {
  const { tree } = useFamilyTree();
  const dashboardImages = usePublicDashboardImages();

  return (
    <>
      <section className="hero hero--photo">
        <div className="mx-auto max-w-[1720px] px-4 py-10 lg:px-10">
          <DashboardCarousel images={dashboardImages} />
        </div>
      </section>

      <section className="home-tree px-4 py-20 lg:px-8" id="family-tree">
        <div className="mx-auto max-w-[1600px]">
          <div className="mb-7 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="eyebrow">Rodriguez family tree</p>
              <h2 className="mt-3 font-display text-4xl text-forest sm:text-5xl">Our family, from lolo and lola to today.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/55">Click a name to see their photo and details. This is a simple place for our family to remember who came before us.</p>
            </div>
            <Link to="/tree" className="button-secondary shrink-0 gap-2"><Expand size={17} /> Open full tree</Link>
          </div>
          {tree.members.length ? (
            <FamilyTree data={tree} variant="featured" />
          ) : (
            <div className="tree-canvas tree-canvas--featured grid place-items-center text-forest/50">Preparing the family tree...</div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <p className="eyebrow">For the family</p>
            <h2 className="mt-4 font-display text-4xl text-forest sm:text-5xl">Photos, names, and memories in one place.</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {[
              [GitBranch, 'Follow the family line', 'See parents, children, spouses, and relatives in the chart.'],
              [Search, 'Find a relative', 'Search by name when the family tree starts getting bigger.'],
              [BookHeart, 'Keep the memories', 'Add photos, dates, places, and short notes for each person.'],
            ].map(([Icon, title, text]) => (
              <article key={String(title)} className="rounded-3xl border border-forest/10 bg-white/60 p-6">
                <Icon className="mb-8 text-clay" />
                <h3 className="font-display text-xl text-forest">{String(title)}</h3>
                <p className="mt-3 text-sm leading-6 text-ink/60">{String(text)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-sand via-cream to-white px-5 py-20 text-forest">
        <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
          <ShieldCheck className="mb-5 text-clay" size={34} />
          <p className="eyebrow">For the next generation</p>
          <h2 className="mt-4 max-w-3xl font-display text-4xl sm:text-5xl">So our children will know the names and faces behind our family.</h2>
          <Link to="/tree" className="mt-8 rounded-full bg-clay px-7 py-3 font-semibold text-white shadow-lg shadow-clay/20 hover:bg-forest">Enter the family tree</Link>
        </div>
      </section>
    </>
  );
}
