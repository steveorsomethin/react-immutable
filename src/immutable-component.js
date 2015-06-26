module.exports = ({React}) => {
    const Immutable = require('immutable');
    const ImmutableStateMixin = require('./immutable-mixin')({React});
    const contextTypes = require('./context-types')({React});

    const {fromJS, is} = Immutable;
    const {createClass, PropTypes} = React;
    const identity = (v) => v;
    const just = (v) => () => v;
    const noop = () => {};

    const ImmutableState = (Component, config) => {
        const {
            getChildProps = identity
        } = config;

        const classConfig = {
            displayName: 'ImmutableState(' + Component.displayName + ')',
            render() {
                const {props, state: {cachedState, immutableState: {value}}} = this;
                const childProps = getChildProps && getChildProps.call(this, cachedState) || undefined;

                return childProps === undefined ? <Component {...props} /> : <Component {...props} {...childProps} />;
            }
        };

        return createClass(Object.assign({}, ImmutableStateMixin(config), classConfig));
    };

    const ImmutableStateRoot = (Component, config) => {
        const {
            getChildProps = identity,
            getDefaultState = just({})
        } = config;

        const classConfig = {
            displayName: 'ImmutableStateRoot(' + Component.displayName + ')',
            childContextTypes: contextTypes,

            propTypes: {
                onChange: PropTypes.func
            },

            getDefaultProps: just({onChange: noop}),

            getChildContext() {
                const {immutableState} = this.state;

                return {immutableStateComponentContext: immutableState};
            },

            getInitialState() {
                const value = this.props.value || fromJS(getDefaultState.call(this));
                const path = [];
                const {onChange} = this;

                return {
                    cachedState: value.toObject(),
                    immutableState: {root: value, value, path, onChange}
                };
            },

            componentWillMount() {
                Object.defineProperty(this, 'immutableState', {
                    get: function() {
                        return this.state.cachedState;
                    }
                });
            },

            componentWillReceiveProps(nextProps) {
                const {immutableState: {value, path}} = this.state;
                const incomingValue = nextProps.value;

                if (incomingValue !== undefined && !is(value, incomingValue)) {
                    const {onChange} = this;
                    this.setState({
                        cachedState: incomingValue.toObject(),
                        immutableState: {root: incomingValue, value: incomingValue, path, onChange}
                    });
                }
            },

            onChange(newImmutableState, changedPath, newState) {
                const {immutableState: {value, path}} = this.state;
                const newValue = value.setIn(changedPath, newImmutableState);

                if (!is(value, newValue)) {
                    this.props.onChange(newValue);

                    const {onChange} = this;
                    this.setState({
                        cachedState: newValue.toObject(),
                        immutableState: {root: newValue, value: newValue, path, onChange}
                    });
                }
            },

            render() {
                const {props, immutableState} = this;
                const childProps = getChildProps && getChildProps.call(this, immutableState) || undefined;

                return childProps === undefined ? <Component {...props} /> : <Component {...props} {...childProps} />;
            }
        };

        return createClass(Object.assign({}, config, classConfig));
    };

    return {ImmutableState, ImmutableStateRoot};
};