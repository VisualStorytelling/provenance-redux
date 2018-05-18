# Provenance Redux

[![Build Status](https://travis-ci.org/VisualStorytelling/provenance-redux.svg?branch=master)](https://travis-ci.org/VisualStorytelling/provenance-redux)
[![Coverage Status](https://coveralls.io/repos/github/VisualStorytelling/provenance-redux/badge.svg?branch=master)](https://coveralls.io/github/VisualStorytelling/provenance-redux?branch=master)

Provenance Redux integrates redux and the [VisualStoryTelling/provenance-core](https://github.com/visualstorytelling/provenance-core) library.
It allows to easily add complex multi-branched undo/redo functionality to redux.

## Install

```
npm install provenance-redux
```

## Usage

### Undo actions
To allow the `provenance` library to undo your actions, it needs to know how to
invert the actions that are dispatched to the redux store. The user has
to provide a function that can construct this inverse action from the
original action and the current state.

E.g. an easy implementation would be the following:
```javascript
  const createUndoAction = (action, currentState) => ({
    type: 'SET_STATE',
    state: currentState
  });
```
Ofcourse this action needs to be recognized by your reducer. You can patch your existing 
root `reducer` by e.g.
```javascript
  const provenanceReducer = (state, action) =>
        action.type === 'SET_STATE' ? action.state : reducer(state, action);
```
Is this a good idea? Depending on the size of your state and the number of steps this could
quickly use a lot of memory (since the state is stored at each step). So you might want to provide
more fine-tuned undo actions.

### Middleware
You can now construct the middleware, you have to provide your createUndoAction:
```javascript
  const {middleware, tracker, graph, registry} = createProvenanceMiddleware(createUndoAction);
```
You should then register the middleware when you create the Redux store
```javascript
  const store = createStore(provenanceReducer, INITIAL_STATE, applyMiddleware(middleware));
```
If you are using other Redux middlewares, note that **the order matters**. You probably want
the provenance-redux middleware first. (This is because the middleware consumes an action, and
dispatches it again with a property `fromProvenance` added to the action. So other middlewares
will get the action twice if they are applied before the `provenance-redux` middleware.

Afterwards you can use the provenance traversing etc. according to the documentation at
[provenance-core](https://github.com/VisualStorytelling/provenance-core).

### Develop

```bash
git clone https://github.com/VisualStorytelling/provenance-redux.git
cd provenance-redux

npm install
```

### NPM scripts

 - `npm t`: Run test suite
 - `npm start`: Run `npm run build` in watch mode
 - `npm run test:watch`: Run test suite in [interactive watch mode](http://facebook.github.io/jest/docs/cli.html#watch)
 - `npm run test:prod`: Run linting and generate coverage
 - `npm run build`: Generate bundles and typings, create docs
 - `npm run lint`: Lints code
 - `npm run commit`: Commit using conventional commit style ([husky](https://github.com/typicode/husky) will tell you to use it if you haven't :wink:)

### Excluding peerDependencies

On library development, one might want to set some peer dependencies, and thus remove those from the final bundle. You can see in [Rollup docs](https://rollupjs.org/#peer-dependencies) how to do that.

Good news: the setup is here for you, you must only include the dependency name in `external` property within `rollup.config.js`. For example, if you want to exclude `lodash`, just write there `external: ['lodash']`.

### Automatic releases

_**Prerequisites**: you need to create/login accounts and add your project to:_
 - [npm](https://www.npmjs.com/)
 - [Travis CI](https://travis-ci.org)
 - [Coveralls](https://coveralls.io)

_**Prerequisite for Windows**: Semantic-release uses
**[node-gyp](https://github.com/nodejs/node-gyp)** so you will need to
install
[Microsoft's windows-build-tools](https://github.com/felixrieseberg/windows-build-tools)
using this command:_

```bash
npm install --global --production windows-build-tools
```

#### Setup steps

Follow the console instructions to install semantic release and run it (answer NO to "Do you want a `.travis.yml` file with semantic-release setup?").

```bash
npm install -g semantic-release-cli
semantic-release-cli setup
# IMPORTANT!! Answer NO to "Do you want a `.travis.yml` file with semantic-release setup?" question. It is already prepared for you :P
```

From now on, you'll need to use `npm run commit`, which is a convenient way to create conventional commits.

Automatic releases are possible thanks to [semantic release](https://github.com/semantic-release/semantic-release), which publishes your code automatically on [github](https://github.com/) and [npm](https://www.npmjs.com/), plus generates automatically a changelog. This setup is highly influenced by [Kent C. Dodds course on egghead.io](https://egghead.io/courses/how-to-write-an-open-source-javascript-library)

### Git Hooks

There is already set a `precommit` hook for formatting your code with Prettier :nail_care:

By default, there are two disabled git hooks. They're set up when you run the `npm run semantic-release-prepare` script. They make sure:
 - You follow a [conventional commit message](https://github.com/conventional-changelog/conventional-changelog)
 - Your build is not going to fail in [Travis](https://travis-ci.org) (or your CI server), since it's runned locally before `git push`

This makes more sense in combination with [automatic releases](#automatic-releases)
