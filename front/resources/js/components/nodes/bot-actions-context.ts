import { createContext } from 'react';

export type BotActions = {
    onStart: () => void;
    onStop: () => void;
};

export const BotActionsContext = createContext<BotActions>({
    onStart: () => undefined,
    onStop: () => undefined,
});
