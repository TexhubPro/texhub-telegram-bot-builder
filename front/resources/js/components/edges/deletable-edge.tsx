import { useContext } from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from 'reactflow';
import { GraphActionsContext } from '../nodes/graph-actions-context';
import { TrashIcon } from '../ui/icons';

export function DeletableEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style, markerEnd }: EdgeProps) {
    const { onDeleteEdge } = useContext(GraphActionsContext);
    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourcePosition,
        targetPosition,
    });

    return (
        <>
            <BaseEdge path={edgePath} style={style} markerEnd={markerEnd} />
            <EdgeLabelRenderer>
                <div
                    className="nodrag nopan absolute"
                    style={{
                        transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                        pointerEvents: 'all',
                        zIndex: 10,
                    }}
                >
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            onDeleteEdge(id);
                        }}
                        className="flex h-4 w-4 cursor-pointer items-center justify-center rounded-md bg-red-500 p-0.5 text-white transition hover:bg-red-600"
                        aria-label="Удалить связь"
                    >
                        <TrashIcon />
                    </button>
                </div>
            </EdgeLabelRenderer>
        </>
    );
}
