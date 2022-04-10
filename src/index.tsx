import React from 'react';
import ReactDOM from 'react-dom';

import App from './App';
/**
 * Nieuwe info
 * @module render
 */
ReactDOM.render( 
    <main>
                    <span id="forkongithub"><a href="https://github.com/LegalLinQ">Fork me on GitHub</a></span>
        <h1>DMN by Legal LinQ</h1>
        <em>Not for production purposes - this is a personal hobby project</em>
        <App />
    </main>,  
    //@ts-ignore
    document.getElementById('app') );
//@ts-ignore
module.hot.accept();