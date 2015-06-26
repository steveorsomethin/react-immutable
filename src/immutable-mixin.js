module.exports = ({React}) => {
    return (config) => {
        const Immutable = require('immutable');
        const contextTypes = require('./context-types')({React});

        const {fromJS, is} = Immutable;
        const {createClass, PropTypes} = React;

        const isArray = Array.isArray;
        const NOT_SET = {};

        const just = (v) => () => v;

        const {
            getPath,
            getChildProps,
            getDefaultState = just({})
        } = config;

        const mixin = {
            contextTypes,
            childContextTypes: contextTypes,

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
                const value = maybeValue === NOT_SET ? fromJS(getDefaultState.call(this)) : maybeValue;

                return {
                    cachedState: value.toObject(),
                    immutableState: {root, value: fromJS(getDefaultState.call(this)), path: parentPath.concat(path), onChange}
                };
            },

            componentWillMount() {
                Object.defineProperty(this, 'immutableState', {
                    get: function() {
                        return this.state.cachedState;
                    }
                });
            },

            componentWillReceiveProps(nextProps, nextContext) {
                const {state, context} = this;
                const {immutableStateComponentContext} = context;
                const {immutableStateComponentContext: nextImmutableStateComponentContext} = nextContext;

                if (immutableStateComponentContext === nextImmutableStateComponentContext) return;

                const {root: nextRoot, value: nextValue, path: nextPath, onChange} = nextImmutableStateComponentContext;

                const path = getPath.call(this, nextProps, nextContext);

                const maybeValue = isArray(path) ? nextValue.getIn(path, NOT_SET) : nextValue.get(path, NOT_SET);
                const value = maybeValue === NOT_SET ? fromJS(getDefaultState.call(this)) : maybeValue;

                const {immutableState: {value: currentValue}} = state;

                if (is(value, currentValue)) return;

                this.setState({
                    cachedState: value.toObject(),
                    immutableState: {root: nextRoot, value, path: nextPath.concat(path), onChange}
                });
            },

            setImmutableState(newState, callback) {
                const {immutableStateComponentContext: {onChange}} = this.context;
                const {cachedState, immutableState} = this.state;
                const {root, path, value: currentImmutableState} = immutableState;
                const newImmutableState = currentImmutableState.merge(newState);

                onChange(newImmutableState, path, newState);

                this.setState({
                    cachedState: newImmutableState.toObject(),
                    immutableState: {root, path, value: newImmutableState, onChange}
                }, callback);
            }
        };

        return Object.assign({}, config, mixin);
    };
};