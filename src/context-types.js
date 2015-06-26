module.exports = ({React}) => {
    const {PropTypes} = React;
    return {
        immutableStateComponentContext: PropTypes.shape({
            root: PropTypes.object.isRequired,
            value: PropTypes.object.isRequired,
            onChange: PropTypes.func.isRequired,
            path: PropTypes.array.isRequired
        }).isRequired
    };
};