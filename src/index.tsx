import React from 'react';
import ReactDOM from 'react-dom';

import App from './App';
/**
 * Nieuwe info
 * @module render
 */
ReactDOM.render( 
    <main>
        <App />
    </main>,  
    //@ts-ignore
    document.getElementById('app') );
//@ts-ignore
module.hot.accept();