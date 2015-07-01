module.exports = ({React}) => {
    const Immutable = require('immutable');
    const ImmutableStateMixin = require('./immutable-mixin')({React});
    const contextTypes = require('./context-types')({React});

    const {fromJS, is} = Immutable;
    const {createClass, PropTypes} = React;
    const identity = (v) => v;
    const just = (v) => () => v;
    const noop = () => {};

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

            propTypes: {
                onChange: PropTypes.func
            },

            getDefaultProps: just({onChange: noop}),

            getInitialState() {
                const {props, context} = this;
                const value = props.value || fromJS(getDefaultState.call(this, props, context));
                const {onChange} = this;

                return {
                    cachedState: value.toObject(),
                    immutableState: {root: value, value, path: [], onChange}
                };
            },

            componentWillReceiveProps(nextProps) {
                const {props, state, context} = this;
                const {immutableState: {value}} = state;
                const incomingValue = nextProps.value;

                if (incomingValue !== undefined && !is(value, incomingValue)) {
                    const {onChange} = this;
                    this.setState({
                        cachedState: incomingValue.toObject(),
                        immutableState: {root: incomingValue, value: incomingValue, path: [], onChange}
                    });
                }
            },

            onChange(newImmutableState, changedPath, newState) {
                const {props, state, context} = this;
                const {immutableState: {value}} = state;
                const newValue = value.setIn(changedPath, newImmutableState);

                if (!is(value, newValue)) {
                    this.props.onChange(newValue);

                    const {onChange} = this;
                    this.setState({
                        cachedState: newValue.toObject(),
                        immutableState: {root: newValue, value: newValue, path: [], onChange}
                    });
                }
            },

            render: render(Component, getChildProps)
        };

        return createClass(Object.assign({}, ImmutableStateMixin(config), classConfig));
    };

    return {ImmutableState, ImmutableStateRoot, ImmutableStateMixin};
};