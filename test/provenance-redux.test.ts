import { createProvenanceMiddleware, CreateUndoAction } from '../src/provenance-redux';
import { applyMiddleware, createStore, Middleware, Reducer, Store } from 'redux';
import {
  ProvenanceGraph,
  ProvenanceGraphTraverser,
  ProvenanceTracker
} from '@visualstorytelling/provenance-core';

const createUndoAction: CreateUndoAction = (action, currentState) => {
  return {
    type: 'SET_STATE',
    state: currentState
  };
};

describe('provenance-redux', () => {
  test('it imports', () => {
    expect(1).toBe(1);
  });
  test('it creates without throwing', () => {
    const { middleware, tracker, graph, traverser } = createProvenanceMiddleware(createUndoAction);
    expect(middleware).toBeTruthy();
    expect(tracker).toBeTruthy();
    expect(graph).toBeTruthy();
    expect(traverser).toBeTruthy();
  });
});

describe('with redux', () => {
  const createAddAction = (num: number) => ({
    type: 'ADD',
    payload: num
  });

  let middleware: Middleware;
  let tracker: ProvenanceTracker;
  let graph: ProvenanceGraph;
  let traverser: ProvenanceGraphTraverser;
  let store: Store<any>;
  beforeEach(() => {
    const result = createProvenanceMiddleware(createUndoAction);
    middleware = result.middleware;
    tracker = result.tracker;
    graph = result.graph;
    traverser = result.traverser;

    const reducer: Reducer = (state, action) =>
      action.type === 'ADD' ? state + action.payload : state;
    const provenanceReducer: Reducer = (state, action) =>
      action.type === 'SET_STATE' ? action.state : reducer(state, action);

    store = createStore(provenanceReducer, { currentValue: 0 }, applyMiddleware(middleware));
  });

  describe('single dispatch', () => {
    beforeEach(() => {
      store.dispatch(createAddAction(5));
    });
  });
});
