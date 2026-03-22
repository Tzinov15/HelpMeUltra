export interface Race {
  id: string
  name: string
  date: string // YYYY-MM-DD
  totalMiles: number
  totalVertFt: number
  isMain: boolean
  createdAt: string // ISO timestamp
}

export type RaceInput = Omit<Race, 'id' | 'isMain' | 'createdAt'>
export type RaceUpdate = Partial<Omit<Race, 'id' | 'createdAt'>>
