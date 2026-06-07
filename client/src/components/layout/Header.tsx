import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

const links = [
  { label: 'Home', to: '/' },
  { label: 'Family tree', to: '/tree' },
  { label: 'Our story', to: '/about' },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-clay/10 bg-white shadow-sm shadow-clay/5">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link to="/" className="flex items-center gap-3" aria-label="Rodriguez home">
          <span className="grid size-10 place-items-center rounded-full bg-clay text-white ring-1 ring-clay/15">
            <strong className="font-display text-xl">R</strong>
          </span>
          <span>
            <strong className="block font-display text-xl leading-none">Rodriguez</strong>
            <small className="text-[10px] uppercase tracking-[.24em] text-forest/60">Family archive</small>
          </span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `text-sm font-medium transition ${isActive ? 'text-clay' : 'text-ink/70 hover:text-forest'}`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <Link className="rounded-full border border-clay/20 bg-clay/10 px-5 py-2.5 text-sm font-semibold text-forest hover:bg-clay hover:text-white" to="/tree">
            Explore generations
          </Link>
        </nav>
        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <nav className="border-t border-clay/10 bg-white/95 px-5 py-5 md:hidden">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} onClick={() => setOpen(false)} className="block py-3 font-medium">
              {link.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}
