// fb3-craft store js

$.firebelly = $.firebelly || {};

// good design for good reason for good namespace
$.firebelly.store = (function() {

  var cart,
      stripeCheckout;

  function _init() {
    // Localstorage cart
    cart = Modernizr.localstorage && localStorage.getItem('Fb.cartWithShipping') ? JSON.parse(localStorage.getItem('Fb.cartWithShipping')) : {items:[],shipping:{type:'US',cost:8,quantity:1}};
    $('.cart').toggleClass('cart-active', cart.length>0);

    // Products
    if ($('#store-page').length) {
      _initProducts();
    }
  }

  function _initProducts() {
    // Add to Cart buttons
    $(document).on('click', '.add-to-cart', function() {
      _addToCart({
        title: $(this).attr('data-title'),
        price: $(this).attr('data-price'),
        stripe_product_id: $(this).attr('data-stripe-product-id'),
        weight: $(this).attr('data-weight'),
        'quantity': 1,
        id: $(this).attr('data-id')
      });
    });

    $(document).on('click', '.shipping-option', function() {
      $('.cart .shipping-option').removeClass('active');
      $(this).addClass('active');
      _updateCartShipping();
      _showCart();
    });

    stripeCheckout = StripeCheckout.configure({
      key: $('form.cart-wrap').attr('data-stripe-publishable-key'),
      image: $('form.cart-wrap').attr('data-stripe-checkout-logo'),
      locale: 'auto',
      token: function(token, args) {
        data = $('form.cart-wrap').serialize() + '&token=' + JSON.stringify(token) + '&customer=' + JSON.stringify(args) + '&cart=' + JSON.stringify(cart);
        $('.cart').addClass('working');
        $.post($('form.cart-wrap').attr('action'), data, function(response) {
          if (response.success) {
            _resetCart();
            $('.cart-feedback').html('<h3>Thank you!</h3><p>Your order is confirmed and an email receipt is on the way.</p>').slideDown('fast');
          } else {
            $('.cart-feedback').html('<h3>Oh no!</h3><p>There was a transaction error: ' + response.message + '</p>').slideDown('fast');
            setTimeout(function() { $('.cart').removeClass('working'); }, 2500);
          }
        }, 'json').fail(function() {
          $('.cart-feedback').html('<h3>Oh no!</h3><p>There was a transaction error. Please try again.</p>').slideDown('fast');
          setTimeout(function() { $('.cart').removeClass('working'); }, 2500);
      });
      }
    });

    // Delete cart items
    $(document).on('click', '.cart .delete', function(e) {
      e.preventDefault();
      _removeFromCart($(this).attr('data-id'));
    });

    // Quantity fields
    $(document).on('keydown', '.cart .quantity input', function(e) {
      if (e.keyCode==13) {
        e.preventDefault();
        _updateCartQuantities();
      }
    }).on('change', '.cart .quantity input', function() {
      _updateCartQuantities();
    });

    // Checkout button
    $(document).on('click', '.cart button.checkout', function(e) {
      _checkoutCart(e);
    });

    // Init cart
    _showCart("Don't show the sidebar, man, we're just, like, init'ing the cart.");
  }

  function _resetCart() {
    cart = {items:[],shipping:{type:'US',cost:8,quantity:1}};
    _saveCart();
    _showCart("Nope");
  }

  // Add item to cart
  function _addToCart(product) {
    var exists = $.grep(cart.items, function(obj) {
      return obj.title === product.title;
    });
    if (!exists.length) {
      cart.items.push(product);
    } else {
      exists[0].quantity +=1;
    }
    _showCart();
    _updateCartShipping();
  }
  // Remove item from cart
  function _removeFromCart(id) {
    cart.items.splice(id,1);
    _saveCart();
    _showCart();
  }
  // Save cart if localStorage
  function _saveCart() {
    if (Modernizr.localstorage) {
      localStorage.setItem('Fb.cartWithShipping', JSON.stringify(cart));
    }
  }
  // Update all cart quantities
  function _updateCartQuantities() {
    var quantity, id;
    $('.cart-items li.line-item').each(function() {
      quantity = parseInt($(this).find('.quantity input').val());
      id = $(this).attr('data-id');
      if (quantity > 0) {
        cart.items[id].quantity = quantity;
      } else {
        cart.items.splice(id,1);
      }
    });
    _showCart();
    _updateCartShipping();
  }
  // Build cart in DOM from cart object
  function _showCart(no_open_sidebar) {
    var cost = 0,
        total = 0,
        total_items = 0,
        html = '';
    $('.cart-feedback').hide();
    $('.cart-items').empty();
    // Loop through cart items and build rudimentary HTML cart
    if (cart.items.length) {
      $('.cart').addClass('cart-active').removeClass('working').find('button.checkout').text('Checkout');
      for (var i = 0; i < cart.items.length; i++) {
        cost = cart.items[i].quantity * parseFloat(cart.items[i].price);
        $('<li class="line-item" data-stripe-product-id="' + cart.items[i].stripe_product_id + '" data-id="' + i + '"><div class="item">' + cart.items[i].title + '</div> <div class="price">$' + cost + '</div> ' +
          '<div class="quantity"><span>Qty:</span> <input type="text" size="2" value="' + cart.items[i].quantity + '" tabindex="' + (i+1) + '"></div>' +
          '<div class="delete-link"><a href="#" class="delete" data-id="' + i + '">Remove</a></div></li>')
        .appendTo('.cart-items');
        total += cost;
        total_items += cart.items[i].quantity;
      }
      total += cart.shipping.cost;
      cart.total = total;
      $('<li class="cart-shipping active">Shipping: <span class="shipping-option'+(cart.shipping.type=='US' ? ' active' : '')+'" data-type="US" data-label="US" data-cost="8">$'+(Math.ceil(total_items / 2) * 8)+' USA</span> <span class="shipping-option'+(cart.shipping.type=='INTL' ? ' active' : '')+'" data-label="INT\'L" data-type="INTL" data-cost="30">$30 INT\'L</span></li>').appendTo('.cart-items');
      $('<li class="cart-total">Total: $' + total + '</li>').appendTo('.cart-items');
      if (typeof no_open_sidebar === 'undefined') {
        $.firebelly.main.showSidebar();
      }
    } else {
      $('.cart').removeClass('cart-active');
    }
  }
  function _updateCartShipping() {
    var $activeShipping = $('.shipping-option.active');
    if ($activeShipping.length > 0) {
      cart.shipping.type = $activeShipping.attr('data-type');
      cart.shipping.cost = parseFloat($activeShipping.attr('data-cost'));
      cart.shipping.quantity = 1;
      // Calculate shipping qty (hacky way of charging $8 per 2 books)
      var total_items = cart.items.reduce(function(a,b){return a + b.quantity;}, 0);
      if (cart.shipping.type=='US' && total_items > 2) {
        cart.shipping.cost = Math.ceil(total_items / 2) * parseFloat($activeShipping.attr('data-cost'));
        cart.shipping.quantity = Math.ceil(total_items / 2);
      }
      _saveCart();
      _showCart("Nope");
    }
  }
  // Build PayPal form and submit checkout
  function _checkoutCart(e) {
    e.preventDefault();
    $('.cart-feedback').hide();

    // Open Stripe checkout
    stripeCheckout.open({
      name: 'Firebelly Checkout',
      amount: cart.total * 100,
      billingAddress: true,
      shippingAddress: true
    });


    // Old PayPal form that sends user off to PayPal checkout
    // var $form = $('form.cart-wrap');
    // for(var i = 0; i < cart.length; ++i) {
    //   $("<input type='hidden' name='quantity_" + (i+1) + "' value='" + cart.items[i].quantity + "'>" +
    //     "<input type='hidden' name='item_name_" + (i+1) + "' value='" + cart.items[i].title + "'>" +
    //     "<input type='hidden' name='item_weight_" + (i+1) + "' value='" + cart.items[i].weight + "'>" +
    //     "<input type='hidden' name='item_number_" + (i+1) + "' value='nb-" + cart.items[i].id + "'>" +
    //     "<input type='hidden' name='amount_" + (i+1) + "' value='" + cart.items[i].price + "'>")
    //   .appendTo($form);
    // }
    // // PayPal so stinkin' slow
    // $('.cart').addClass('loading').find('button.checkout').text('Contacting PayPal...').prop('disabled', true);
    // setTimeout(function() {
    //   $form.submit();
    // }, 150);
  }
  return {
    init: _init
  };

})();

// fire up the mothership
$(window).ready(function() {
  $.firebelly.store.init();
});
