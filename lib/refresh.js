'use strict';

const AuthTokenRefresh = {};

AuthTokenRefresh._strategies = {};

/**
 * Register a passport strategy so it can refresh an access token,
 * with optional `name`, overridding the strategy's default name.
 *
 * Examples:
 *
 *     refresh.use(strategy);
 *     refresh.use('facebook', strategy);
 *     refresh.use(strategy, new HttpsProxyAgent("your.proxy:port"))
 *
 * @param {String|Strategy} name
 * @param {Strategy} passport strategy
 * @param {HttpsProxyAgent} agent
 */
AuthTokenRefresh.use = function (name, strategy, agent) {
  switch (arguments.length) {
    case 1:
      // Infer name from strategy
      strategy = name;
      name = strategy && strategy.name;
      break;
    case 2:
      // When using with proxy without a name
      if (typeof name !== 'string') {
        agent = strategy;

        // Infer strategy from agent
        strategy = name;
        name = strategy && strategy.name;
      }

      break;
  }

  if (strategy == null) {
    throw new Error('Cannot register: strategy is null');
  }

  if (!name) {
    throw new Error(
      'Cannot register: name must be specified, or strategy must include name',
    );
  }

  if (!strategy._oauth2) {
    throw new Error('Cannot register: not an OAuth2 strategy');
  }

  if (agent && typeof agent !== 'object') {
    throw new Error('Please provide a HttpsProxyAgent instance');
  }

  // Use the strategy's OAuth2 object, since it might have been overwritten.
  // https://github.com/fiznool/passport-oauth2-refresh/issues/3
  const OAuth2 = strategy._oauth2.constructor;

  // Generate our own oauth2 object for use later.
  // Use the strategy's _refreshURL, if defined,
  // otherwise use the regular accessTokenUrl.
  AuthTokenRefresh._strategies[name] = {
    strategy: strategy,
    refreshOAuth2: new OAuth2(
      strategy._oauth2._clientId,
      strategy._oauth2._clientSecret,
      strategy._oauth2._baseSite,
      strategy._oauth2._authorizeUrl,
      strategy._refreshURL || strategy._oauth2._accessTokenUrl,
      strategy._oauth2._customHeaders,
    ),
  };

  if (agent !== undefined) {
    AuthTokenRefresh._strategies[name].refreshOAuth2.setAgent(agent);
  }

  // Some strategies overwrite the getOAuthAccessToken function to set headers
  // https://github.com/fiznool/passport-oauth2-refresh/issues/10
  AuthTokenRefresh._strategies[name].refreshOAuth2.getOAuthAccessToken =
    strategy._oauth2.getOAuthAccessToken;
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
 * @param  {Object}   params       (optional) an object containing additional
 *                                 params to use when requesting the token.
 * @param  {Function} done         Callback when all is done.
 */
AuthTokenRefresh.requestNewAccessToken = function (
  name,
  refreshToken,
  params,
  done,
) {
  if (arguments.length === 3) {
    done = params;
    params = {};
  }

  // Send a request to refresh an access token, and call the passed
  // callback with the result.
  const strategy = AuthTokenRefresh._strategies[name];
  if (!strategy) {
    return done(new Error('Strategy was not registered to refresh a token'));
  }

  params = params || {};
  params.grant_type = 'refresh_token';

  strategy.refreshOAuth2.getOAuthAccessToken(refreshToken, params, done);
};

module.exports = AuthTokenRefresh;
