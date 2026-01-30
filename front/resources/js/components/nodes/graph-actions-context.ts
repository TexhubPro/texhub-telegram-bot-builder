import { createContext } from 'react';

export type GraphActions = {
    onEditNode: (nodeId: string) => void;
    onDeleteNode: (nodeId: string) => void;
    onDeleteEdge: (edgeId: string) => void;
    onDuplicateNode: (nodeId: string) => void;
};

export const GraphActionsContext = createContext<GraphActions>({
    onEditNode: () => undefined,
    onDeleteNode: () => undefined,
    onDeleteEdge: () => undefined,
    onDuplicateNode: () => undefined,
});
