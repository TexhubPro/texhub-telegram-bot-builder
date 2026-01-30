import { createContext } from 'react';
import type { NodeData } from '../types';

export type GraphActions = {
    onEditNode: (nodeId: string) => void;
    onDeleteNode: (nodeId: string) => void;
    onDeleteEdge: (edgeId: string) => void;
    onDuplicateNode: (nodeId: string) => void;
    onUpdateNode: (nodeId: string, patch: Partial<NodeData>) => void;
};

export const GraphActionsContext = createContext<GraphActions>({
    onEditNode: () => undefined,
    onDeleteNode: () => undefined,
    onDeleteEdge: () => undefined,
    onDuplicateNode: () => undefined,
    onUpdateNode: () => undefined,
});
