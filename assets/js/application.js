// fb3-craft js

//=include "../bower_components/jquery/dist/jquery.js"
//=include "../bower_components/jquery.fitvids/jquery.fitvids.js"
//=include "../bower_components/velocity/velocity.min.js"
//=include "../bower_components/imagesloaded/imagesloaded.pkgd.min.js"
// include "../bower_components/vanilla-lazyload/dist/lazyload.min.js"
//=include "../bower_components/jquery_lazyload/jquery.lazyload.js"
//=include "../bower_components/waypoints/lib/jquery.waypoints.js"
//=include "../bower_components/jquery-validation/dist/jquery.validate.js"
//=include "../bower_components/flickity/dist/flickity.pkgd.js"
//=include "store.js"

$.firebelly = $.firebelly || {};

// good design for good reason for good namespace
$.firebelly.main = (function() {

  var screenWidth = 0,
      desktop = false,
      handheld = false,
      tablet = false,
      adminStatus = false,
      isAnimating = false,
      personClosing = false,
      numLazyLoaded = 0,
      $body,
      $customCursor;

  function _init() {
    $body = $(document.body);

    $('#flash').hide().css('visibility','visible').fadeIn();

    $('.flickity').flickity({
      pageDots: false,
      imagesLoaded: true,
    });
    // .on( 'dragMove.flickity', function( event, pointer, moveVector ) {
    //   // update custom cursor location
    //   $customCursor.css({
    //     'transform': 'translate3d(' + pointer.clientX + 'px, ' + pointer.clientY + 'px, 0)'
    //   });
    // });

    // remove useless alt tooltips
    $('img').each(function () {
      if (!$(this).attr('title')) {
        $(this).attr('title', '');
      }
    });

    if (window.location.hash) {
      // Open Person Bio if on the people page
      if($('body').is('#people-page')) {
        var $person = $(window.location.hash);
        _openPerson($person);
      }
    }

    // responsive videos
    $('.summary.user-content, .content').fitVids();

    // lazyload images
    _initLazyload();

    // Keyboard nerds rejoice
    $(document).keyup(function(e) {
      if (e.keyCode == 27) {
        _hideSidebar();
        if ($('.person.active').length) {
          _closePerson();
        }
      } else if (e.keyCode == 37 || e.keyCode == 38) {
        // Previous Person
        if ($('.person.active').length) {
          _peopleNavigation('previous');
        }
      } else if (e.keyCode == 39 || e.keyCode == 40) {
        // Next Person
        if ($('.person.active').length) {
          _peopleNavigation('next');
        }
      }
    });

    // Homepage
    if ($('#work-page.index').length) {
      _scrollToFilters();
      // SEO useless filter header
      var filterHeader = $('<div class="filter-header">Filter:<p><span class="filter"></span> </p></div>').prependTo('#page .portfolio');
      $('<button type="button" class="tcon tcon-no-animate tcon-menu--xcross xcross-open xcross-small" aria-label="remove project filter"><span class="tcon-menu__lines" aria-hidden="true"></span><span class="tcon-visuallyhidden">remove project filter</span></button>')
      .appendTo(filterHeader.find('p')).on('click', function(e) {
        e.preventDefault();
        $('#filters .show-all a').trigger('click');
      });
    }

    _resize();
    _newsletterInit();
    _transformicions();
    _sidebarToggle();
    _sidebarColors();
    _scrollToContact();
    _hideHeader();
    _initFilterNav();
    _initSmoothScroll();
    // _initCustomCursor();
    _initTypeTester();
    _removeEmptyProjectBlocks();

    if ($('body').is('#people-page')) {
      _initPeopleFunctions();
    }
  }

  function _initCustomCursor() {
    $customCursor = $('<div class="cursor">&larr; &rarr;</div>').appendTo($body);

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

  function _newsletterInit() {
    // ajaxify all newsletter signup forms
    $('form.newsletter').each(function() {
      var $form = $(this);
      $form.on('submit', function(e) {
        e.preventDefault();
        if ($form.find('input[name=EMAIL]').val()=='') {
          $form.find('label.status').addClass('error').text('Error: Please enter an email.');
        } else {
          $.getJSON($form.attr('action'), $form.serialize())
            .done(function(data) {
              if (data.result != 'success') {
                if (data.msg.match(/already subscribed/)) {
                  $form.find('label.status').addClass('error').text('Error: You are already subscribed to our newsletter.');
                } else {
                  $form.find('label.status').addClass('error').text('Error: ' + data.msg);
                }
              } else {
                $form.find('label.status').removeClass('error').addClass('success').text("Success: " + data.msg);
              }
            })
            .fail(function() {
              $form.find('label.status').addClass('error').text('Error: There was an error subscribing. Please try again.');
            });
        }
      });
    });
  }

  function _scrollBody(element, duration, delay) {
    // var headerHeight = $('.site-header').outerHeight();
    _hideHeader();
    var headerHeight = 0;
    isAnimating = true;
    element.velocity("scroll", {
      duration: duration,
      delay: delay,
      offset: -headerHeight,
      complete: function(elements) {
        isAnimating = false;
      }
    }, "easeOutSine");
  }

  function _transformicions() {
    $('.tcon:not(.tcon-no-animate)').on('click', function(e) {
      e.preventDefault();
      $(this).toggleClass('tcon-transform');
    });
  }

  function _sidebarToggle() {
    $('html').on('click', '.menu-toggle', function() {
      $('#side').toggleClass('open');
      $('body, #page, .site-header, .site-footer').toggleClass('sidebar-open');
    });

    $('html').on('click', '.project-side-toggle', function() {
      $('#project-side').toggleClass('open');

      // init lazyload images in sidebar if not already done
      if (!$('#project-side').hasClass('lazy-loaded')) {
        $('.lazy-side').lazyload({
          container : $('#project-side .projects'),
          effect : 'fadeIn',
        });
        $('#project-side').addClass('lazy-loaded');
      }

      $('body, #page, .site-header, .site-footer').toggleClass('project-side-open');
    });

    // Close sidebar when clicking away
    $('html').on('click', '#page.sidebar-open, .site-footer.sidebar-open, #page.project-side-open, .site-footer.project-side-open', function(e) {
      if (!$(e.target).is('a, a > *,button,input')) {
        e.preventDefault();
        _hideSidebar();
      } else {
        return e;
      }
    });
  }

  function _hideSidebar() {
    $('#side,#project-side').removeClass('open');
    $('.sidebar-open').removeClass('sidebar-open');
    $('.project-side-open').removeClass('project-side-open');
  }

  function _showSidebar() {
    if (!$('#side').is('.open')) {
      $('#side').addClass('open');
      $('body, #page, .site-header, .site-footer').addClass('sidebar-open');
    }
  }

  function _sidebarColors() {
    $('.site-nav a').hover(function() {
      color = $(this).attr('data-color');
      $('#side').addClass('color-' + color);
    }, function() {
      $('#side').removeClass('color-' + color);
    });
  }

  function _initSmoothScroll() {
    $('#wrapper').on('click', '.smoothscroll a', function(e){
      e.preventDefault();
      var el = $( $(this).attr('href') );
      if (el.length) _scrollBody(el);
    });
  }

  function _scrollToContact() {
    $('.nav-contact a').on('click', function(e) {
      e.preventDefault();
       _hideSidebar();
       _scrollBody($('#contact'), 250, 250);
       $('body').addClass('focus-contact');
       setTimeout(function() {
         $('body').removeClass('focus-contact');
       }, 1500);
    });
  }

  function _scrollToFilters() {
    // When clicking on a filter, scroll to top of grid
    $('#filters a').on('click', function() {
      _scrollBody($('#page .projects'), 250, 0);
    });
  }

  function _hideHeader() {
    // Hide Header on on scroll down
    var didScroll;
    var lastScrollTop = 0;
    var delta = 5;
    var navbarHeight = $('.site-header').outerHeight();

    $(window).scroll(function(event){
        didScroll = true;
    });

    setInterval(function() {
        if (!isAnimating && didScroll) {
            _hasScrolled();
            didScroll = false;
        }
    }, 250);

    function _hasScrolled() {
        var st = $(this).scrollTop();

        // Make sure they scroll more than delta
        if(Math.abs(lastScrollTop - st) <= delta)
            return;

        // If they scrolled down and are past the navbar, add class .nav-up.
        // This is necessary so you never see what is "behind" the navbar.
        if (st > lastScrollTop && st > navbarHeight){
            // Scroll Down
            $('.site-header').removeClass('nav-down').addClass('nav-up');
        } else {
            // Scroll Up
            if(st + $(window).height() < $(document).height()) {
                $('header').removeClass('nav-up').addClass('nav-down');
            } else if (st < navbarHeight) {
              $('.site-header').removeClass('-fixed');
            }
        }

        lastScrollTop = st;
    }
  }

  function _initFilterNav() {
    if ($('.filter-items li').length>0) {
      // init filtering
      $('#filters a').click(function(e) {
        e.preventDefault();
        if ($(this).hasClass('selected')) {
          $('#filters .show-all a').trigger('click');
        } else {
          var filter = $(this).attr('data-filter');
          _filterProjects(filter);
          window.location.hash = '#' + filter;
        }
        return false;
      });
      // initial filter?
      if (window.location.hash) {
        var filter = window.location.hash.replace('#','');
        _filterProjects(filter);
        // make sure images are shown after filtering
        $('.lazy').trigger('appear');
      }
    }
  }

  function _initPeopleFunctions() {
    var $people = $('.person');
    var peopleCount = $people.length;
    var midpoint = peopleCount / 2;
    var offset = 44;

    $people.each(function(i) {
      // Hover Image Positioning
      var $hoverImage = $(this).find('.hover-image');
      var personNumber = i + 1;
      var interval;

      if (personNumber <= midpoint) {
        interval = 50 + 50 * (i / midpoint - 1);
        $hoverImage.css({
          'top': -offset,
          'transform': 'translateY(-'+interval+'%)'
        });
      } else if (personNumber >= midpoint) {
        interval = 50 - 50 * (i / (peopleCount - 1));
        $hoverImage.css({
          'bottom': -offset,
          'transform': 'translateY('+interval+'%)'
        });
      }

      // Duplicate The Name to create a split color effect
      var $duplicateTitle = $(this).find('.person-toggle .inner').clone().appendTo($(this).find('.person-toggle'));
      $duplicateTitle.addClass('duplicate-title').attr('aria-hidden', "true");
    });

    // Add the Close Button
    $people.each(function() {
      $(this).find('.person-body').append('<button type="button" class="person-close tcon tcon-no-animate tcon-menu--xcross xcross-open"><span class="tcon-menu__lines" aria-hidden="true"></span></button>');
    });

    $('.person-close').on('click', _closePerson);

    // Accordion functionality
    $('.person-toggle').on('click', function() {
      var $person = $(this).closest('.person');
      _openPerson($person);
    });

    // Open a person from the sidebar
    $('#filters a').on('click', function(e) {
      e.preventDefault();
      var $person = $($(this).attr('href'));
      _openPerson($person);
    });
  }

  function _checkForPersonClosing($person) {
    if (personClosing == false) {
      _expandPerson($person);
    } else {
      setTimeout(function() {
        _checkForPersonClosing($person);
      }, 50);
    }
  }

  function _closePerson() {
    personClosing = true;
    $('.person.active .person-body')
      .velocity('fadeOut', {duration: 300, queue: false})
      .velocity('slideUp', {
        duration: 300,
        complete: function(elements) { personClosing = false; }
    });
    $('.person.active').removeClass('active');
    if (window.location.hash) {
      history.pushState({}, document.title, window.location.pathname);
    }
  }

  function _openPerson($person) {
    // Close another open person
    if ($('.person').not($person).is('.active')) {
      _closePerson(true);
      _checkForPersonClosing($person);
    } else {
      _expandPerson($person);
    }
  }

  function _peopleNavigation(direction) {
    var $people = $('.person');
    var $activePerson = $('.person.active');
    var $person;

    if (direction === 'previous') {
      if ($activePerson.prev('.person').length) {
        $person = $activePerson.prev('.person');
      } else {
        $person = $($people[$people.length - 1]);
      }
    } else if (direction === 'next') {
      if ($activePerson.next('.person').length) {
        $person = $activePerson.next('.person');
      } else {
        $person = $($people[0]);
      }
    }

    _openPerson($person);
  }

  function _expandPerson($person) {
    personId = '#' + $person.attr('id');
    _scrollBody($person, 300);
    $person.addClass('active');
    $person.find('.person-body')
      .velocity('fadeIn', {duration: 500, queue: false})
      .velocity('slideDown', {duration: 500});
  }

  function _initLazyload() {
    $('.lazy').attr('title','').lazyload({
      effect : 'fadeIn',
      threshold: 500,
      load: function() {
        if (numLazyLoaded==-1) return; // set to -1 after all lazy images are triggered to load
        numLazyLoaded++;
        $(this).addClass('lazyloaded');
        // On single pages, load *all* images after 3 images have loaded, otherwise wait for 12
        if ((numLazyLoaded > 3 && $('body.single').length) ||
            numLazyLoaded > 12) {
          $('.lazy:not(.lazyloaded)').trigger('appear');
          numLazyLoaded = -1;
        }
      }
    });
  }

  function _filterProjects(filter) {
    // highlight filter in nav
    $('#filters a').removeClass('selected');

    var activeFilter = $('#filters a[data-filter="'+filter+'"]');
    activeFilter.addClass('selected');
    if (filter != '') {
      $('.filter-header').addClass('active').find('.filter').html(activeFilter.html());
    } else {
      $('.filter-header').removeClass('active');
    }

    // dim all projects not matching filter
    $('.filter-items li').each(function() {
      if (filter=='' || $(this).attr('data-industry').match(filter) || $(this).attr('data-services').match(filter)) {
        $(this).removeClass('dim').addClass('selected');
      } else {
        $(this).removeClass('selected').addClass('dim');
      }
    });

    // if on mobile, slide out nav after clicking
    if (handheld) {
      _hideSidebar();
    }
  }

  function _initTypeTester() {
    // If there's a type tester present
    if ($('.type-tester').length) {
      var $fontStyle;
      var $typeTester = $('.type-tester');
      var $typeTesterInner = $('.type-tester-inner');
      var $para = $typeTester.find('#test-para');
      var fontFamily = $typeTester.attr('data-font');
      var startingFontSize = $typeTester.attr('data-font-size');
      var lineHeight = $typeTester.attr('data-line-height');
      var svgUrl = $typeTester.attr('data-svg-url');

      // Initialize CSS for tester
      $typeTesterInner.css({
        'font-family': fontFamily+', "AdobeBlank"',
        'line-height': lineHeight
      });

      // Set Up Tools
      $typeTester.prepend('<div id="typetools"><div class="typetools-container block-wrap"></div></div>');
      var $tools = $('#typetools');
      var $toolsContainer = $tools.find('.typetools-container');

      // Get SVG font file if it is set and generate the glypgh chart
      if ($typeTester.attr('data-svg-url')) {
        var glyphsLineHeight = $typeTester.attr('data-glyphs-line-height');
        $('.type-tester-inner').append('<div id="typeTesterSvgFont" style="display:none;"></div><div id="glyphChart" class="block-wrap" style="font-family:'+fontFamily+';font-size:'+startingFontSize+'px;line-height:'+glyphsLineHeight+';"><ul id="glyphsLowercase"></ul><ul id="glyphsUppercase"></ul><ul id="glyphsOther"></ul></div>');
        var $svgContainer = $('#typeTesterSvgFont');
        var $glyphChart = $('#glyphChart');

        // Add glyphs button to toolbar
        $toolsContainer.append('<div class="type-tool" id="glyphsTypeToggle"><h4>View</h4><button id="typeToggle" class="-active" data-target=".test-para">Type Tester</button><button id="glyphsToggle" data-target="#glyphChart">Glyphs</button></div>');

        // Watch for glyphs/type toggle
        $(document).on('click', '#glyphsTypeToggle button', function() {
          var targetElem = $(this).attr('data-target');
          $('#glyphChart.-active, .test-para.-active, #glyphsTypeToggle button.-active').removeClass('-active');
          $(targetElem).addClass('-active');
          $(this).addClass('-active');

          // Add/remove -hidden class on type-only tools
          if (targetElem === '.test-para') {
            $('.type-tool.type-only').removeClass('hidden');
          } else {
            $('.type-tool.type-only').addClass('hidden');
          }
        });

        $svgContainer.load(svgUrl, function(svgUrl) {
          // Find all glyph nodes in the SVG file
          var svg = $svgContainer.find('svg glyph[unicode][d]');

          // Add unicode escaping for CSS
          var unicodePrefix = '\\';
          var glyphs = {'glyphsLowercase': [], 'glyphsUppercase': [], 'glyphsOther': []};
          var lowercase = new RegExp("^([a-z])$");
          var uppercase = new RegExp("^([A-Z])$");

          for (var i=0; i < svg.length; i++) {
            var unicode = svg[i].getAttribute('unicode').toString();
            if (lowercase.test(unicode)) {
              glyphs.glyphsLowercase.push(unicode);
            } else if (uppercase.test(unicode)) {
              glyphs.glyphsUppercase.push(unicode);
            } else {
              glyphs.glyphsOther.push(unicode);
            }
          }

          $.each(glyphs, function(group, groupArray) {
            var glyphsOutput = '';

            for (var i=0; i < groupArray.length; i++) {
              var glyphChar = groupArray[i].charCodeAt();

              glyphChar = glyphChar.toString(16); // Convert to string format
              glyphsOutput += '<li class="glyph-' + groupArray[i] + '">' + groupArray[i] + '</li>';
            }

            $glyphChart.find('#'+group).append(glyphsOutput);
          });

        });

      }

      // Font Size
      // Get min/max from data attributes
      var minSize = $typeTester.attr('data-min-size');
      var maxSize = $typeTester.attr('data-max-size');

      $toolsContainer.append('<div class="type-tool type-only" id="fontSizeTool"><label for="fontSize" id="fontSizeLabel">Size: <span id="currentFontSize"></span></label><input type="range" name="fontSize" id="fontSize" min="'+minSize+'" max="'+maxSize+'" step="6"></div>');
      var $fontSize = $('#fontSize');
      var $currentFontSize = $('#currentFontSize');
      // Set starting font size
      $typeTesterInner.css('font-size', startingFontSize+'px');
      $fontSize.val(startingFontSize);
      $currentFontSize.html(startingFontSize+'px');

      // Font Styles
      // if ($typeTester.attr('data-styles')) {
      //   var dataStyles = $typeTester.attr('data-styles');
      //   var styles = dataStyles.split('-');

      //   if (styles.length > 1) {
      //     $toolsContainer.append('<div class="type-tool"><label for="fontStyle">Style</label><select name="fontStyle" id="fontStyle"></select></div>');
      //     var $fontStyle = $('#fontStyle');
      //     $.each(styles, function(i) {
      //       $fontStyle.append('<option value="'+this+'">'+this+'</option>');
      //     });
      //   }

      //   // Style
      //   $fontStyle.on('change', function(e) {
      //     var currentStyle = $(this).val();
      //     $typeTesterInner.css('font-style', currentStyle);
      //   });
      // }

      // Font Weights
      if ($typeTester.attr('data-weights')) {
        $toolsContainer.append('<div class="type-tool"><label for="fontWeight">Weight</label><select name="fontWeight" id="fontWeight"></select></div>');
        var $fontWeight = $('#fontWeight');

        var dataStyles = $typeTester.attr('data-weights');
        var weights = dataStyles.split('-');
        $.each(weights, function(i) {
          $fontWeight.append('<option value="'+this+'">'+this+'</option>');
        });

        // Weight
        $fontWeight.on('change', function(e) {
          var currentStyle = $(this).val();
          $typeTesterInner.css('font-weight', currentStyle);
        });
      }

      // Paragraph Style
      $toolsContainer.append('<div class="type-tool type-only" id="textAlignment"><label>Align</label><button class="alignment -left -active" data-alignment="left"><span class="visually-hidden">Left</span><span class="lines"></span></button><button class="alignment -center" data-alignment="center"><span class="visually-hidden">Center</span><span class="lines"></span></button><button class="alignment -right" data-alignment="right"><span class="visually-hidden">Right</span><span class="lines"></span></button></div>');
      var $textAlignment = $('#textAlignment');

      // Color Pairs
      if ($typeTester.attr('data-color-pairs') !== 'undefined') {
        $toolsContainer.append('<div class="type-tool" id="colorPairs"><label>Color</label><div id="colorPairsContainer"></div></div>');
        var $colorPairs = $('#colorPairs');
        var colorData = $typeTester.attr('data-color-pairs');
        var colorPairs = colorData.split(' ');

        $.each(colorPairs, function(i) {
          var colors = this.split('-');
          var textColor = colors[0];
          var backgroundColor = colors[1];

          $('#colorPairsContainer').append('<button class="color-pair" data-text-color="'+textColor+'" data-background-color="'+backgroundColor+'"><span style="color:'+textColor+';background-color:'+backgroundColor+';">A</span></button>');
        });

        $('#colorPairs .color-pair:first').addClass('-active');
        var textColor = $('#colorPairs .color-pair:first').attr('data-text-color');
        var backgroundColor = $('#colorPairs .color-pair:first').attr('data-background-color');
        $('.type-tester-inner').css({
          'color': textColor,
          'background-color': backgroundColor
        });

        $colorPairs.on('click', 'button', function() {
          $('.color-pair.-active').removeClass('-active');
          $(this).addClass('-active');
          var textColor = $(this).attr('data-text-color');
          var backgroundColor = $(this).attr('data-background-color');
          $('.type-tester-inner').css({
            'color': textColor,
            'background-color': backgroundColor
          });
        });
      }

      // Watch for changes on individual tools
      // Size
      $fontSize.on('input', function(e) {
        var currentSize = $(this).val();
        $currentFontSize.html(currentSize+'px');
        $para.css('font-size', currentSize+'px');
      });

      // Text Alignment
      $textAlignment.on('click', 'button', function(e) {
        $textAlignment.find('button.-active').removeClass('-active');
        $(this).addClass('-active');
        var alignment = $(this).attr('data-alignment');
        $para.css('text-align', alignment);
      });

      // Type Tester Activation
      $para.on('focus', function(e) {
        $(this).find('.type-cursor').remove();
      }).on('blur', function(e) {
        paraText = $(this).html().replace(/(<br>\s*)+$/,'');
        $(this).html(paraText);
        $(this).append('<span class="type-cursor"></span>');
      });

    }
  }

  function _hexToRgba(hex, alpha) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      return 'rgba('+parseInt(result[1], 16)+', '+parseInt(result[2], 16)+', '+parseInt(result[3], 16)+', '+alpha+')';
    } else {
      return null;
    }
  }

  function _removeEmptyProjectBlocks() {
    // The way we have project blocks set up,
    // full-width blocks might end up adding an empty
    // .block-wrap element after them that only contains
    // white space. This function is a banaid fix to remove
    // those blocks with just white space so they don't
    // create unwanted space between blocks
    $blockWraps = $('.block-wrap');

    $blockWraps.each(function() {
      var contents = $(this).html();
      if(!contents.replace(/\s/g, '').length) {
        $(this).css('display', 'none');
      }
    });
  }

  function _resize() {
    screenWidth = document.documentElement.clientWidth;
    giant_desktop = screenWidth > 1382;
    desktop = screenWidth > 767;
    handheld = screenWidth < 481;
    tablet = !desktop && !handheld;
  }

  return {
    init: _init,
    resize: _resize,
    showSidebar: _showSidebar
  };

})();

// fire up the mothership
$(window).ready(function() {
  $.firebelly.main.init();
});

$(window).resize(function(){
  $.firebelly.main.resize();
});
