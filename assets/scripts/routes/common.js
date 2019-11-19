import Flickity from 'flickity';
require('flickity-imagesloaded');
import { disableBodyScroll, enableBodyScroll, clearAllBodyScrollLocks } from 'body-scroll-lock';

import appState from '../util/appState';

export default {
  init() {
    const $body = $('body');
    const $window = $(window);
    const $html = $('html');
    const pageAt = window.location.pathname;
    const $siteNav = $('#site-nav');

    let transitionElements = [],
        resizeTimer,
        breakpointIndicatorString,
        breakpoint_xl = false,
        breakpoint_nav = false,
        breakpoint_lg = false,
        breakpoint_md = false,
        breakpoint_sm = false,
        breakpoint_xs = false;

    transitionElements = [$siteNav];

    // JavaScript to be fired on all pages
    _initCustomCursor();
    _initSmoothScroll();
    _initActiveToggle();
    _initHoverPairs();
    _initSiteNav();

    function _initCustomCursor() {
      if (!$('.js-cursor').length) {
        return;
      }

      $customCursor = $('<div class="cursor"></div>').appendTo($body);

      var lastMousePosition = { x: 0, y: 0 };

        // Update the mouse position
        function onMouseMove(evt) {
          lastMousePosition.x = evt.clientX;
          lastMousePosition.y = evt.clientY;
          requestAnimationFrame(update);
        }

        function update() {
          // Get the element we're hovered on
          var hoveredEl = document.elementFromPoint(lastMousePosition.x, lastMousePosition.y);

          // Check if the element or any of its parents have a .js-cursor class
          if ($(hoveredEl).parents('.js-cursor').length || $(hoveredEl).hasClass('js-cursor')) {
            $body.addClass('-cursor-active');

            if ($(hoveredEl).is('.previous')) {
              $customCursor.addClass('previous');
            } else {
              $customCursor.removeClass('previous');
            }

            if ($(hoveredEl).is('.next')) {
              $customCursor.addClass('next');
            } else {
              $customCursor.removeClass('next');
            }
          } else {
            $body.removeClass('-cursor-active');
          }

          // now draw object at lastMousePosition
          $customCursor.css({
            'transform': 'translate3d(' + lastMousePosition.x + 'px, ' + lastMousePosition.y + 'px, 0)'
          });
        }

        // Listen for mouse movement
        document.addEventListener('mousemove', onMouseMove, false);
        // Make sure a user is still hovered on an element when they start scrolling
        document.addEventListener('scroll', update, false);
    }

    function _scrollBody(element, offset, duration, delay) {
      var headerOffset = $siteHeader.outerHeight();
      if (typeof offset === "undefined" || offset === null) {
        offset = headerOffset;
      }
      if (typeof duration === "undefined" || duration === null) {
        duration = 300;
      }

      if ($(element).length) {
        appState.isAnimating = true;
        element.velocity("scroll", {
          duration: duration,
          delay: delay,
          offset: -offset,
          complete: function(elements) {
            appState.isAnimating = false;
          }
        }, "easeOutSine");
      }
    }

    function _disableScroll() {
      var st = $(window).scrollTop();
      $body.attr('data-st', st);
      $body.addClass('no-scroll');
      $body.css('top', -st);
    }

    function _enableScroll() {
      $body.removeClass('no-scroll');
      $body.css('top', '');
      $(window).scrollTop($body.attr('data-st'));
      $body.attr('data-st', '');
    }

    function _getUrlParameter(name) {
      name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
      var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
      var results = regex.exec(location.search);
      return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }

    function _initSmoothScroll() {
      $body.on('click', '.smooth-scroll', function(e) {
        e.preventDefault();
        _scrollBody($($(this).attr('href')));
      });
    }

    function _initActiveToggle() {
      $(document).on('click', '[data-active-toggle].-active', function(e) {
        if ($(this).attr('data-active-toggle') !== '') {
          $(this).removeClass('-active');
          $($(this).attr('data-active-toggle')).removeClass('-active');
        }
      });
      $(document).on('click', '[data-active-toggle]:not(.-active)', function(e) {
        if ($(this).attr('data-active-toggle') !== '') {
          $(this).addClass('-active');
          $($(this).attr('data-active-toggle')).addClass('-active');
        }
      });
    }

    function _initHoverPairs() {
      $(document).on('mouseenter', '[data-hover-pair]', function(e) {
        var hoverPair = $(this).attr('data-hover-pair');
        $('[data-hover-pair="'+hoverPair+'"]').addClass('-hover');
      }).on('mouseleave', '[data-hover-pair]', function(e) {
        var hoverPair = $(this).attr('data-hover-pair');
        $('[data-hover-pair="'+hoverPair+'"]').removeClass('-hover');
      });
    }


    function _initSiteNav() {

      $(document).on('click', '#nav-open', _openNav);

      $(document).on('click', '#nav-close', _closeNav);
    }

    function _openNav() {
      $body.addClass('nav-open');
      $siteNav.addClass('-active');
      appState.navOpen = true;
    }

    function _closeNav() {
      if (!appState.navOpen) {
        return;
      }
      $body.removeClass('nav-open');
      $siteNav.removeClass('-active');
      appState.navOpen = false;
    }
  },
  finalize() {
    // JavaScript to be fired on all pages, after page specific JS is fired
  },
};
