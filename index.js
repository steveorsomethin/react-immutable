var React = require('react');
var immutableComponent = require('./dist/immutable-component')({React: React});
var helpers = require('./dist/helpers');
var operators = require('./dist/operators');

module.exports = {
    ImmutableStateMixin: immutableComponent.ImmutableStateMixin,
    ImmutableState: immutableComponent.ImmutableState,
    ImmutableStateRoot: immutableComponent.ImmutableStateRoot,
    helpers: helpers,
    operators: operators
};