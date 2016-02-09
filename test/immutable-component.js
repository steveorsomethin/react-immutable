const {expect} = require('chai');
const {spy} = require('sinon');
const React = require('react/addons');
const {merge} = require('../src/operators');
const {ImmutableState, ImmutableStateRoot} = require('../src/immutable-component')({React});
const {
    createClass,
    addons: {
        TestUtils: {
            renderIntoDocument,
            Simulate: {mouseDown, mouseUp}
        }
    }
} = React;
const just = (v) => () => v;

function mock(config) {
    const MockComponent = createClass({
        displayName: 'MockComponent',
        getDefaultProps: just({mockValue: 0}),
        render: function() {
            const {mockValue, onMouseUp, onMouseDown} = this.props;
            return <div onMouseDown={onMouseDown} onMouseUp={onMouseUp}>{mockValue}</div>;
        }
    });

    const StatefulComponent = ImmutableState(MockComponent, merge({
        getPath: just('mockComponent'),
        getDefaultState: just({mockValue: 1}),
        handleMouseDown() {
            const {mockValue} = this.immutableState;
            this.setImmutableState({
                mockValue: mockValue + 1
            });
        },
        handleMouseUp() {
            this.setImmutableState(({mockValue}) => ({mockValue: mockValue + 1}));
        },
        getChildProps({mockValue}) {
            const {handleMouseUp: onMouseUp, handleMouseDown: onMouseDown} = this;
            return {mockValue, onMouseUp, onMouseDown};
        }
    }, config));

    const MockRoot = createClass({
        displayName: 'MockRoot',
        render: function() {
            return <StatefulComponent ref='inner' {...this.props} />
        }
    });

    const MockStatefulRoot = ImmutableStateRoot(MockRoot, {});

    return {MockComponent, StatefulComponent, MockRoot, MockStatefulRoot};
}

describe('ImmutableState', function() {
    before(() => {
        const {jsdom} = require('jsdom');
        global.document = jsdom('<!doctype html><html><body></body></html>');
        global.window = document.parentWindow;

        // Ugh. Necessary because otherwise React will barf on async tests
        require('react/lib/ExecutionEnvironment').canUseDOM = true;
    });

    after(() => {
        delete global.document;
        delete global.window;
    });

    describe('getPath', () => {
        it('should retrieve the value at the provided path', () => {
            const {MockStatefulRoot} = mock();
            const instance = renderIntoDocument(<MockStatefulRoot />);
            const {innerHTML} = instance.getDOMNode();

            expect(innerHTML).to.equal('1');
        });
    });

    describe('setImmutableState', () => {
        it('should cause a re-render when provided with an object', () => {
            const {MockStatefulRoot} = mock();
            const instance = renderIntoDocument(<MockStatefulRoot />);
            const domNode = instance.getDOMNode();

            mouseDown(domNode);

            expect(domNode.innerHTML).to.equal('2');
        });

        it('should cause a re-render when provided with a function', () => {
            const {MockStatefulRoot} = mock();
            const instance = renderIntoDocument(<MockStatefulRoot />);
            const domNode = instance.getDOMNode();

            mouseUp(domNode);

            expect(domNode.innerHTML).to.equal('2');
        });
    });
});

describe('ImmutableStateRoot', () => {
    before(() => {
        const {jsdom} = require('jsdom');
        global.document = jsdom('<!doctype html><html><body></body></html>');
        global.window = document.parentWindow;

        // Ugh. Necessary because otherwise React will barf on async tests
        require('react/lib/ExecutionEnvironment').canUseDOM = true;
    });

    after(() => {
        delete global.document;
        delete global.window;
    });

    describe('onChange', () => {
        it('should notify of state changes', () => {
            const onChange = spy();

            const {MockStatefulRoot} = mock();
            const instance = renderIntoDocument(<MockStatefulRoot onChange={onChange} />);
            const domNode = instance.getDOMNode();

            mouseDown(domNode);

            expect(onChange.args[0][0]).to.deep.equal({
                value: {
                    mockComponent: {mockValue: 2}
                }
            });
        });
    });

    describe('value', () => {
        it('should use incoming props value on mount', () => {
            const onChange = spy();

            const {MockStatefulRoot} = mock();
            const value = {mockComponent: {mockValue: 5}};
            const instance = renderIntoDocument(<MockStatefulRoot onChange={onChange} value={value} />);
            const domNode = instance.getDOMNode();

            mouseDown(domNode);

            expect(onChange.args[0][0]).to.deep.equal({
                value: {
                    mockComponent: {mockValue: 6}
                }
            });
        });

        it('should use incoming props value on update', () => {
            const onChange = spy();

            const {MockStatefulRoot} = mock();
            const value = {mockComponent: {mockValue: 5}};
            const instance = renderIntoDocument(<MockStatefulRoot onChange={onChange} value={value} />);
            const domNode = instance.getDOMNode();

            mouseDown(domNode);

            instance.setProps({value});

            expect(onChange.args[0][0]).to.deep.equal({
                value: {
                    mockComponent: {mockValue: 5}
                }
            });
        });
    });
});