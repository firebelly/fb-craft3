// Vertical sticky headers with push effect

export let $stickies = [],
    $stickyTitles = [],
    $target,
    offset = 20,
    scrollTop,
    targetHeight,
    ticking;

const stickyHeaders = {

  // Init sticky headers
  init() {
    if ($('.sticky-header').length) {
      $target = $(window);

      // Prepend 00, 01 to .sticky-titles (unless blank, which is final stopper sticky-header)
      $stickies = $('.sticky-header').each(function(i) {
        let titleNum = ('0' + i).slice(-2);
        let $title = $(this).find('.sticky-title');
        if ($title.text().trim() !== '') {
          $title.prepend('<i>' + titleNum + '</i>');
        }
      });

      stickyHeaders.setStickyPositions();

      $target.off('scroll.stickies').on('scroll.stickies', stickyHeaders.scrolling);
      $target.off('resize.stickies').on('resize.stickies', stickyHeaders.resizing);
      $target.off('load.stickies').on('load.stickies', stickyHeaders.resizing);
    }
  },

  // Request update using requestAnimationFrame
  requestTick() {
    if(!ticking) {
      requestAnimationFrame(stickyHeaders.update);
    }
    ticking = true;
  },

  // Update positions of sticky headers
  update() {
    ticking = false;
    $stickies.each(function(i) {

      let stickyPosition = this.getAttribute('data-originalPosition'),
          newPosition,
          $nextSticky;

      if (stickyPosition <= scrollTop) {

        newPosition = Math.max(offset, scrollTop - stickyPosition);
        $nextSticky = $stickies.eq(i + 1);
        if($nextSticky.length > 0) {
          newPosition = Math.min(newPosition, ($nextSticky.attr('data-originalPosition') - stickyPosition - offset) - this.getAttribute('data-originalHeight'));
        }

      } else {
        newPosition = offset;
      }

      $stickyTitles[i].css('top', newPosition + 'px');
    });
  },

  // Recalculate positions/sizes
  setStickyPositions() {
    targetHeight = $target.height();
    $stickies.each(function(i) {
      let $this = $(this);
      // Cache title elements
      $stickyTitles[i] = $this.find('.sticky-title');
      $this
        .attr('data-originalPosition', $this.offset().top)
        .attr('data-originalHeight', $this.find('.sticky-title').outerWidth() + 10);
    });
  },

  // Resizing
  resizing(event) {
    stickyHeaders.setStickyPositions();
  },

  // Scrolling
  scrolling(event) {
    scrollTop = $(event.currentTarget).scrollTop() + (targetHeight / 2) - 50;
    stickyHeaders.requestTick();
  }

};

export default stickyHeaders
