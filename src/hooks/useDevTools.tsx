import { useAtomDevtools } from 'jotai-devtools';
import { userAtom } from '@/atoms/auth';


export function useDevtools() {
    useAtomDevtools(userAtom, { name: 'user' });

    //   useAtomDevtools(spotsAtom, { name: 'spots' });
}
