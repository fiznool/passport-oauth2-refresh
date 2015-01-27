'use strict';

var OAuth2 = require('oauth').OAuth2;

var AuthTokenRefresh = {};

AuthTokenRefresh._strategies = {};

/**
 * Register a strategy so it can refresh an access token.
 * @param  {Object} strategy A Passport strategy object.
 */
AuthTokenRefresh.use = function(strategy) {
  /* jshint eqnull: true */
  if(strategy == null) {
    throw new Error('Cannot register: strategy is null');
  }
  /* jshint eqnull: false */

  if(!strategy.name) {
    throw new Error('Cannot register: strategy has no name');
  }

  if(!strategy._oauth2) {
    throw new Error('Cannot register: strategy ' + strategy.name + ' is not an OAuth2 strategy');
  }

  // Generate our own oauth2 object for use later.
  // Use the strategy's _refreshURL, if defined,
  // otherwise use the regular accessTokenUrl.
  AuthTokenRefresh._strategies[strategy.name] = {
    strategy: strategy,
    refreshOAuth2: new OAuth2(
      strategy._oauth2._clientId,
      strategy._oauth2._clientSecret,
      strategy._oauth2._baseSite,
      strategy._oauth2._authorizeUrl,
      strategy._refreshURL || strategy._oauth2._accessTokenUrl,
      strategy._oauth2._customHeaders)
  };
};

/**
 * Check if a strategy is registered for refreshing.
 * @param  {nameString}  name strategy name
 * @return {Boolean}
 */
AuthTokenRefresh.has = function(name) {
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
AuthTokenRefresh.requestNewAccessToken = function(name, refreshToken, done) {
  // Send a request to refresh an access token, and call the passed
  // callback with the result.
  var strategy = AuthTokenRefresh._strategies[name];
  if(!strategy) {
    return done(new Error('Strategy was not registered to refresh a token'));
  }

  var params = { grant_type: 'refresh_token' };
  strategy.refreshOAuth2.getOAuthAccessToken(refreshToken, params, done);
};

module.exports = AuthTokenRefresh;