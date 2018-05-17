import { createProvenanceMiddleware, CreateUndoAction } from '../src/provenance-redux';
import { applyMiddleware, createStore, Middleware, Reducer, Store } from 'redux';
import {
  ProvenanceGraph,
  ProvenanceGraphTraverser,
  ProvenanceTracker,
  api,
  ActionFunctionRegistry
} from '@visualstorytelling/provenance-core';

function isStateNode(node: api.Node): node is api.StateNode {
  return 'action' in node;
}
const createUndoAction: CreateUndoAction = (action, currentState) => ({
  type: 'SET_STATE',
  state: currentState
});

describe('provenance-redux', () => {
  test('it imports', () => {
    expect(1).toBe(1);
  });
  test('it creates without throwing', () => {
    const { middleware, tracker, graph, registry } = createProvenanceMiddleware(createUndoAction);
    expect(graph).toBeTruthy();
    expect(registry).toBeTruthy();
    expect(middleware).toBeTruthy();
    expect(tracker).toBeTruthy();
    const traverser = new ProvenanceGraphTraverser(registry, graph);
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
  let registry: ActionFunctionRegistry;
  let rootNode: api.Node;
  let store: Store<any>;

  beforeEach(() => {
    const result = createProvenanceMiddleware(createUndoAction);
    middleware = result.middleware;
    tracker = result.tracker;
    graph = result.graph;
    registry = result.registry;
    traverser = new ProvenanceGraphTraverser(registry, graph);
    rootNode = result.graph.current;

    const reducer: Reducer = (state, action) =>
      action.type === 'ADD' ? state + action.payload : state;
    const provenanceReducer: Reducer = (state, action) =>
      action.type === 'SET_STATE' ? action.state : reducer(state, action);

    store = createStore(provenanceReducer, 0 as any, applyMiddleware(middleware));
  });

  describe('single dispatch', () => {
    const add5Action = createAddAction(5);
    beforeEach(() => {
      store.dispatch(add5Action);
    });
    test('executed action', () => {
      expect(store.getState()).toEqual(5);
    });
    test('saves action', () => {
      expect(Object.keys(graph.current)).toContain('action');
      if (isStateNode(graph.current)) {
        expect(graph.current.action.doArguments[0]).toBe(add5Action);
      }
    });
  });

  describe('single dispatch and undo', () => {
    const add5Action = createAddAction(5);
    let intermediateNode: api.StateNode;
    beforeEach(async () => {
      await store.dispatch(add5Action);
      intermediateNode = graph.current as api.StateNode;
      await traverser.toStateNode(rootNode.id);
    });
    test('undo resets state', () => {
      expect(store.getState()).toEqual(0);
    });

    test('redo redoes action', async () => {
      await traverser.toStateNode(intermediateNode.id);
      expect(store.getState()).toEqual(5);
    });
  });
});
