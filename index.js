var React = require('react');
var immutableComponent = require('./dist/immutable-component')({React: React});
var helpers = require('./dist/helpers');

module.exports = {
    ImmutableStateMixin: immutableComponent.ImmutableStateMixin,
    ImmutableState: immutableComponent.ImmutableState,
    ImmutableStateRoot: immutableComponent.ImmutableStateRoot,
    helpers: helpers
};