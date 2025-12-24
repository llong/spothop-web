import { atom } from 'jotai'
import type { Spot, SpotFilters } from 'src/types'

export const spotsAtom = atom<Spot[]>([])
spotsAtom.debugLabel = 'spots'

export const filtersAtom = atom<SpotFilters>({})
filtersAtom.debugLabel = 'filters'

export const isFiltersOpenAtom = atom(false)
isFiltersOpenAtom.debugLabel = 'isFiltersOpen'
