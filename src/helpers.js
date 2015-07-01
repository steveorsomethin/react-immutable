function immutableStateChanged(nextProps, {immutableState: nextImmutableState}) {
    const {immutableState} = this.state;

    return immutableState !== nextImmutableState;
}

module.exports = {immutableStateChanged};