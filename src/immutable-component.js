module.exports = ({React}) => {
    const Immutable = require('immutable');
    const ImmutableStateMixin = require('./immutable-mixin')({React});
    const contextTypes = require('./context-types')({React});

    const {fromJS, is} = Immutable;
    const {createClass, PropTypes} = React;
    const identity = (v) => v;
    const just = (v) => () => v;
    const noop = () => {};
    const NOT_SET = {};

    function render(Component, getChildProps) {
        return function() {
            const {props, state: {immutableState: {value}, cachedState}} = this;
            const childProps = getChildProps && getChildProps.call(this, cachedState, value) || undefined;

            return childProps === undefined ? <Component {...props} /> : <Component {...props} {...childProps} />;
        };
    }

    const ImmutableState = (Component, config = {}) => {
        const {
            getChildProps = identity
        } = config;

        const classConfig = {
            displayName: 'ImmutableState(' + Component.displayName + ')',
            render: render(Component, getChildProps)
        };

        return createClass(Object.assign({}, ImmutableStateMixin(config), classConfig));
    };

    const ImmutableStateRoot = (Component, config = {}) => {
        const {
            getChildProps = identity,
            getDefaultState = just({})
        } = config;

        const classConfig = {
            displayName: 'ImmutableStateRoot(' + Component.displayName + ')',
            
            contextTypes: null,

            propTypes: {onChange: PropTypes.func},

            getDefaultProps: just({onChange: noop}),

            getInitialState() {
                const {props, context} = this;
                const value = props.value || fromJS(getDefaultState.call(this, props, context));
                const {onChange} = this;
                this.pendingState = value;

                return {
                    cachedState: value.toObject(),
                    immutableState: {root: value, value, path: [], onChange}
                };
            },

            componentWillReceiveProps(nextProps) {
                const {props, state, context, pendingState} = this;
                const incomingValue = nextProps.value;

                if (incomingValue !== undefined && !is(pendingState, incomingValue)) {
                    this.pendingState = incomingValue;
                    const {onChange} = this;

                    this.setState({
                        cachedState: incomingValue.toObject(),
                        immutableState: {root: incomingValue, value: incomingValue, path: [], onChange}
                    });
                }
            },

            setImmutableState(stateOrFunction, callback) {
                const isFunction = typeof stateOrFunction === 'function';
                const newState = isFunction ? stateOrFunction.call(this, this.immutableState, this.props) : stateOrFunction;
                const {immutableState} = this.state;
                const {root, path, onChange} = immutableState;
                const currentImmutableState = this.pendingState;
                const newImmutableState = currentImmutableState.withMutations((map) => {
                    for (let key in newState) {
                        map.set(key, newState[key]);
                    }
                });

                this.props.onChange(newImmutableState);

                this.setState({
                    cachedState: newImmutableState.toObject(),
                    immutableState: {root, path, value: newImmutableState, onChange}
                }, callback);
            },

            onChange(newImmutableState, changedPath, newState) {
                const {props, state, context, pendingState} = this;

                const maybeCurrentValueAtPath = pendingState.getIn(changedPath, NOT_SET);
                let newValueAtPath;
                let newValue;

                if (maybeCurrentValueAtPath === NOT_SET) {
                    newValueAtPath = newImmutableState;
                    newValue = pendingState.setIn(changedPath, newImmutableState);
                } else {
                    const currentValueAtPath = maybeCurrentValueAtPath;
                    newValueAtPath = currentValueAtPath.withMutations((map) => {
                        newImmutableState.forEach((value, key) => {
                            map.set(key, value);
                        });
                    });

                    newValue = pendingState.setIn(changedPath, newValueAtPath);
                }

                if (!is(pendingState, newValue)) {
                    this.props.onChange(newValue);

                    this.pendingState = newValue;
                    const {onChange} = this;
                    this.setState({
                        cachedState: newValue.toObject(),
                        immutableState: {root: newValue, value: newValue, path: [], onChange}
                    });
                }

                return newValueAtPath;
            },

            render: render(Component, getChildProps)
        };

        return createClass(Object.assign({}, ImmutableStateMixin(config), classConfig));
    };

    return {ImmutableState, ImmutableStateRoot, ImmutableStateMixin};
};