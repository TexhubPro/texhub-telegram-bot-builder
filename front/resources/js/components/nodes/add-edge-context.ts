import { createContext } from 'react';

export type AddEdgeMenuActions = {
    onOpenAddMenu: (nodeId: string, position: { x: number; y: number }) => void;
};

export const AddEdgeMenuContext = createContext<AddEdgeMenuActions>({
    onOpenAddMenu: () => undefined,
});
