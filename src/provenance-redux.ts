import {
  ActionFunctionRegistry,
  ProvenanceGraph,
  ProvenanceTracker
} from '@visualstorytelling/provenance-core';
import { AnyAction, Dispatch, MiddlewareAPI } from 'redux';

export interface Middleware {
  (api: any): (next: any) => (action: any) => any;
}

export type CreateUndoAction = (action: AnyAction, state: any) => AnyAction;
export type ProvenanceAction = AnyAction & { fromProvenance: true };

export function isProvenanceAction(action: AnyAction): action is ProvenanceAction {
  return 'fromProvenance' in action;
}

export const createProvenanceMiddleware = (createUndoAction: CreateUndoAction) => {
  const registry = new ActionFunctionRegistry();
  const graph = new ProvenanceGraph({
    name: 'provenance-redux',
    version: '1.0.0'
  });
  const tracker = new ProvenanceTracker(registry, graph);

  const middleware: Middleware = (store: MiddlewareAPI) => {
    registry.register('dispatchAction', (action: AnyAction) =>
      Promise.resolve(store.dispatch({ ...action, fromProvenance: true }))
    );
    return (next: Dispatch<AnyAction>) => (action: AnyAction) => {
      if (isProvenanceAction(action)) {
        return next(action);
      } else {
        const undoAction = createUndoAction(action, store.getState());
        return tracker.applyAction({
          do: 'dispatchAction',
          doArguments: [action],
          undo: 'dispatchAction',
          undoArguments: [undoAction]
        });
      }
    };
  };

  return {
    middleware,
    graph,
    tracker,
    registry
  };
};
