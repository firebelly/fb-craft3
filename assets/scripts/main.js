// import external dependencies
import Velocity from 'velocity-animate';

// import local dependencies
import Router from './util/Router';
import stickyHeaders from './util/stickyHeaders';
import stickyNav from './util/stickyNav';
import common from './routes/common';
import homepage from './routes/homepage';

/** Populate Router instance with DOM routes */
const routes = new Router({
  common,
  homepage,
});

// Init sticky headers
stickyHeaders.init();

// Init sticky nav
stickyNav.init();

// Load Events
$(document).ready(() => routes.loadEvents());

// Flickity fix for iOS 13
(function() {
  var touchingCarousel = false,
    touchStartCoords;

  document.body.addEventListener('touchstart', function(e) {
    if (e.target.closest('.flickity-slider')) {
      touchingCarousel = true;
    } else {
      touchingCarousel = false;
      return;
    }

    touchStartCoords = {
      x: e.touches[0].pageX,
      y: e.touches[0].pageY
    }
  });

  document.body.addEventListener('touchmove', function(e) {
    if (!(touchingCarousel && e.cancelable)) {
      return;
    }

    var moveVector = {
      x: e.touches[0].pageX - touchStartCoords.x,
      y: e.touches[0].pageY - touchStartCoords.y
    };

    if (Math.abs(moveVector.x) > 7)
      e.preventDefault()

  }, {passive: false});
})();
