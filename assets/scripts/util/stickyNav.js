// Sticky header nav
//
// Toggles "nav-stuck" class to body as you scroll past element of class "nav-main"

// Shared vars among modules
import appState from './appState';

export let $nav,
    $body,
    $window,
    navBottom,
    offset = 0,
    scrollTop,
    ticking;

const stickyNav = {

  // Init sticky headers
  init() {
    $body = $('body');
    $nav = $('.nav-main');
    $window = $(window);

    stickyNav.resize();
    stickyNav.scrolling();
    stickyNav.update();

    $window.off('scroll.stickyNav').on('scroll.stickyNav', stickyNav.scrolling);
    $window.off('resize.stickyNav').on('resize.stickyNav', stickyNav.resize);
    $window.off('load.stickyNav').on('load.stickyNav', function() { stickyNav.resize(); stickyNav.scrolling(); stickyNav.update(); });
  },

  // Request update using requestAnimationFrame
  requestTick() {
    if(!ticking) {
      requestAnimationFrame(stickyNav.update);
    }
    ticking = true;
  },

  // Update positions of sticky nav
  update() {
    ticking = false;
    // If page is animating (set in common.js), unstick nav and return until !isAnimating
    if (appState.isAnimating) {
      appState.navStuck = false;
      return;
    }
    if (navBottom <= scrollTop && !appState.navStuck) {
      $body.addClass('nav-stuck');
      appState.navStuck = true;
    }
    if (navBottom >= scrollTop && appState.navStuck) {
      $body.removeClass('nav-stuck');
      appState.navStuck = false;
    }
  },

  // Resizing window
  resize() {
    navBottom = $nav.outerHeight();
  },

  // Scrolling
  scrolling() {
    scrollTop = $window.scrollTop() + offset;
    stickyNav.requestTick();
  }

};

export default stickyNav
