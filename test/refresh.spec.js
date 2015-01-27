'use strict';

require('mocha');

var chai = require('chai'),
    sinon = require('sinon'),
    expect = chai.expect,
    AuthTokenRefresh = require('../lib/refresh.js');

chai.use(require('sinon-chai'));

describe('Auth token refresh', function() {

  beforeEach(function() {
    AuthTokenRefresh._strategies = {};
  });

  describe('use', function() {
    it('should add a strategy with a refreshURL', function() {
      var strategy = {
        name: 'test_strategy',
        _refreshURL: 'refreshURL',
        _oauth2: {
          _accessTokenUrl: 'accessTokenUrl'
        }
      };

      AuthTokenRefresh.use(strategy);
      expect(AuthTokenRefresh._strategies.test_strategy.strategy)
        .to.equal(strategy);
      expect(AuthTokenRefresh._strategies.test_strategy.refreshOAuth2._accessTokenUrl).to.equal('refreshURL');
    });

    it('should add a strategy without a refreshURL', function() {
      var strategy = {
        name: 'test_strategy',
        _oauth2: {
          _accessTokenUrl: 'accessTokenUrl'
        }
      };

      AuthTokenRefresh.use(strategy);
      expect(AuthTokenRefresh._strategies.test_strategy.strategy)
        .to.equal(strategy);
      expect(AuthTokenRefresh._strategies.test_strategy.refreshOAuth2._accessTokenUrl).to.equal('accessTokenUrl');
    });

    it('should not add a null strategy', function() {
      var strategy = null;
      var fn = function() {
        AuthTokenRefresh.use(strategy);
      };

      expect(fn).to.throw(Error, 'Cannot register: strategy is null');
    });

    it('should not add a strategy with no name', function() {
      var strategy = {
        name: '',
        _oauth2: {}
      };

      var fn = function() {
        AuthTokenRefresh.use(strategy);
      };

      expect(fn).to.throw(Error, 'Cannot register: strategy has no name');
    });

    it('should not add a non-OAuth 2.0 strategy', function() {
      var strategy = {
        name: 'test_strategy',
        _oauth2: null
      };

      var fn = function() {
        AuthTokenRefresh.use(strategy);
      };

      expect(fn).to.throw(Error, 'Cannot register: strategy test_strategy is not an OAuth2 strategy');
    });
  });

  describe('has', function() {
    it('should return true if a strategy has been added', function() {
      var strategy = {
        name: 'test_strategy',
        _oauth2: {}
      };

      AuthTokenRefresh.use(strategy);
      expect(AuthTokenRefresh.has('test_strategy')).to.be.true;
    });

    it('should return false if a strategy has not been added', function() {
      expect(AuthTokenRefresh.has('test_strategy')).to.be.false;
    });
  });

  describe('request new access token', function() {
    it('should refresh an access token', function() {
      var getOAuthAccessTokenSpy = sinon.spy();
      var done = sinon.spy();

      AuthTokenRefresh._strategies = {
        test_strategy: {
          refreshOAuth2: {
            getOAuthAccessToken: getOAuthAccessTokenSpy
          }
        }
      };

      AuthTokenRefresh.requestNewAccessToken('test_strategy', 'refresh_token', done);

      expect(getOAuthAccessTokenSpy).to.have.been.calledWith('refresh_token', { grant_type: 'refresh_token' }, done);
    });

    it('should not refresh if the strategy was not previously registered', function() {
      var done = sinon.spy();
      var expectedErr = new Error('Strategy was not registered to refresh a token');

      AuthTokenRefresh.requestNewAccessToken('test_strategy', 'refresh_token', done);

      expect(done).to.have.been.calledWith(expectedErr);
    });
  });
});