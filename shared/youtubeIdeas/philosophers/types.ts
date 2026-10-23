export type PhilosopherTheme = {
  title: string
  explore: string
}

export type Philosopher = {
  id: string
  name: string
  lifespan: string
  region: string
  tradition: string
  bio: string
  themes: PhilosopherTheme[]
}
