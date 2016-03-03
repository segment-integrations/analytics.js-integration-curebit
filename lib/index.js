/**
 * Module dependencies.
 */

var Identify = require('facade').Identify;
var Track = require('facade').Track;
var each = require('each');
var integration = require('analytics.js-integration');
var iso = require('to-iso-string');

/**
 * Expose `Talkable` integration.
 */

var Talkable = module.exports = integration('Talkable')
  .option('customUrl', '')
  .tag('<script src="{{ src }}">');

/**
 * Initialize.
 *
 * @api public
 */

Talkable.prototype.initialize = function() {
  var url = this.options.customUrl;
  if (!url) return;

  this.load({ src: url }, this.ready);
};

/**
 * authenticate_customer
 *
 * @api public
 */

Talkable.prototype.identify = function() {
  if (typeof _talkableq == undefined) return;

  var user = this.analytics.user();
  var identify = new Identify({
    userId: user.id(),
    traits: user.traits()
  });

  var customer_info = {
    email: identify.email(),
    first_name: identify.firstName(),
    last_name: identify.lastName(),
    customer_id: identify.userId()
  };

  _talkableq.push(['authenticate_customer', customer_info]);
}


/**
 * register_affiliate
 *
 * @api public
 * @param {Page} page
 */

Talkable.prototype.page = function() {
  if (typeof _talkable_affiliate_run == undefined) return;
  _talkable_affiliate_run();
}


/**
 * Completed order.
 *
 * Fire the Talkable `register_purchase` with the order details and items.
 *
 * http://docs.talkable.com/
 *
 * @api public
 * @param {Track} track
 */

Talkable.prototype.completedOrder = function(track) {
  if (typeof _talkable_purchase_run == undefined) return;

  var orderId = track.orderId();
  var products = track.products();
  var props = track.properties();
  var items = [];
  var order_data;

  each(products, function(product) {
    var track = new Track({ properties: product });
    items.push({
      product_id: track.id() || track.sku(),
      quantity: track.quantity(),
      image_url: product.image,
      price: track.price(),
      title: track.name(),
      url: product.url
    });
  });

  var order_data = {
    order_date: iso(props.date || new Date()),
    order_number: orderId,
    coupon_code: track.coupon(),
    subtotal: track.total(),
    items: items
  };

  _talkable_purchase_run(order_data);
};
