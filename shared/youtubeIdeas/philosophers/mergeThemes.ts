import type { Philosopher, PhilosopherTheme } from './types'

/** One-line “explore” notes — adds depth without long essays. */
const EXPLORE: Record<string, string[]> = {
  socrates: [
    'Ask layered questions until beliefs face their own contradictions.',
    'A life unexamined is not worth living—ethics starts with self-scrutiny.',
    'Admits ignorance as the beginning of wisdom, not weakness.',
    'Citizens must justify laws and habits, not inherit them blindly.',
  ],
  plato: [
    'Reality’s deepest level may be intelligible forms, not appearances.',
    'Justice in soul and city mirror each other; disorder in one spreads to both.',
    'Who should rule? Those trained to love truth, not popularity.',
    'Learning as remembering what the soul already knows.',
    'Art and poetry can educate—or manipulate—the passions.',
  ],
  aristotle: [
    'Flourishing (eudaimonia) is active virtue over a whole life, not a mood.',
    'Virtue often lies between excess and deficiency—courage between cowardice and rashness.',
    'Four causes explain change; science begins with careful observation.',
    'Humans are political animals; the good life needs just institutions.',
    'Friendship and practical wisdom (phronesis) guide daily moral choice.',
  ],
  epicurus: [
    'Peace of mind matters more than endless luxury or status.',
    'Simple pleasures and trusted friends beat extravagant consumption.',
    'Community in the “garden” replaces competition and fear.',
    'Freeing the mind from superstition reduces unnecessary anxiety.',
  ],
  'zeno-stoa': [
    'Align choices with nature and reason, not impulse.',
    'Focus effort only on what you can control; accept the rest with dignity.',
    'Wealth and fame are “indifferents”—only virtue is truly good.',
    'All humans share reason—cosmopolitan duty follows.',
  ],
  diogenes: [
    'Strip life to essentials to expose society’s empty rituals.',
    'Live according to nature, not fashion or reputation.',
    'Integrity in public life shames those who merely perform virtue.',
    'Mockery as philosophy—laughter unsettles kings and crowds.',
  ],
  pythagoras: [
    'Mathematical ratios reveal harmony in music and cosmos.',
    'Soul may journey through lives—ethics spans more than one lifespan.',
    'Discipline of body and speech prepares the mind.',
    'Number as key to order, not mere calculation.',
  ],
  heraclitus: [
    'Everything flows; stability is temporary pattern, not frozen substance.',
    'Deep law (logos) orders change even when chaos seems dominant.',
    'Opposites depend on each other—day/night, war/peace.',
    'Most people sleepwalk; the wise seek the hidden unity.',
  ],
  seneca: [
    'Anger, grief, and fear can be trained like physical habits.',
    'Life is short; squander time and you squander self.',
    'Rich men can still be slaves to desire; poverty can be freedom.',
    'Serving bad rulers tests character—inner freedom remains.',
  ],
  'marcus-aurelius': [
    'Start each day expecting friction—prepare the mind, not just plans.',
    'All things pass; attachment to fame or permanence breeds suffering.',
    'The emperor serves the whole, not personal vanity.',
    'Judge impressions before they become compulsive reactions.',
  ],
  epictetus: [
    'You are free in choice and assent even when externals are constrained.',
    'Events are neutral; our stories about them create suffering.',
    'Hardship becomes training when accepted as material for virtue.',
    'Philosophy is lived practice, not lecture attendance.',
  ],
  cicero: [
    'Law should express shared reason, not arbitrary will of rulers.',
    'Speech shapes republics—for good or manipulation.',
    'Natural law idea: justice transcends positive statute.',
    'Office is duty to the res publica, not personal glory.',
  ],
  ptahhotep: [
    'Leaders listen before commanding—silence teaches humility.',
    'Truthful, measured speech preserves social trust.',
    'Elders transmit norms; youth must learn before leading.',
    'Harmony in the household scales to harmony in the state.',
  ],
  imhotep: [
    'Wisdom joins technical skill with service to community.',
    'Healing ties body, society, and moral order.',
    'Great works outlive the builder—legacy is ethical, not vanity.',
    'Knowledge of nature and ritual need not conflict.',
  ],
  'augustine-hippo': [
    'Memory holds the self together—and reveals fragmentation.',
    'Evil as lack or distortion, not equal rival to good.',
    'Desire misdirected distorts love; grace reorders the will.',
    'Two cities: love of self vs. love of God—political metaphors follow.',
  ],
  'zera-yacob': [
    'Reason can test tradition without abandoning faith.',
    'Custom alone cannot justify inequality or cruelty.',
    'Each person bears dignity discoverable by inquiry.',
    'Conscience before crowd opinion.',
  ],
  ubuntu: [
    'Personhood is relational—harm to one diminishes all.',
    'Dignity restored through recognition, not charity alone.',
    'Truth-telling and forgiveness rebuild broken communities.',
    'Justice seeks balance, not endless punishment.',
  ],
  wiredu: [
    'Translate concepts through African languages to avoid imported confusion.',
    'Truth may be negotiated in community, not only declared by experts.',
    'Critique tradition without dismissing it wholesale.',
    'Democracy needs culturally grounded public reasoning.',
  ],
  hountondji: [
    'Philosophy is argument and proof, not collected proverbs alone.',
    'African universities must produce knowledge, not only consume it.',
    'Folklore is data, not substitute for critical theory.',
    'History of ideas includes Africa as producer, not object.',
  ],
  'ibn-sina': [
    'Existence and essence debated—what must a thing be to be real?',
    'Intellect links soul to eternal truths.',
    'Medicine requires ethics—healing serves human flourishing.',
    'Necessary being (God) grounds contingent world.',
  ],
  'ibn-rushd': [
    'Philosophy and scripture address different layers of one truth.',
    'Law needs rational interpretation as society changes.',
    'Tension between literalists and philosophers in every tradition.',
    'Public reasoning strengthens faith, not weakens it.',
  ],
  'al-ghazali': [
    'Outward ritual without inner sincerity is hollow.',
    'Intellectual pride blocks spiritual sight.',
    'Disciplined practice transforms character, not just belief labels.',
    'Intention (niyya) defines moral worth of action.',
  ],
  'ibn-khaldun': [
    'Group solidarity (asabiyya) builds and destroys dynasties.',
    'States rise on cohesion, fall on luxury and division.',
    'History needs sociology, not only chronicle of kings.',
    'Economy and climate shape political fate.',
  ],
  rumi: [
    'Love of the divine dissolves petty ego boundaries.',
    'Ego clings; surrender opens transformation.',
    'Poetry as path—story and metaphor carry what logic cannot.',
    'Unity beneath apparent religious and cultural difference.',
  ],
  buddha: [
    'Suffering has causes—craving and ignorance can be understood.',
    'Nothing stays the same; clinging to permanence hurts.',
    'Letting go is skill, not cold indifference.',
    'Compassion and mindful attention train the mind daily.',
  ],
  nagarjuna: [
    'Emptiness means lack of fixed essence—not that nothing exists.',
    'All things arise dependently; nothing stands alone.',
    'Avoid extremes of eternalism and nihilism.',
    'Language fails at ultimate truth but guides the path.',
  ],
  shankara: [
    'Atman and Brahman ultimately one—difference is practical, not final.',
    'World appears real yet masks deeper non-duality.',
    'Liberation through knowledge (jnana) and disciplined life.',
    'Ritual prepares mind; insight completes the journey.',
  ],
  kautilya: [
    'State survival requires cold realism about enemies and allies.',
    'Economy and spying are extensions of ethics of rule.',
    'Power without justice collapses; justice without power is overrun.',
    'Treaties and war follow interest, not sentiment.',
  ],
  ambedkar: [
    'Caste denies full personhood—constitutional equality responds.',
    'Democracy needs social reform, not only ballots.',
    'Conversion as spiritual and political liberation for Dalits.',
    'Education as weapon against humiliation.',
  ],
  tagore: [
    'Education should nurture creativity, not produce clerks.',
    'Spirituality without dogma—humanity in nature and art.',
    'Nationalism becomes poison when it excludes.',
    'Dialogue between civilisations enriches both.',
  ],
  confucius: [
    'Ren: humaneness grows through habit, ritual, and care for others.',
    'Rites shape emotion—they civilise raw impulse.',
    'Leaders model virtue; people follow example more than orders.',
    'Family roles train citizens for public responsibility.',
  ],
  laozi: [
    'Act without forcing (wu wei)—water wears down stone by yielding.',
    'Simplicity reduces conflict and desire.',
    'Softness overcomes hardness in politics and personal life.',
    'The Way (Dao) cannot be fully captured in words.',
  ],
  zhuangzi: [
    'Perspectives shift—what is “useful” depends on context.',
    'Fixed categories trap the free mind.',
    'Spontaneity (ziran) over rigid ambition.',
    'Death and life as transformations, not absolute tragedies.',
  ],
  mencius: [
    'Heart-mind contains sprouts of compassion and righteousness.',
    'Bad government provokes rebellion—it loses the Mandate.',
    'People’s welfare defines legitimacy of rulers.',
    'Moral growth like nurturing a plant—environment matters.',
  ],
  xunzi: [
    'Desires default selfish—ritual and law shape social beings.',
    'Education transforms raw human material into citizens.',
    'Order requires institutions, not hope alone.',
    'Realism about human tendency, optimism about cultivation.',
  ],
  descartes: [
    'Doubt everything dubitable until firm ground appears.',
    'Mind and body distinct—raises modern mind-body problems.',
    'Clear ideas as foundation for science and certainty.',
    'Method over tradition in gaining knowledge.',
  ],
  spinoza: [
    'Freedom grows as we understand necessity, not deny it.',
    'Emotions understood are emotions transformed.',
    'Democracy protects reason better than sectarian rule.',
    'Nature/God as single substance—ethics follows metaphysics.',
  ],
  locke: [
    'Experience writes on the mind—innate ideas rejected.',
    'Government needs consent; rebellion justified if trust broken.',
    'Property and labour mix—raises questions of fairness today.',
    'Tolerance limits state power over conscience.',
  ],
  hume: [
    'We never “see” causation—habit predicts, reason interprets.',
    'Self is bundle of perceptions, not solid substance.',
    'Morality ties to sentiment and sympathy, not pure logic.',
    'Miracles need extraordinary evidence—sceptical standard.',
  ],
  kant: [
    'Act only on maxims you could will as universal law.',
    'Treat humanity never merely as means, always also as end.',
    'Mind structures experience—we know phenomena, not things-in-themselves.',
    'Duty may conflict with inclination—that is moral seriousness.',
  ],
  hegel: [
    'History moves through conflict toward greater freedom—contested claim.',
    'Master and slave dialectic: recognition shapes identity.',
    'Individual freedom realised in ethical life of institutions.',
    'Understanding whole context, not isolated facts.',
  ],
  marx: [
    'Material conditions shape ideas—who owns production matters.',
    'Work can alienate when others control labour and profit.',
    'Class conflict drives historical change—debated empirically.',
    'Ideology hides interests—critique exposes false consciousness.',
  ],
  nietzsche: [
    'Morality has history—slave vs. master values compete.',
    'Create values after diagnosing old ones as life-denying.',
    'Eternal recurrence as test: could you will this life again?',
    'Art and strength celebrate life beyond guilt culture.',
  ],
  sartre: [
    'No fixed human essence—we define ourselves by choices.',
    'Bad faith denies freedom—roles become excuses.',
    'Radical responsibility: even not choosing is a choice.',
    'Literature and politics must engage real suffering.',
  ],
  'de-beauvoir': [
    'Woman constructed as Other—freedom denied by social roles.',
    'Oppression limits authentic projects of oppressed groups.',
    'Ethics lives in ambiguity—no pure heroes or villains.',
    'Love should affirm other’s freedom, not possess.',
  ],
  camus: [
    'Universe silent on meaning—humans still choose attitude.',
    'Revolt against absurdity without false utopias.',
    'Plague as metaphor for collective moral responsibility.',
    'Violence easily betraying justice it claims to serve.',
  ],
  wollstonecraft: [
    'Women denied education, then blamed for “weak” reason.',
    'Republics fail if half citizens are subordinated.',
    'Luxury corrupts character—applies to elites broadly.',
    'Virtue requires independence of mind for all sexes.',
  ],
  mill: [
    'Speech free until clear harm to others—debated boundary.',
    'Some pleasures higher in quality—intellectual vs. mere sensation.',
    'Women’s subordination wastes human talent.',
    'Utility: greatest good, carefully counted, not crude majority tyranny.',
  ],
  russell: [
    'Logical clarity prevents philosophical confusion.',
    'Question authority with evidence, not cynicism for its own sake.',
    'Peace as political virtue—war rarely last resort.',
    'Education should teach how to think, not what to memorise.',
  ],
  wittgenstein: [
    'Meaning is use in language games—context fixes sense.',
    'Private language argument: inner sensations need public criteria.',
    'What cannot be said clearly may still be shown—or lived.',
    'Philosophy therapy: dissolve puzzles, not only solve them.',
  ],
  foucault: [
    'Prisons, clinics, schools discipline bodies and selves.',
    'Power produces knowledge, not only represses it.',
    'Genealogy shows how “normal” was invented historically.',
    'Subjectivity shaped by practices—we can resist and reshape.',
  ],
  arendt: [
    'Ordinary people commit horror by following rules unthinkingly.',
    'Politics needs public space where diverse voices appear.',
    'Totalitarianism destroys plurality and spontaneity.',
    'New beginnings (natality) possible in political action.',
  ],
  dubois: [
    'Two souls, two unreconciled strivings—Black identity in white society.',
    'Education lifts people who systems keep down.',
    'Democracy incomplete while race caste persists.',
    'Africa and diaspora linked in political imagination.',
  ],
  king: [
    'Nonviolence as active force, not passive weakness.',
    'Beloved community: justice plus reconciliation.',
    'Unjust laws merit civil disobedience with willingness to pay cost.',
    'Dignity of every person grounds human rights.',
  ],
  west: [
    'Prophetic tradition calls empire and nihilism to account.',
    'Democracy needs love and justice, not only procedure.',
    'Structural racism and capitalism intertwined—debated remedies.',
    'Music and culture carry philosophy to the street.',
  ],
  emerson: [
    'Trust inner voice against conformist “consistency”.',
    'Nature mirrors spiritual truth for attentive minds.',
    'Self-reliance as moral courage, not selfish isolation.',
    'Reform society by living higher principles publicly.',
  ],
  thoreau: [
    'Simple living clarifies what truly matters.',
    'Individual conscience may require breaking unjust laws.',
    'Walden experiment: distance from noise to hear self.',
    'Wildness preserves sanity and moral perspective.',
  ],
  marti: [
    'Latin American unity against colonial and imperial divide-and-rule.',
    'Culture and poetry fuel liberation movements.',
    'Warns small nations against dependence on northern power.',
    'Liberty requires moral as well as military struggle.',
  ],
  bolivar: [
    'Republics need virtue in citizens, not only constitutions.',
    'Geographic unity hard—federation vs. centralism debated.',
    'Liberty without order collapses into chaos.',
    'Post-colonial elites face race, class, and regional divides.',
  ],
}

export function mergePhilosopherThemes(
  id: string,
  titles: string[],
): PhilosopherTheme[] {
  const notes = EXPLORE[id] ?? []
  return titles.map((title, i) => ({
    title,
    explore: notes[i] ?? 'Worth connecting to African moral debates, governance, and everyday life.',
  }))
}

export function normalizePhilosopher(raw: Omit<Philosopher, 'themes'> & { themes: string[] }): Philosopher {
  return {
    ...raw,
    themes: mergePhilosopherThemes(raw.id, raw.themes),
  }
}
