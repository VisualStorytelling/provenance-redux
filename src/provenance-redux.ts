import {
  ActionFunctionRegistry,
  ProvenanceGraph,
  ProvenanceGraphTraverser,
  ProvenanceTracker
} from '@visualstorytelling/provenance-core';
import { AnyAction, Dispatch, Middleware, MiddlewareAPI } from 'redux';

export type ReduxState = { [key: string]: any };
export type CreateUndoAction = (action: AnyAction, state: ReduxState) => AnyAction;
export type ProvenanceAction = AnyAction & { fromProvenance: true };

export function isProvenanceAction(action: AnyAction): action is ProvenanceAction {
  return 'fromProvenance' in action;
}

export const createProvenanceMiddleware = (createUndoAction: CreateUndoAction) => {
  const registry = new ActionFunctionRegistry();
  const graph = new ProvenanceGraph({
    name: 'test',
    version: '1.0.0'
  });
  const tracker = new ProvenanceTracker(registry, graph);
  const traverser = new ProvenanceGraphTraverser(registry, graph);

  const middleware: Middleware = (store: MiddlewareAPI) => {
    registry.register('dispatchAction', (action: AnyAction) =>
      Promise.resolve(store.dispatch({ ...action, fromProvenance: true }))
    );
    return (next: Dispatch<AnyAction>) => (action: AnyAction) => {
      if (isProvenanceAction(action)) {
        return next(action);
      } else {
        const undoAction = createUndoAction(action, store.getState());
        tracker.applyAction({
          do: 'dispatchAction',
          doArguments: [action],
          undo: 'dispatchAction',
          undoArguments: [undoAction],
          metadata: {
            createdBy: 'provenance-redux',
            createdOn: new Date().toDateString(),
            tags: [],
            userIntent: 'default'
          }
        });
      }
      return null;
    };
  };

  return {
    middleware,
    graph,
    tracker,
    traverser
  };
};

// const provenanceReducer = (state, action) => action.type === 'SET_STATE' ? action.state : rootReducer(state, action);
// const createUndoAction = (action, currentState) => {
//   return ({
//     type: 'SET_STATE',
//     state: currentState
//   })
// };
