module.exports = ({React}) => {
    function getImmutableState() {
        return this.state.cachedState;
    }

    return (config) => {
        const Immutable = require('immutable');
        const contextTypes = require('./context-types')({React});
        const {immutableStateChanged} = require('./helpers');

        const {fromJS, is} = Immutable;
        const {createClass, PropTypes} = React;

        const isArray = Array.isArray;
        const NOT_SET = {};

        const just = (v) => () => v;

        const {
            getPath,
            getChildProps,
            getDefaultState = just({}),
            shouldComponentUpdate
        } = config;

        const mixin = {
            contextTypes,
            childContextTypes: contextTypes,

            shouldComponentUpdate,

            getChildContext() {
                const {immutableState} = this.state;

                return {immutableStateComponentContext: immutableState};
            },

            getInitialState() {
                const {props, context} = this;
                const {immutableStateComponentContext} = context;
                const {root, value: parentValue, path: parentPath, onChange} = immutableStateComponentContext;
                const path = getPath.call(this, props, context);
                const maybeValue = isArray(path) ? parentValue.getIn(path, NOT_SET) : parentValue.get(path, NOT_SET);
                const value = maybeValue === NOT_SET ? fromJS(getDefaultState.call(this, props, context)) : maybeValue;

                return {
                    cachedState: value.toObject(),
                    immutableState: {root, value, path: parentPath.concat(path), onChange}
                };
            },

            componentWillMount() {
                Object.defineProperty(this, 'immutableState', {
                    get: getImmutableState
                });
            },

            componentWillReceiveProps(nextProps, nextContext) {
                const {props, state, context} = this;
                const {immutableStateComponentContext} = context;
                const {immutableStateComponentContext: nextImmutableStateComponentContext} = nextContext;

                if (immutableStateComponentContext === nextImmutableStateComponentContext) return;

                const {root: nextRoot, value: nextValue, path: nextPath, onChange} = nextImmutableStateComponentContext;

                const path = getPath.call(this, nextProps, nextContext);

                const maybeValue = isArray(path) ? nextValue.getIn(path, NOT_SET) : nextValue.get(path, NOT_SET);
                const value = maybeValue === NOT_SET ? fromJS(getDefaultState.call(this, props, context)) : maybeValue;

                const {immutableState: {value: currentValue}} = state;

                if (is(value, currentValue)) return;

                this.setState({
                    cachedState: value.toObject(),
                    immutableState: {root: nextRoot, value, path: nextPath.concat(path), onChange}
                });
            },

            setImmutableState(stateOrFunction, callback) {
                const isFunction = typeof stateOrFunction === 'function';
                const newState = isFunction ? stateOrFunction.call(this, this.immutableState, this.props) : stateOrFunction;
                const {immutableState} = this.state;
                const {root, path, value: currentImmutableState, onChange} = immutableState;
                const newImmutableState = currentImmutableState.withMutations((map) => {
                    for (let key in newState) {
                        map.set(key, newState[key]);
                    }
                });

                const finalState = onChange(newImmutableState, path, newState);

                this.setState({
                    cachedState: finalState.toObject(),
                    immutableState: {root, path, value: finalState, onChange}
                }, callback);
            }
        };

        return Object.assign({}, config, mixin);
    };
};