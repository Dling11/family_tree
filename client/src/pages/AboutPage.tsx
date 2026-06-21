import { BookOpen, Camera, HeartHandshake } from 'lucide-react';

const childOrderGroups = [
  { word: 'RAT', names: ['Rodrigo', 'Anita', 'Teddy'] },
  { word: 'PET', names: ['Perla', 'Elvira', 'Teresita'] },
  { word: 'RED', names: ['Rowena', 'Elpidio de-Leon', 'Daisy'] },
  { word: 'COW', names: ['Cristina', 'Ofelia', 'Wilma'] },
];

export function AboutPage() {
  return (
    <section>
      <div className="bg-forest px-5 py-24 text-center text-white">
        <p className="eyebrow !text-sand">About this family tree</p>
        <h1 className="mx-auto mt-5 max-w-4xl font-display text-5xl leading-tight sm:text-6xl">A place for Rodriguez family memories.</h1>
        <p className="mx-auto mt-6 max-w-2xl leading-7 text-white/65">This site keeps our photos, names, and family connections together so they are easier to share and remember.</p>
      </div>
      <div className="mx-auto max-w-6xl px-5 py-24">
        <div className="grid gap-8 md:grid-cols-3">
          {[
            [BookOpen, 'Remember', 'Add names, dates, places, and notes while we still know them.'],
            [Camera, 'Photos', 'Keep family pictures together with the people they belong to.'],
            [HeartHandshake, 'Connections', 'Show how each person is connected in the Rodriguez family.'],
          ].map(([Icon, title, text]) => (
            <article key={String(title)} className="rounded-[2rem] bg-white p-8 shadow-soft">
              <Icon className="text-clay" size={30} />
              <h2 className="mt-8 font-display text-3xl text-forest">{String(title)}</h2>
              <p className="mt-4 leading-7 text-ink/60">{String(text)}</p>
            </article>
          ))}
        </div>
        <div className="mt-16 overflow-hidden rounded-[2rem] border border-clay/15 bg-white shadow-soft">
          <div className="grid gap-0 lg:grid-cols-[.85fr_1.15fr]">
            <div className="bg-clay p-8 text-white sm:p-10">
              <p className="text-xs font-bold uppercase tracking-[.2em] text-white/60">A family way to remember</p>
              <h2 className="mt-4 font-display text-4xl">Rat Pet Red Cow</h2>
              <p className="mt-5 leading-7 text-white/75">
                Lolo used to say the order of their twelve children this way. It sounds funny at first, but it helped the family remember the arrangement from eldest to youngest.
              </p>
            </div>
            <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
              {childOrderGroups.map((group) => (
                <article key={group.word} className="rounded-3xl bg-cream p-5">
                  <strong className="font-display text-3xl text-clay">{group.word}</strong>
                  <ol className="mt-4 space-y-2 text-sm font-semibold text-ink/70">
                    {group.names.map((name) => <li key={name}>{name}</li>)}
                  </ol>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
