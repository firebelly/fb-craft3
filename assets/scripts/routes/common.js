import Flickity from 'flickity';
require('flickity-imagesloaded');
import { disableBodyScroll, enableBodyScroll, clearAllBodyScrollLocks } from 'body-scroll-lock';
import * as p5 from 'p5';

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
    _initBlobs();

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

    function _initBlobs() {
      if (!$body.is('.with-blobs')) {
        return;
      }

      const sketch = p5 => {
        let maxWidth = 110,
            color = $body.attr('data-blob-color') || '#FF3D00',
            speed = 0.05,
            frameSpeed = 30,
            thickness = 48,
            minAmount = 4,
            maxAmount = 14,
            trail = false;

        // make library globally available
        window.p5 = p5;

        let blobs = []; // array of Jitter objects
        let amount = Math.ceil(p5.random(minAmount,maxAmount));

        p5.setup = () => {
          p5.createCanvas(window.innerWidth * 1.1, window.innerHeight * 1.1);
          p5.angleMode(p5.DEGREES);
          p5.noStroke();
          p5.frameRate(frameSpeed);
          // Create objects
          for (let i = 0; i < amount; i++) {
            blobs.push(new Jitter());
          }
        }

        p5.draw = () => {
          if (trail === false) {
            p5.clear();
          }
          for (let i = 0; i < blobs.length; i++) {
            p5.push();
            blobs[i].move();
            blobs[i].display();
            p5.pop();
          }
        }

        p5.windowResized = () => {
          p5.resizeCanvas(window.innerWidth * 1.1, window.innerHeight * 1.1, false);
        }

        // Jitter class
        class Jitter {
          constructor() {
            this.h = Math.random() * (maxWidth - thickness) + thickness;
            this.x = p5.random(p5.width - thickness);
            this.y = p5.random(p5.height - this.h);
            this.speed = p5.random(speed, speed + (speed * 3));
            this.rotation = p5.random(0,360);
          }

          move() {
            this.x += p5.random(-this.speed * 2, this.speed);
            this.y += -this.speed;
            // if (this.y + (this.h / 2) < 0) {
            //   this.y = p5.height + this.h;
            //   this.x = p5.random(p5.width);
            // }
          }

          display() {
            p5.fill(color);
            p5.push();
              p5.translate(this.x, this.y);
              p5.rotate(this.rotation);
              p5.rectMode(p5.CENTER);
              p5.rect(0, 0, thickness, this.h, 24, 24, 24, 24);
            p5.pop();
          }
        }
      }

      new p5(sketch);
    }
  },
  finalize() {
    // JavaScript to be fired on all pages, after page specific JS is fired
  },
};
