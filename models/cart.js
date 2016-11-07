var User = require('../models/user');
var Ticket = require('../models/ticket');
var taxCalc = require('../local_modules/tax-calculator');
var async = require('async');
var shippingCalc = require('../local_modules/shipping-calculator');

module.exports = function Cart(oldCart) {

	/* every call comes with the existing / old cart */
	this.items = oldCart.items || {};
	this.totalQty = oldCart.totalQty || 0;
	this.totalTax = oldCart.totalTax || 0;
	this.totalShipping = oldCart.totalShipping || 0;
	this.totalPrice = Number(oldCart.totalPrice) || 0; // Subtotal
	this.grandTotal = Number(oldCart.totalPrice) || 0; // Grandtotal
	this.totalPriceWithTax = Number(oldCart.totalPriceWithTax) || 0; // Total with shipping/tax

	/* TODO: Figure out how to change the value of this in the cart.add method from within the necessary method calls calculateShipping and calculateTax
	/* add item to cart */
	this.cartShippingTotal = function() {
		// console.log("Cart Total: " + JSON.stringify(this.items));
		taxCalc.calculateShippingAll(this.items,function(err,results) {
			if (err) {
				console.log('error :' + err.message);
			}

		})
		this.totalShipping = results.taxShipping;
		// this.totalShipping = results.shippingAmount;
	};

	this.cartTaxTotal = function(userId) {
		// console.log("Cart Total: " + JSON.stringify(this.items));
		taxCalc.calculateTaxAll(this.items,userId,function(err,results) {
			if (err) {
				console.log('error :' + err.message);
			}

		})
		this.totalTax = results.taxAmount;
		// this.totalShipping = results.shippingAmount;
	};
	this.add = function(item, id, price, size, name, email, type, taxable, shipable, userId) {
		var storedItem = this.items[id];
		var locals = {};
		if (!storedItem) {
			// create a new entry
			storedItem = this.items[id] = {item: item, qty: 0, price: 0, size: 0, type: type, taxAmount: 0, taxable: taxable, shipable: shipable};
		}
		storedItem.qty++;
		storedItem.price = parseFloat(price);
		storedItem.type = type;
		if (type=='TICKET') {
			storedItem.ticket_name = name;
			storedItem.ticket_email = email;
		} else {
			if (type=='APPAREL') {
				storedItem.size = size;
			}
		}
		storedItem.itemTotal = Number(price * storedItem.qty).toFixed(2);
// this.totalShipping = result.totalShipping;
		// storedItem.taxAmount = result.taxAmount;
		storedItem.type = type;
		if (type=='TICKET') {
			storedItem.ticket_name = name;
			storedItem.ticket_email = email;
		} else {
			if (type=='APPAREL') {
				storedItem.size = size;
			}
		}
		storedItem.itemTotal = Number(price * storedItem.qty).toFixed(2);
		this.totalQty++;
		this.totalPrice += parseFloat(price);
	};
	// this.add = function(item, id, price, size, name, email, type, taxable, shipable, userId) {
	// 	var storedItem = this.items[id];
	// 	if (!storedItem) {
	// 		// create a new entry
	// 		storedItem = this.items[id] = {item: item, qty: 0, price: 0, size: 0, type: type, taxAmount: 0};
	// 	}
	// 	storedItem.qty++;
	// 	storedItem.price = price;
	// 	taxcalc.calculateTax(id,userId,function(err,response) {
	// 		if (err) {
	// 			storedItem.taxAmount=0;
	// 		} else {
	// 			storedItem.taxAmount = response.taxAmount;
	// 		}
	// 		storedItem.type = type;
	// 		if (type=='TICKET') {
	// 			storedItem.ticket_name = name;
	// 			storedItem.ticket_email = email;
	// 		} else {
	// 			if (type=='APPAREL') {
	// 				storedItem.size = size;
	// 			}
	// 		}
	// 		storedItem.priceWithTax = (parseFloat(price) + parseFloat(storedItem.taxAmount));
	// 		storedItem.itemTotal = ((parseFloat(price) * storedItem.qty));
	// 		storedItem.totalWithTax = ((parseFloat(price) * storedItem.qty)) + parseFloat(storedItem.taxAmount);
	// 		this.totalTax += storedItem.taxAmount;
	// 		this.totalQty++;
	// 		this.totalPrice += Number(stored.itemTotal);
	// 	});
	// };
	//
	/* Empty all items from cart */
	//
	this.empty = function() {
		this.items = {};
		this.totalQty = 0;
		this.totalPrice = 0;
		storedItem = {item: {}, qty: 0, price: 0, size: 0, ticket_name: '', ticket_email: ''};
	};

	/* Reduce the qty of a specific item in the cart by 1 */
	this.reduce = function(item, id, price, size) {
		var storedItem = this.items[id];
		if (!storedItem) {
			// create a new entry
			storedItem = this.items[id] = {item: item, qty: 0, price: 0, size: 0, taxAmount: 0};
		}
		storedItem.qty--;
		storedItem.price = price;
		taxcalc.calculateTax(id,userId,function(err,response) {
			if (err) {
				storedItem.taxAmount=0;
			} else {
				storedItem.taxAmount = response.taxAmount;
			}
			storedItem.itemTotal = Number(price * storedItem.qty);
			storedItem.size = size;
			this.totalQty--;
			this.totalPrice += Number(price);
			if (this.items[id].qty <= 0) {
				delete this.items[id];
			}
			storedItem.itemTotal = Number(price * storedItem.qty);
			if (this.totalQty <= 0) {
				this.totalQty = 0;
				this.items = {}
				this.totalPrice = 0;
				storedItem = {item: {}, qty: 0, price: 0, size: 0};
			}
		});

	};

	/* create an array of the items in the cart */
	this.generateArray = function() {
		var arr = [];
		for (var id in this.items) {
			arr.push(this.items[id]);
		}
		return arr;
	};

	/* calculate cart total, taxes and shipping */
	this.calculateTotals = function(items,user) {

	}

	/* Save Ticket Name and Email */
	this.ticketSale = function(products,user) {
		var dateObj = new Date();
		var month = dateObj.getUTCMonth() + 1; //months from 1-12
		var day = dateObj.getUTCDate();
		var year = dateObj.getUTCFullYear();

		if (!products) {
			return
		}

		var item_list = [];
		for (var i = 0, len = products.length; i < len; i++) {
			if (products[i].type == 'TICKET') {
				ticket = new Ticket({
					user: user,
					ticket_email: products[i].ticket_email,
					ticket_name: products[i].ticket_name,
					ticket_type: products[i].type
				})
				ticket.save(function(err,ticket) {
					if (err) {
						res.send('500','Problem saving ticket.');
					}
					return ticket;
				});
			}
		}
	}
};