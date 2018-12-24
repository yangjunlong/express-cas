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

var https = require('https');
var http = require('http');
var path = require('path');
var url = require('url');
var parseXML = require('xml2js').parseString;
var XMLprocessors = require('xml2js/lib/processors');

var querystring = require('querystring');

// credential requestor / acceptor
const LOGIN_URI = '/login';
//   destroy CAS session (logout)
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
// Secure Access Markup Language
const SAML_VALIDATE_URI = '/samlValidate';

/**
 * Node Cas Client
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
   * cas session user name
   * 
   * @type {String}
   */
  this.sessionName = 'cas_username';

  /**
   * cas session info name
   * 
   * @type {String}
   */
  this.sessionInfo = 'cas_userinfo';

  /**
   * If dev mode is active, 
   * set the CAS user to the specified dev user.
   * 
   * @type {String}
   */
  this.devModeUser = '';

  /**
   * If dev mode is active, 
   * set the CAS Info to the specified dev info.
   * 
   * @type {String}
   */
  this.devModeInfo = {};

  /**
   * Destroy the entire session if the option is set.
   * 
   * @type {Boolean}
   */
  this.isDestroySession = false;

  /**
   * The CAS Server Supported version
   *
   * i.e. '1.0', 2.0', '3.0', 'saml1.1'
   * 
   * @type {String}
   */
  this.version = '3.0';

  /**
   * Supported values are XML and JSON
   * Default value: JSON
   * 
   * @type {String}
   */
  // this.format = 'JSON';

  Object.assign(this, options);

  if(!(this.casServerUrlPrefix || this.casServerLoginUrl)) {
    throw new Error( 'The parameters casServerUrlPrefix and casServerLoginUrl need to be set at least one');
  }

  if(!this.serverName) {
    throw new Error( 'Requires a serverName parameter.');
  }

  this.casServerUrlPrefix = this.casServerUrlPrefix || path.dirname(this.casServerLoginUrl);
  this.casServerLoginUri = this.casServerLoginUrl ? path.basename(this.casServerLoginUrl) : LOGIN_URI;

  var casServerParts = url.parse(this.casServerUrlPrefix);

  // cas server protocal
  this.casServerProtocol = casServerParts.protocol;
  this.casServerHost = casServerParts.host;
  this.casServerPort = casServerParts.port;
  this.casServerPath = casServerParts.path;

  // default cas server validate uri
  this.casServerValidateUri = P3_SERVICE_VALIDATE_URI;

  this.request = this.casServerProtocol == 'http' ? http.request : https.request;

  // format 2.0, 3.0 validate response
  this._formatValidateResponse = function(body, callback) {
    parseXML(body, {
      trim: true,
      normalize: true,
      explicitArray: false,
      tagNameProcessors: [XMLprocessors.stripPrefix],
      valueProcessors: [function(value) {
        return decodeURIComponent(value);
      }]
    }, function(error, result) {
      if (error) {
        return callback(new Error('Response from CAS server was bad.'));
      }

      try {
        var failure = result.serviceResponse.authenticationFailure;
        if (failure) {
          return callback(new Error('CAS authentication failed (' + failure.$.code + ').'));
        }
        var success = result.serviceResponse.authenticationSuccess;
        if (success) {
          return callback(null, success.user, success.attributes);
        } else {
          return callback(new Error( 'CAS authentication failed.'));
        }
      } catch (err) {
        console.log(err);
        return callback(new Error('CAS authentication failed.'));
      }
    });
  };

  switch(this.version) {
    case '1.0' :
      this.casServerValidateUri = VALIDATE_URI;
      this._formatValidateResponse = function(body, callback) {
        var lines = body.split('\n');
        if(lines[ 0 ] === 'yes' && lines.length >= 2) {
          // success
          return callback(null, lines[1]);
        } else if (lines[0] === 'no') {
          // failed
          return callback(new Error('CAS authentication failed.'));
        } else {
          return callback(new Error('Response from CAS server was bad.'));
        }
      };
      break;
    case '2.0' :
      this.casServerValidateUri = SERVICE_VALIDATE_URI;
      break;
    case '3.0' :
      // todo nothing
      
      break;
    case 'saml1.1' :
      this.casServerValidateUri = SAML_VALIDATE_URI;
      this._formatValidateResponse = function(body, callback) {
        parseXML(body, {
          trim: true,
          normalize: true,
          explicitArray: false,
          tagNameProcessors: [XMLprocessors.normalize, XMLprocessors.stripPrefix],
          valueProcessors: [function(value) {
            return decodeURIComponent(value);
          }]
        }, function(error, result) {
          if (error) {
            return callback(new Error('Response from CAS server was bad.'));
          }

          try {
            var samlResponse = result.envelope.body.response;
            var success = samlResponse.status.statuscode.$.Value.split(':')[ 1 ];
            if (success !== 'Success') {
              return callback(new Error('CAS authentication failed (' + success + ').'));
            } else {
              var attributes = {};
              var attributesArray = samlResponse.assertion.attributestatement.attribute;
              if (!(attributesArray instanceof Array)) {
                attributesArray = [ attributesArray ];
              }
              attributesArray.forEach(function(attr){
                var thisAttrValue;
                if (attr.attributevalue instanceof Array){
                  thisAttrValue = [];
                  attr.attributevalue.forEach(function(v) {
                    thisAttrValue.push(v._);
                  });
                } else {
                  thisAttrValue = attr.attributevalue._;
                }
                attributes[ attr.$.AttributeName ] = thisAttrValue;
              });
              return callback(null, samlResponse.assertion.authenticationstatement.subject.nameidentifier, attributes);
            }
          } catch (err) {
            console.log(err);
            return callback(new Error('CAS authentication failed.'));
          }
        });
      };
      break;
    default: // defaults 3.0 version

  } 

  this.check = this.check.bind(this);
  this.block = this.block.bind(this);
  this.bounce = this.bounce.bind(this);
  this.logout = this.logout.bind(this);
  this.redirect = this.redirect.bind(this);
}

/**
 * Bounces a request with CAS authentication. 
 * If the user's session is not already validated with CAS, 
 * their request will be redirected to the CAS login page.
 * 
 * @param  {Object}   req  
 * @param  {Object}   res  
 * @param  {Function} next
 * @return {Undefined}       
 */
CASClient.prototype.bounce = function(req, res, next) {
  this._handle(req, res, next, 1);
};

/**
 * Redirect a request with CAS authentication.
 * If the user's session is not already validated with CAS, 
 * their request will be redirected to the CAS login page.
 * 
 * @param  {[type]}   req  
 * @param  {[type]}   res  
 * @param  {Function} next 
 * @return {[type]}       
 */
CASClient.prototype.redirect = function(req, res, next) {
  this._handle(req, res, next, 2);
};

/**
 * Blocks a request with CAS authentication. 
 * If the user's session is not already validated with CAS, 
 * they will receive a 401 response.
 * 
 * @param  {[type]}   req  
 * @param  {[type]}   res  
 * @param  {Function} next 
 * @return {}       
 */
CASClient.prototype.block = function(req, res, next) {
  this._handle(req, res, next, 3);
};

/**
 * Checks a request with CAS authentication.
 * If the user's session is not already validated with CAS, 
 * return false, otherwise return cas username
 * 
 * @param  {[type]}   req  
 * @param  {[type]}   res  
 * @param  {Function} next 
 * @return {}       
 */
CASClient.prototype.check = function(req, res, next) {
  return req.session[ this.sessionName ];
};


/**
 * Logout the currently logged in CAS user.
 * 
 * @param  {Object}   req  
 * @param  {Object}   res  
 * @param  {Function} next 
 * @return {}        
 */
CASClient.prototype.logout = function(req, res, next) {
  var query = {
    service: this.service || url.resolve(this.serverName, url.parse(req.query.service || '/').pathname),
  };

  if(this.isDestroySession) {
    req.session.destroy(function(err) {
      if(err) {
        console.log(err);
      }
    });
  } else { // Otherwise, just destroy the CAS session variables.
    req.session && (delete req.session[ this.sessionName ]);
    if (this.sessionInfo && req.session) {
      delete req.session[ this.sessionInfo ];
    }
  }

  // Redirect the client to the CAS logout.
  res.redirect(url.format({
    protocol: this.casServerProtocol,
    hostname: this.casServerHost,
    pathname: url.resolve(this.casServerPath, LOGOUT_URI),
    query: query
  }));
}

CASClient.prototype._handle = function(req, res, next, authType) {
  // If the session has been validated with CAS, no action is required.
  if(this.check(req, res, next)) {
    // If this is a bounce redirect, redirect the authenticated user.
    if (authType === 2) {
      res.redirect(req.session.cas_referer);
    } else {
      // Otherwise, allow them through to their request.
      next();
    }
  } else if(this.devModeUser) {
    req.session[ this.sessionName ] = this.devModeUser;
    req.session[ this.sessionInfo ] = this.devModeInfo;
    next();
  } else if (authType === 3) {
    // If the authentication type is BLOCK, simply send a 401 response.
    res.sendStatus(401);
  } else if (req.query && req.query.ticket) {
    // If there is a CAS ticket in the query string, validate it with the CAS server.
    this._validate(req, res, next);
  } else {
    // Otherwise, redirect the user to the CAS login.
    this._login(req, res, next);
  }
};

/**
 * Redirects the client to the CAS login page.
 * 
 * @param  {Object}   req  
 * @param  {Object}   res  
 * @param  {Function} next 
 * @return {}        
 */
CASClient.prototype._login = function(req, res, next) {
  // Save the return URL in the session. If an explicit return URL is set as a
  // query parameter, use that. Otherwise, just use the URL from the request.
  req.session.cas_referer = req.query.referer || url.parse(req._parsedOriginalUrl || req.url).path;

  // Set up the query parameters.
  var query = {
    service: this.service || url.resolve(this.serverName, url.parse(req._parsedOriginalUrl || req.url).pathname),
    renew: this.renew
  };

  if(this.encodeServiceUrl) {
    query.service = encodeURI(query.service);
  }

  res.redirect(url.format({
    protocol: this.casServerProtocol,
    hostname: this.casServerHost,
    pathname: url.resolve(this.casServerPath, LOGIN_URI),
    query: query
  }));
}

/**
 * Checks the validity of a service ticket 
 * and returns an XML/JSON-fragment response
 * 
 * @param  {Object}   req  
 * @param  {Object}   res  
 * @param  {Function} next 
 * @return {[type]}        
 */
CASClient.prototype._validate = function(req, res, next) {
  var query = {
    service: this.service || url.resolve(this.serverName, url.parse(req._parsedOriginalUrl || req.url).pathname),
    ticket: req.query.ticket
  };

  var requestOptions = {
    host: this.casServerHost,
    port: this.casServerPort
  };

  requestOptions.path = url.format({
    pathname: url.resolve(this.casServerPath, this.casServerValidateUri),
    query: query
  });

  var postData = querystring.stringify(query);

  switch(this.version) {
    case '1.0' :
      
      break;
    case '2.0' :
      
      break;
    case 'saml1.1' :
      var now = new Date();
      postData = [
        '<?xml version="1.0" encoding="utf-8"?>',
        '<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/">',
        '  <SOAP-ENV:Header/>',
        '  <SOAP-ENV:Body>',
        '    <samlp:Request xmlns:samlp="urn:oasis:names:tc:SAML:1.0:protocol" MajorVersion="1"',
        '      MinorVersion="1" RequestID="_' + req.host + '.' + now.getTime() + '"',
        '      IssueInstant="' + now.toISOString() + '">',
        '      <samlp:AssertionArtifact>',
        '        ' + req.query.ticket,
        '      </samlp:AssertionArtifact>',
        '    </samlp:Request>',
        '  </SOAP-ENV:Body>',
        '</SOAP-ENV:Envelope>'
      ].join('\n');

      requestOptions.method = 'POST';
      requestOptions.path = url.format({
        pathname: url.resolve(this.casServerPath, this.casServerValidateUri),
        query: {
          TARGET : query.service,
          ticket: ''
        }
      });

      requestOptions.headers = {
        'Content-Type': 'text/xml',
        'Content-Length': Buffer.byteLength(postData)
      };
      break;
    default: // defaults 3.0 version

  }

  var request = this.request(requestOptions, response => {
    response.setEncoding('utf8');
    var body = '';

    response.on('data', chunk => {
      body += chunk;
    });

    response.on('end', () => {
      // request callback
      //req.session[ this.sessionName ] = 'test';
      this._formatValidateResponse(body, (error, user, attributes) => {
        if(error) {
          console.log(error);
          res.sendStatus(401);
        } else {
          req.session[this.sessionName] = user;
          if (this.sessionInfo) {
            req.session[this.sessionInfo] = attributes || {};
          }
          res.redirect(req.session.cas_referer);
        }
      });
    });
    response.on('error', function(err) {
      console.log('Response error from CAS: ', err);
      res.sendStatus(401);
    });
  });

  request.on('error', error => {
    console.log('Request error with CAS: ', error);
    res.sendStatus(401);
  });

  // write data to request body
  request.write(postData);
  request.end();
};

module.exports = CASClient;
