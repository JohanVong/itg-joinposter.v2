import '../css/main.less';
import React from 'react';
import ReactDOM from 'react-dom';

// Required for work on iOS 9b
import 'babel-polyfill';

import LoyaltyApp from '../../examples/loyalty/app';

class ExampleApp extends React.Component {
    render() {
        return <LoyaltyApp />;
    }
}

ReactDOM.render(
    <ExampleApp />,
    document.getElementById('app-container'),
);
