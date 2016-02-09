module.exports = ({React}) => {
    const ImmutableStateTransducer = require('./immutable-transducer')({React});
    const {merge} = require('./operators');

    function getImmutableState() {
        return this.state.immutableState.value;
    }

    const ImmutableStateMixin = (config) => {
        const {
            getNextState,
            contextTypes,
            actions: {
                setImmutableState
            }
        } = ImmutableStateTransducer(config);

        const {
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
                    initialState = nextState;
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