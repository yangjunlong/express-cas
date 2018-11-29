/**
 * Central Authentication Service (CAS) client for express
 *
 * The Central Authentication Service (CAS) is a single-sign-on / single-sign-off protocol for the web. 
 * It permits a user to access multiple applications while providing their 
 * credentials (such as userid and password) only once to a central CAS Server application.
 *
 * @see https://apereo.github.io/cas/5.3.x/protocol/CAS-Protocol-Specification.html
 * 
 * @author  Yang,junlong at 2018-11-25 14:00:59 build.
 * @version $Id$
 */

var http = require('http');
var https = require('https');
var url = require('url');

// credential requestor / acceptor
const LOGIN_URI = '/login';
// 	destroy CAS session (logout)
const LOGOUT_URI = '/logout';
// service ticket validation
const VALIDATE_URI = '/validate';
// service ticket validation [CAS 2.0]
const SERVICE_VALIDATE_URI = '/serviceValidate';
// service/proxy ticket validation [CAS 2.0]
const PROXY_VALIDATE_URI = '/proxyValidate';
// proxy ticket service [CAS 2.0]
const PROXY_URI = '/proxy';
// service ticket validation [CAS 3.0]
const P3_SERVICE_VALIDATE_URI = '/p3/serviceValidate';
// service/proxy ticket validation [CAS 3.0]
const P3_PROXY_VALIDATE_URI = '/p3/proxyValidate'

const SAML_VALIDATE_URI = '/samlValidate';

/**
 * Node cas client
 * 
 * @see https://github.com/apereo/java-cas-client
 * 
 * @param {Object} options
 */
function CASClient(options) {
  /**
   * The start of the CAS server URL, 
   * i.e. https://localhost:8443/cas
   * 
   * @type {String}
   */
  this.casServerUrlPrefix = '';

  /**
   * Defines the location of the CAS server login URL, 
   * i.e. https://localhost:8443/cas/login. 
   * This overrides casServerUrlPrefix, if set.
   * 
   * @type {String}
   */
  this.casServerLoginUrl = '';

  /**
   * The name of the server this application is hosted on. 
   * Service URL will be dynamically constructed using this, 
   * i.e. https://localhost:8443 
   * (you must include the protocol, but port is optional if it's a standard port).
   * 
   * @type {String}
   */
  this.serverName = '';

  /**
   * The service URL to send to the CAS server, 
   * i.e. https://localhost:8443/yourwebapp/index.html
   * 
   * @type {String}
   */
  this.service = '';

  /**
   * specifies whether renew=true should be sent to the CAS server. 
   * Valid values are either true/false (or no value at all). 
   * 
   * @type {Boolean}
   */
  this.renew = false;

  /**
   * specifies whether gateway=true should be sent to the CAS server. 
   * Valid values are either true/false (or no value at all)
   * 
   * @type {Boolean}
   */
  this.gateway = false;

  /**
   * Whether the client should auto encode the service url. 
   * Defaults to true
   * 
   * @type {Boolean}
   */
  this.encodeServiceUrl = true;

  /**
   * 
   * 
   * @type {String}
   */
  this.sessionName = 'cas';

  /**
   * The CAS Server Supported version
   *
   * i.e. '1.0', 2.0', '3.0', 'saml1.1'
   * 
   * @type {String}
   */
  this.version = '3.0';

  Object.assign(this, options);

  if(!(this.casServerUrlPrefix && this.casServerLoginUrl)) {
    throw new Error( 'The parameters casServerUrlPrefix and casServerLoginUrl need to be set at least one');
  }
  if(!this.serverName) {
    throw new Error( 'Requires a serverName parameter.');
  }

  var casServerParts1 = url.parse(this.casServerUrlPrefix);
  var casServerParts2 = url.parse(this.casServerLoginUrl);

  this.casServerProtocol = casServerParts2.protocol || casServerParts1.protocol;
  this.casServerHost
  this.casServerUrlPrefix = this.casServerUrlPrefix || path.dirname(this.casServerLoginUrl);
  this.casServerLoginUrl = this.casServerLoginUrl || url.resolve(this.casServerUrlPrefix, LOGIN_URI);

  this.casServerValidateUri = P3_SERVICE_VALIDATE_URI;

  switch(this.version) {
  	case '1.0' :
  	  this.casServerValidateUri = VALIDATE_URI;
  	  break;
  	case '2.0' :
  	  this.casServerValidateUri = SERVICE_VALIDATE_URI;
  	  break;
  	case 'saml1.1' :
      this.casServerValidateUri = SAML_VALIDATE_URI;
  	  break;
  	default: // defaults 3.0 version

  }

  this.request = this.casServerProtocol == 'http' ? http.request : https.request;
}


CASClient.prototype.bounce = function(req, res, next) {

};


CASClient.prototype.logout = function(req, res, next) {

}



module.exports = CASClient;





