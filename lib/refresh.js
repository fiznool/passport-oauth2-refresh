'use strict';

var OAuth2 = require('oauth').OAuth2;

var AuthTokenRefresh = {};

AuthTokenRefresh._strategies = {};

/**
 * Register a passport strategy so it can refresh an access token,
 * with optional `name`, overridding the strategy's default name.
 *
 * Examples:
 *
 *     refresh.use(strategy);
 *     refresh.use('facebook', strategy);
 *
 * @param {String|Strategy} name
 * @param {Strategy} passport strategy
 */
AuthTokenRefresh.use = function (name, strategy) {
  if (arguments.length === 1) {
    // Infer name from strategy
    strategy = name;
    name = strategy && strategy.name;
  }
  
  /* jshint eqnull: true */
  if (strategy == null) {
    throw new Error('Cannot register: strategy is null');
  }
  /* jshint eqnull: false */

  if (!name) {
    throw new Error('Cannot register: name must be specified, or strategy must include name');
  }

  if (!strategy._oauth2) {
    throw new Error('Cannot register: not an OAuth2 strategy');
  }
  
  // default to using the strategy's oauth2 instance unless the _refreshURL
  // has been specified, then we need to create a new instance and set the
  // accessTokenUrl to be the strategy provided _refreshUrl.
  var oAuth2;
  if (strategy._refreshURL) {
    oAuth2 = new OAuth2(
      strategy._oauth2._clientId,
      strategy._oauth2._clientSecret,
      strategy._oauth2._baseSite,
      strategy._oauth2._authorizeUrl,
      strategy._refreshURL,
      strategy._oauth2._customHeaders);
  } else {
    oAuth2 = strategy._oauth2;
  }
  
  // Generate our own oauth2 object for use later.
  // Use the strategy's _refreshURL, if defined,
  // otherwise use the regular accessTokenUrl.
  AuthTokenRefresh._strategies[name] = {
    strategy: strategy,
    refreshOAuth2: oAuth2
  };
};

/**
 * Check if a strategy is registered for refreshing.
 * @param  {String}  name Strategy name
 * @return {Boolean}
 */
AuthTokenRefresh.has = function (name) {
  return !!AuthTokenRefresh._strategies[name];
};

/**
 * Request a new access token, using the passed refreshToken,
 * for the given strategy.
 * @param  {String}   name         Strategy name. Must have already
 *                                 been registered.
 * @param  {String}   refreshToken Refresh token to be sent to request
 *                                 a new access token.
 * @param  {Function} done         Callback when all is done.
 */
AuthTokenRefresh.requestNewAccessToken = function (name, refreshToken, done) {
  // Send a request to refresh an access token, and call the passed
  // callback with the result.
  var strategy = AuthTokenRefresh._strategies[name];
  if (!strategy) {
    return done(new Error('Strategy was not registered to refresh a token'));
  }

  var params = { grant_type: 'refresh_token' };
  strategy.refreshOAuth2.getOAuthAccessToken(refreshToken, params, done);
};

module.exports = AuthTokenRefresh;
