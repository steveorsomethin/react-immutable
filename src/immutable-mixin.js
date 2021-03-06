module.exports = ({React}) => {
    function getImmutableState() {
        return this.state.immutableState.value;
    }

    return (config) => {
        const contextTypes = require('./context-types')({React});
        const {immutableStateChanged} = require('./helpers');
        const {merge, get, getIn, is} = require('./operators');
        const {createClass, PropTypes} = React;

        const isArray = Array.isArray;
        const NOT_SET = {};

        const just = (v) => () => v;

        const {
            getPath = just([]),
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
                const maybeValue = isArray(path) ? getIn(parentValue, path, NOT_SET) : get(parentValue, path, NOT_SET);
                const value = maybeValue === NOT_SET ? getDefaultState.call(this, props, context) : maybeValue;

                const fullPath = parentPath.concat(path);
                const finalValue = onChange(value, fullPath);

                return {
                    immutableState: {root, value: finalValue, path: parentPath.concat(path), onChange}
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

                const maybeValue = isArray(path) ? getIn(nextValue, path, NOT_SET) : get(nextValue, path, NOT_SET);
                const value = maybeValue === NOT_SET ? getDefaultState.call(this, props, context) : maybeValue;

                const {immutableState: {value: currentValue}} = state;

                if (value !== currentValue) {
                    const fullPath = nextPath.concat(path);
                    const finalValue = onChange(value, fullPath);

                    this.setState({
                        immutableState: {root: nextRoot, value: finalValue, path: fullPath, onChange}
                    });
                }
            },

            setImmutableState(stateOrFunction, callback) {
                const isFunction = typeof stateOrFunction === 'function';
                const newState = isFunction ? stateOrFunction.call(this, this.immutableState, this.props) : stateOrFunction;
                const {immutableState} = this.state;
                const {root, path, value: currentImmutableState, onChange} = immutableState;
                const newImmutableState = onChange(newState, path, true);

                if (currentImmutableState !== newImmutableState) {
                    this.setState({
                        immutableState: {root, path, value: newImmutableState, onChange}
                    }, callback);
                }
            }
        };

        return merge(config, mixin);
    };
};