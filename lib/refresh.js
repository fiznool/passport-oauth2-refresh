'use strict';

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

  AuthTokenRefresh._strategies[strategy.name] = strategy;
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

  // Hmmm. This next bit uses a 'protected' part of passport.
  // But it's easier than recreating the OAuth object again,
  // and we are (sort of) allowed to use it.
  // https://github.com/jaredhanson/passport-oauth2/blob/a853bd0593425b86ce237667a2bf63ffd736c3d5/lib/strategy.js#L90
  var params = { grant_type: 'refresh_token' };
  strategy._oauth2.getOAuthAccessToken(refreshToken, params, done);
};

module.exports = AuthTokenRefresh;