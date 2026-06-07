import { BookOpen, Camera, HeartHandshake } from 'lucide-react';

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
      </div>
    </section>
  );
}
