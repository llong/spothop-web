import { useAtomDevtools } from 'jotai-devtools';
import { userAtom } from 'src/atoms/auth';


export function useDevtools() {
    useAtomDevtools(userAtom, { name: 'user' });

    //   useAtomDevtools(spotsAtom, { name: 'spots' });
}
