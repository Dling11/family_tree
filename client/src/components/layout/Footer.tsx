import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-clay/10 bg-gradient-to-br from-white via-cream to-sand text-ink">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-3 lg:px-8">
        <div>
          <div className="mb-4 flex items-center gap-2 font-display text-2xl text-forest"><span className="grid size-9 place-items-center rounded-full bg-clay/10 text-clay">R</span> Rodriguez</div>
          <p className="max-w-sm text-sm leading-6 text-ink/60">A simple place for Rodriguez family photos, names, and memories.</p>
        </div>
        <div>
          <p className="mb-4 text-xs font-bold uppercase tracking-[.2em] text-clay">Explore</p>
          <div className="flex flex-col gap-3 text-sm text-ink/65">
            <Link to="/tree">Family tree</Link>
            <Link to="/about">Our story</Link>
          </div>
        </div>
        <div className="md:text-right">
          <p className="text-sm text-ink/55">Made for the Rodriguez family.</p>
          <Link to="/admin" className="mt-3 inline-block text-xs text-clay/60 hover:text-clay">Admin workspace</Link>
        </div>
      </div>
    </footer>
  );
}
