module.exports = ({React}) => {
    const contextTypes = require('./context-types')({React});
    const {immutableStateChanged} = require('./helpers');
    const {merge, get, getIn, is} = require('./operators');
    const {createClass, PropTypes} = React;
    const NOT_SET = {};
    const just = (v) => () => v;
    const isArray = Array.isArray;

    function getImmutableState() {
        return this.state.immutableState.value;
    }

    function ImmutableStateTransducer(config) {
        const {
            getPath = just([]),
            getDefaultState = just({}),
            selector
        } = config;

        function getNextState(props, state = {immutableState: {}}, context, callback) {
            const {immutableStateComponentContext: nextImmutableStateComponentContext} = context;
            const {root: nextRoot, value: nextValue, path: nextPath, onChange} = nextImmutableStateComponentContext;
            const path = getPath(props, nextImmutableStateComponentContext);
            const maybeValue = isArray(path) ? getIn(nextValue, path, NOT_SET) : get(nextValue, path, NOT_SET);
            const value = maybeValue === NOT_SET ? getDefaultState(props, context) : maybeValue;

            const {immutableState: {value: currentValue}} = state;

            if (value !== currentValue) {
                const fullPath = nextPath.concat(path);
                const finalValue = onChange(value, fullPath);

                callback({
                    immutableState: {root: nextRoot, value: finalValue, path: fullPath, onChange}
                });
            } else {
                callback(state);
            }
        }

        return {
            contextTypes,
            childContextTypes: contextTypes,
            getChildContext({immutableState}) {
                return {immutableStateComponentContext: immutableState};
            },
            getNextState,
            selector(state, props) {
                return selector(state.immutableState.value, props);
            },
            actions: {
                setImmutableState(props, state, context, newStateOrFunction, callback) {
                    const isFunction = typeof newStateOrFunction === 'function';
                    const {immutableState} = state;
                    const {root, path, value: currentImmutableState, onChange} = immutableState;
                    const newState = isFunction ? newStateOrFunction.call(this, currentImmutableState, props) : newStateOrFunction;
                    const newImmutableState = onChange(newState, path, true);

                    if (currentImmutableState !== newImmutableState) {
                        return {
                            immutableState: {root, path, value: newImmutableState, onChange}
                        };
                    }

                    return state;
                }
            }
        };
    }

    const ImmutableStateMixin = (config) => {
        const {
            getNextState,
            actions: {
                setImmutableState
            }
        } = ImmutableStateTransducer(config);

        const {
            getPath,
            getDefaultState,
            getChildProps,
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
                const seedState = {immutableState: {}};
                const {props, context} = this;

                let initialState;

                getNextState(props, seedState, context, (nextState) => {
                    initialState = nextState
                });

                return initialState;
            },

            componentWillMount() {
                Object.defineProperty(this, 'immutableState', {
                    get: getImmutableState
                });
            },

            componentWillReceiveProps(props, context) {
                const {state} = this;
                
                getNextState(props, state, context, (nextState) => {
                    if (state !== nextState) {
                        this.setState(nextState);
                    }
                });
            },

            setImmutableState(newStateOrFunction, callback) {
                const {props, state, context} = this;
                const nextState = setImmutableState(props, state, context, newStateOrFunction, callback);

                if (state !== nextState) {
                    this.setState(nextState, callback);
                }
            }
        };

        return merge(config, mixin);
    };

    return {ImmutableStateTransducer, ImmutableStateMixin};
};