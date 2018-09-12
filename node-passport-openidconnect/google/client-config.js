/* 
  Example: client configuration settings (imported to and applied in ./oidc-strategy.js)
*/
var config = {
  oauth: {
    client_id: 'your-client-id',
    client_secret: 'your-client-secret',
    callbackURL: '/google/redirect',
    scope: 'openid profile'
  }    
};

/* 
  potentially sensitive values can be overwritten by counterparts from ./client-config.js.ignore, 
  which is not tracked by the repository and can be kept confidential
*/
var fs = require('fs');

if (fs.existsSync('./google/client-config.js.ignore')) {
  config = require('./client-config.js.ignore');
}

module.exports = config;
/* Example: end */
