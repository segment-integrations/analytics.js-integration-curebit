'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var tester = require('@segment/analytics.js-integration-tester');
var Talkable = require('../lib/');

describe('Talkable', function() {
  var analytics;
  var talkable;
  var options = {
    siteId: 'talkable-87ab995d-736b-45ba-ac41-71f4dbb5c74a',
    server: 'https://api.segment.io/track'
  };

  beforeEach(function() {
    analytics = new Analytics();
    talkable = new Talkable(options);
    analytics.use(Talkable);
    analytics.use(tester);
    analytics.add(talkable);
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    talkable.reset();
    sandbox();
  });

  it('should have the correct settings', function() {
    analytics.compare(Talkable, integration('Talkable')
      .global('_talkableq')
      .global('talkable')
      .option('campaigns', {})
      .option('device', '')
      .option('iframeBorder', 0)
      .option('iframeHeight', '480')
      .option('iframeId', 'talkable_integration')
      .option('iframeWidth', '100%')
      .option('insertIntoId', '')
      .option('responsive', true)
      .option('server', 'https://www.talkable.com')
      .option('siteId', '')
      .option('customUrl', ''));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(talkable, 'load');
    });

    describe('#initialize', function() {
      it('should push settings', function() {
        analytics.initialize();
        analytics.deepEqual(window._talkableq, [['init', {
          site_id: options.siteId,
          server: 'https://api.segment.io/track'
        }]]);
      });

      it('should call #load', function() {
        analytics.initialize();
        analytics.called(talkable.load);
      });
    });
  });

  describe('loading', function() {
    it('should load without custom url', function(done) {
      analytics.load(talkable, done);
    });

    it('should load with custom url', function(done) {
      talkable.options.customUrl = '/base/test/support/alternate-script.js';
      analytics.load(talkable, done);
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
    });

    describe('#page', function() {
      beforeEach(function() {
        analytics.stub(window._talkableq, 'push');
      });

      it('should not register affiliate when the url doesnt match', function() {
        talkable.options.campaigns = { '/share': 'share,test' };
        analytics.page();
        analytics.didNotCall(window._talkableq.push);
      });

      it('should register affiliate when the url matches', function() {
        var campaigns = {};
        campaigns[window.location.pathname] = 'share,test';
        talkable.options.campaigns = campaigns;
        talkable.options.iframeId = 'talkable_integration';
        analytics.page();
        analytics.called(window._talkableq.push, ['register_affiliate', {
          responsive: true,
          device: '',
          campaign_tags: ['share', 'test'],
          iframe: {
            container: '',
            frameborder: 0,
            height: '480',
            id: 'talkable_integration',
            width: '100%'
          }
        }]);
      });

      it('should register affiliate with affiliate member info', function() {
        var campaigns = {};
        campaigns[window.location.pathname] = 'share,test';
        talkable.options.campaigns = campaigns;
        analytics.identify('id', {
          name: 'first last',
          email: 'name@example.com'
        });
        analytics.page();
        analytics.called(window._talkableq.push, ['register_affiliate', {
          responsive: true,
          device: '',
          campaign_tags: ['share', 'test'],
          iframe: {
            container: '',
            frameborder: 0,
            width: '100%',
            id: 'talkable_integration',
            height: '480'
          },
          affiliate_member: {
            email: 'name@example.com',
            first_name: 'first',
            last_name: 'last',
            customer_id: 'id'
          }
        }]);
      });

      it('should throttle', function() {
        window._talkableq = [];
        var campaigns = {};
        campaigns[window.location.pathname] = 'share,test';
        talkable.options.campaigns = campaigns;
        analytics.page();
        analytics.page();
        analytics.page();
        analytics.page();
        analytics.page();
        analytics.equal(window._talkableq.length, 1);
      });
    });

    describe('#orderCompleted', function() {
      beforeEach(function() {
        analytics.stub(window._talkableq, 'push');
      });

      it('should send ecommerce data', function() {
        var date = new Date();

        analytics.track('order completed', {
          order_id: 'ab535a52',
          coupon: 'save20',
          date: date,
          total: 647.92,
          products: [{
            product_id: 'yolo',
            sku: '5be59f56',
            quantity: 8,
            price: 80.99,
            name: 'my-product',
            url: '//products.io/my-product',
            image: '//products.io/my-product.webp'
          }]
        });

        analytics.called(window._talkableq.push, ['register_purchase', {
          coupon_code: 'save20',
          customer_id: null,
          email: undefined,
          first_name: undefined,
          last_name: undefined,
          order_number: 'ab535a52',
          subtotal: 647.92,
          items: [{
            product_id: 'yolo',
            quantity: 8,
            price: 80.99,
            title: 'my-product',
            url: '//products.io/my-product',
            image_url: '//products.io/my-product.webp'
          }]
        }]);
      });
    });
  });
});
