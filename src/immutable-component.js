module.exports = ({React}) => {
    const ImmutableStateMixin = require('./immutable-mixin')({React});
    const contextTypes = require('./context-types')({React});
    const {merge, setIn, getIn} = require('./operators');
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
                const value = props.value || getDefaultState.call(this, props, context);
                const {onChange} = this;
                this.pendingState = value;

                return {
                    cachedState: value,
                    immutableState: {root: value, value, path: [], onChange}
                };
            },

            componentWillReceiveProps(nextProps) {
                const {props, state, context, pendingState} = this;
                const incomingValue = nextProps.value;

                if (incomingValue !== undefined && pendingState !== incomingValue) {
                    this.pendingState = incomingValue;
                    const {onChange} = this;

                    this.setState({
                        cachedState: incomingValue,
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
                const newImmutableState = merge(currentImmutableState, newState);

                this.props.onChange(newImmutableState);

                this.setState({
                    cachedState: newImmutableState,
                    immutableState: {root, path, value: newImmutableState, onChange}
                }, callback);
            },

            onChange(newImmutableState, changedPath, newState) {
                const {props, state, context, pendingState} = this;

                const maybeCurrentValueAtPath = getIn(pendingState, changedPath, NOT_SET);
                let newValueAtPath;
                let newValue;

                if (maybeCurrentValueAtPath === NOT_SET) {
                    newValueAtPath = newImmutableState;
                    newValue = setIn(pendingState, changedPath, newImmutableState);
                } else {
                    const currentValueAtPath = maybeCurrentValueAtPath;
                    newValueAtPath = merge(currentValueAtPath, newImmutableState);
                    newValue = setIn(pendingState, changedPath, newValueAtPath);
                }

                if (pendingState !== newValue) {
                    this.props.onChange(newValue);

                    this.pendingState = newValue;

                    const {onChange} = this;
                    this.setState({
                        cachedState: newValue,
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