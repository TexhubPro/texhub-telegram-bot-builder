import { createContext } from 'react';

export type AddEdgeMenuActions = {
    onOpenAddMenu: (nodeId: string, position: { x: number; y: number }, sourceHandle?: string) => void;
};

export const AddEdgeMenuContext = createContext<AddEdgeMenuActions>({
    onOpenAddMenu: () => undefined,
});
