$(function() {
  var switchers = $('.switch');
  switchers.each(function (i, switcher) {
    switcher = $(switcher);
    var firstGroupElementIds = $(switcher).attr("data-visible-elements-first-case");
    if(firstGroupElementIds) {
      firstGroupElementIds = firstGroupElementIds.split(' ');
      firstGroupElementIds = $.map(firstGroupElementIds, function(id) {
        return $('#' + id);
      })
    }
    var secondGroupElementIds = $(switcher).attr("data-visible-elements-second-case");
    if(secondGroupElementIds) {
      secondGroupElementIds = secondGroupElementIds.split(' ');
      secondGroupElementIds = $.map(secondGroupElementIds, function(id) {
        return $('#' + id);
      })
    }
    switcher.find('input').get(0).analyze = analyzeSwitch;

    function analyzeSwitch(switcher) {
      if(!switcher) {
        switcher = $(this);
      }
      if($(switcher).is(":checked")) {
        showAll(secondGroupElementIds);
        hideAll(firstGroupElementIds);
      } else {
        showAll(firstGroupElementIds);
        hideAll(secondGroupElementIds);
      }
    }

    switcher.find('input').on('change', function (e) {
      analyzeSwitch(e.target);
    })
    analyzeSwitch(switcher.find('input'));
  })
});

function hideAll(elements) {
  $(elements).each(function(i, elem) {
    $(elem).hide();
  })
}

function showAll(elements) {
  $(elements).each(function(i, elem) {
    $(elem).show();
  })
}
