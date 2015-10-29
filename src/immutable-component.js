module.exports = ({React}) => {
    const ImmutableStateMixin = require('./immutable-mixin')({React});
    const contextTypes = require('./context-types')({React});
    const {merge, setIn, getIn, is} = require('./operators');
    const {createClass, PropTypes} = React;
    const identity = (v) => v;
    const just = (v) => () => v;
    const noop = () => {};
    const NOT_SET = {};

    function render(Component, getChildProps) {
        return function() {
            const {props, immutableState} = this;
            const childProps = getChildProps && getChildProps.call(this, immutableState) || undefined;

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

        return createClass(merge(ImmutableStateMixin(config), classConfig));
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
                this.mutableCell = {value};

                return {
                    immutableState: {root: value, value, path: [], onChange}
                };
            },

            componentWillReceiveProps(nextProps) {
                const {props, state, context, mutableCell} = this;
                const pendingState = mutableCell.value;
                const incomingValue = nextProps.value;

                if (incomingValue !== undefined && !is(pendingState, incomingValue)) {
                    this.mutableCell.value = incomingValue;
                    const {onChange} = this;

                    this.setState({
                        immutableState: {root: incomingValue, value: incomingValue, path: [], onChange}
                    });
                }
            },

            setImmutableState(stateOrFunction, callback) {
                const isFunction = typeof stateOrFunction === 'function';
                const newState = isFunction ? stateOrFunction.call(this, this.immutableState, this.props) : stateOrFunction;
                const {immutableState} = this.state;
                const {root, path, onChange} = immutableState;
                const currentImmutableState = this.mutableCell.value;
                let somethingChanged = false;

                for (let key in newState) {
                    const newValue = newState[key];
                    const oldValue = currentImmutableState[key];
                    if (!is(newValue, oldValue)) {
                        somethingChanged = true;
                        break;
                    }
                }

                if (somethingChanged) {
                    const newImmutableState = merge(currentImmutableState, newState);
                    this.mutableCell.value = newImmutableState;
                    this.props.onChange(this.mutableCell);

                    this.setState({
                        immutableState: {root, path, value: newImmutableState, onChange}
                    }, callback);
                }
            },

            onChange(newPartialState, changedPath, shouldSetState = false) {
                const {props, state, context, mutableCell} = this;
                const pendingState = mutableCell.value;

                const maybeCurrentValueAtPath = getIn(pendingState, changedPath, NOT_SET);
                let newValueAtPath;
                let newValue;

                if (maybeCurrentValueAtPath === NOT_SET) {
                    newValueAtPath = newPartialState;
                    newValue = setIn(pendingState, changedPath, newValueAtPath);
                } else {
                    const currentValueAtPath = maybeCurrentValueAtPath;
                    newValueAtPath = merge(currentValueAtPath, newPartialState);
                    newValue = setIn(pendingState, changedPath, newValueAtPath);
                }

                if (pendingState !== newValue) {
                    const {onChange} = this;

                    mutableCell.value = newValue;

                    if (shouldSetState) {
                        this.props.onChange(mutableCell);
                        this.setState({
                            immutableState: {root: newValue, value: newValue, path: [], onChange}
                        });
                    }
                }

                return newValueAtPath;
            },

            render: render(Component, getChildProps)
        };

        return createClass(merge(ImmutableStateMixin(config), classConfig));
    };

    return {ImmutableState, ImmutableStateRoot, ImmutableStateMixin};
};