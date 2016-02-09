module.exports = ({React}) => {
    const contextTypes = require('./context-types')({React});
    const {get, getIn} = require('./operators');
    const NOT_SET = {};
    const just = (v) => () => v;
    const isArray = Array.isArray;

    function ImmutableStateTransducer(config) {
        const {
            getPath = just([]),
            getDefaultState = just({}),
            selector,
            name = 'immutableState'
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
            name,
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
                setImmutableState(props, state, context, newStateOrFunction) {
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

    return ImmutableStateTransducer;
};