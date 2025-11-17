import { atom } from 'jotai'
import type { Spot } from 'src/types'

export const spotsAtom = atom<Spot[]>([])
spotsAtom.debugLabel = 'spots'
