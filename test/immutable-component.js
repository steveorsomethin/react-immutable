const {expect} = require('chai');
const {spy} = require('sinon');
const React = require('react/addons');
const {fromJS} = require('immutable');
const {ImmutableState, ImmutableStateRoot} = require('../src/immutable-component')({React});
const {
    createClass,
    addons: {
        TestUtils: {
            renderIntoDocument,
            Simulate: {click}
        }
    }
} = React;
const just = (v) => () => v;

function mock(config) {
    const MockNestedComponent = createClass({
        displayName: 'MockComponent',
        getDefaultProps: just({mockValue: 0}),
        render: function() {
            const {mockValue, onClick} = this.props;
            return <div onClick={onClick}>{mockValue}</div>;
        }
    });

    const MockComponent = createClass({
        displayName: 'MockComponent',
        getDefaultProps: just({mockValue: 0}),
        render: function() {
            const {mockValue, onClick} = this.props;
            return <div onClick={onClick}>{mockValue}</div>;
        }
    });

    const StatefulComponent = ImmutableState(MockComponent, Object.assign({
        getPath: just('mockComponent'),
        getDefaultState: just({mockValue: 1}),
        handleClick() {
            const {mockValue} = this.immutableState;
            this.setImmutableState({
                mockValue: mockValue + 1
            });
        },
        getChildProps({mockValue}) {
            const {handleClick: onClick} = this;
            return {mockValue, onClick};
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
        it('should cause a re-render with updated state', () => {
            const {MockStatefulRoot} = mock();
            const instance = renderIntoDocument(<MockStatefulRoot />);
            const domNode = instance.getDOMNode();

            click(domNode);

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

            click(domNode);

            expect(onChange.args[0][0].toJS()).to.deep.equal({mockComponent: {mockValue: 2}});
        });
    });

    describe('value', () => {
        it('should use incoming props value on mount', () => {
            const onChange = spy();

            const {MockStatefulRoot} = mock();
            const value = fromJS({mockComponent: {mockValue: 5}});
            const instance = renderIntoDocument(<MockStatefulRoot onChange={onChange} value={value} />);
            const domNode = instance.getDOMNode();

            click(domNode);

            expect(onChange.args[0][0].toJS()).to.deep.equal({mockComponent: {mockValue: 6}});
        });

        it('should use incoming props value on update', () => {
            const onChange = spy();

            const {MockStatefulRoot} = mock();
            const value = fromJS({mockComponent: {mockValue: 5}});
            const instance = renderIntoDocument(<MockStatefulRoot onChange={onChange} value={value} />);
            const domNode = instance.getDOMNode();

            click(domNode);

            instance.setProps({value});

            expect(onChange.args[0][0].toJS()).to.deep.equal({mockComponent: {mockValue: 6}});
        });
    });
});