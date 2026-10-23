import type { PhilosopherTheme } from '../philosophers/types'

const WRITER_EXPLORE: Record<string, string[]> = {
  homer: [
    'Long poems preserve collective memory of war and exile before widespread writing.',
    'Glory on the battlefield clashes with the cost to families and captives.',
    'Odysseus’s return asks who we are after years of disguise and loss.',
    'Bards recited by heart—storytelling was public education and entertainment.',
  ],
  shakespeare: [
    'Kings and conspirators reveal how power corrodes conscience (Hamlet, Macbeth).',
    'Romance and treachery intertwined—love rarely escapes politics or pride.',
    'Coined phrases still shape how English speakers imagine emotion and fate.',
    'Peasant and prince alike wrestle with jealousy, ambition, and mercy.',
  ],
  cervantes: [
    'Don Quixote sees giants where others see windmills—when does vision become delusion?',
    'Laugh at the knight yet feel his hunger for a nobler world.',
    'Meta-fiction and unreliable narration become tools for modern novels.',
    'Spain’s empire and identity refracted through parody of chivalric books.',
  ],
  dostoevsky: [
    'Raskolnikov’s crime tests whether extraordinary people may override moral law.',
    'Underground Man and saints alike doubt God yet crave meaning.',
    'Suffering can break or deepen the soul—redemption never guaranteed.',
    'St Petersburg’s poverty and ideology mirror Europe’s spiritual crisis.',
  ],
  tolstoy: [
    'Napoleon’s invasion shows history as countless small choices, not only heroes.',
    'Marriage and adultery expose hypocrisy in polite society (Anna Karenina).',
    'Later essays reject violence and luxury—faith as simple peasant ethics.',
    'Long novels ask how to live honestly inside class and empire.',
  ],
  dickens: [
    'Factories and workhouses made child poverty impossible to ignore for readers.',
    'Oliver Twist and Pip show innocence surviving cruel institutions.',
    'London’s smoke and crowds become characters in social diagnosis.',
    'Humour and pathos invite middle-class readers to feel responsibility.',
  ],
  tagore: [
    'Nature and the divine blur in lyrics that influenced national song and spirit.',
    'Critique of nationalism that forgets the human person beyond borders.',
    'Shantiniketan school linked art, land, and child-centred learning.',
    'Bengali language elevated to world literature—not only colonial English.',
  ],
  murasaki: [
    'Characters’ motives and jealousy feel modern though court life is distant.',
    'Heian aristocracy’s aesthetics—colour, poetry, rank—frame every affair.',
    'Mono no aware: beauty heightened because it fades.',
    'Long prose narrative predates European novel by centuries.',
  ],
  woolf: [
    'Mrs Dalloway and others track thought in real time—mind as plot.',
    'Women need income and space to write; patriarchy wastes talent.',
    'World War I shattered Victorian certainty; form fragments to match.',
    'Hours and memory loop—present moments hold entire pasts.',
  ],
  achebe: [
    'Colonial arrival fractures Igbo life long before the administrator speaks.',
    'Okonkwo embodies tradition under pressure—not simple “primitive” foil.',
    'African stories must be told from inside, not only Conrad’s darkness.',
    'Novels and essays challenge textbooks and media stereotypes.',
  ],
  morrison: [
    'Beloved haunts because slavery’s trauma lives in mothers and children.',
    'Black communities carry folklore, flight, and naming as survival.',
    'Sentences sing—oral cadence meets modernist fragmentation.',
    'The body remembers what archives erase or sanitize.',
  ],
  soyinka: [
    'Plays blend Yoruba ritual with political satire—gods comment on dictators.',
    'Imprisonment and exile sharpen defence of free speech.',
    'Mythic cycles (e.g. Ogun) ground contemporary Nigerian conflict.',
    'Nobel platform used to challenge tyranny across the continent.',
  ],
  marquez: [
    'Ordinary miracles—rain of flowers, ghosts at table—encode Latin American history.',
    'Macondo’s isolation echoes towns left out of global “progress” narratives.',
    'Civil wars and strikes appear as family gossip and prophecy.',
    'Continent’s memory told as saga, not only official chronicle.',
  ],
  hurston: [
    'Collected sermons, songs, and tales—Black culture as scholarly source.',
    'Janie’s three marriages trace autonomy, not only romance.',
    'Dialect written with respect, not minstrel mockery.',
    'Harlem peers debated art vs. protest—Hurston chose folk depth.',
  ],
  kafka: [
    'Josef K. never learns his charge—law as opaque, endless procedure.',
    'Gregor Samsa’s insect body literalises family shame and economic burden.',
    'Guilt persists even when no sin is named—modern psyche on trial.',
    'Prague’s bureaucracy and family pressure distilled into nightmare fables.',
  ],
  adichie: [
    'Biafra war scars generations; private love survives public collapse.',
    'Americanah tracks hair, accent, and return—belonging never single.',
    'TED talks on “single story” extend fiction’s fight against stereotypes.',
    'Nigerian and diaspora voices in one conversation—global yet local.',
  ],
  orwell: [
    'Big Brother and Newspeak show how language control steers thought.',
    'Farm animals expose revolution betrayed by new elites.',
    'Essays on coal mines and empire from lived reporting, not theory alone.',
    'Plain style as ethics—clarity against propaganda.',
  ],
  rumi: [
    'Longing for the divine described as human love stretched toward infinity.',
    'Separation and reunion with “the Friend” mirror Sufi spiritual path.',
    'Whirling and verse turn emotion into disciplined devotion.',
    'Persian poetry now quoted worldwide—translation as new life.',
  ],
}

const WRITER_FALLBACK =
  'Strong angle for podcast questions on craft, audience, and how African listeners relate to this voice.'

export function mergeWriterThemes(id: string, titles: string[]): PhilosopherTheme[] {
  const notes = WRITER_EXPLORE[id] ?? []
  return titles.map((title, i) => ({
    title,
    explore: notes[i] ?? WRITER_FALLBACK,
  }))
}
