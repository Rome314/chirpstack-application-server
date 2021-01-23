$(document).ready(function() {
  function mergeStrings(str1, str2) {
    let str = "";
    if(str1.length > str2.length) {
      for (var i = 0; i < str1.length; i++) {
        if(str2[i] == undefined) {
          str += '';
        } else if(str2[i] == "●") {
          str += str1[i];
        } else {
          str += str2[i];
        }
        // str += str2[i] == undefined ? '' : (str2[i] != "●"? str2[i] : str1[i]);
      }
    } else {
      for (var i = 0; i < str2.length; i++) {

        if(str2[i] != "●") {
          str += str2[i];
        } else {
          if(str1[i] == undefined) {
            str += '';
          } else {
            str += str1[i];
          }
        }
        // str += str2[i] != "●"? str2[i] : (str1[i] != undefined ? str1[i] : '');
      }
    }

    return str;
  }
  var inputs = $('.input');
  inputs.each(function(i, input) {
    //Appearance
    initInput(input);
    var inputField = $(input).find('input');

    //Input event
    inputField.on('input', function(e) {
      var allowedSymbols = '0123456789ABCDEF';

      if($(this).data('prev') == undefined) {
        $(this).data('prev', "");
      }
      if($(this).data('data') == undefined) {
        $(this).data('data', "");
      }

      //====================
      var inp = $(e.target);
      var rightControls = $(e.target).closest('.input').find('.right-controls');
      var current = inp.val();
      var prev = inp.data('data');
      current = mergeStrings(prev, current);
      var length = current.length - prev.length;
        if(length > 0) {
          if(Math.abs(length) > 1) {
            if(current.indexOf(prev) == 0) {
              current = prev + current.slice(prev.length);
            }
          } else {
            // current = prev + current[current.length - 1];
          }
        } else {
          if(Math.abs(length) > 1) {
            if(current.indexOf(prev) == 0) {
              current = prev.slice(0, prev.length + length);
            }
          } else {
            // current = prev.slice(0, prev.length - 2);
          }
        }


      if(inp.hasClass('hex-input')){
        current = current.toUpperCase();
        current = current.replace(/ /g, '');
        var bytesCount = inp.attr('data-hex-length');
        bytesCount = bytesCount ? bytesCount : 8;
        for (var i = 0; i < current.length; i++) {
          if(allowedSymbols.indexOf(current[i]) < 0){
            prev = inp.hasClass('hidden-input') ? createMask(prev) : prev;
            inp.val(prev);
            return;
          }
        }
        if(current.length > bytesCount * 2) {
          prev = inp.hasClass('hidden-input') ? createMask(prev) : prev;
          inp.val(prev);
          return;
        }

        var newVal = "";
        for (var i = 0; i < current.length; i++) {
          let ch = current[i];
          newVal += ch;
          if(i % 2 == 1) {
            newVal += ' ';
          }
        }
        current = newVal;
      }

      inp.data('prev', newVal);
      inp.data('data', newVal);

      //linked inputs
      if(inp.hasClass('linked-input') && inp.hasClass('linked-input-master')){
        let slave = $('#'+$(inp).attr('data-linked-input-id'));
        if(current.length > 0) {
          addOkControl(inp);
          if(slave.data('data') == current) {
            addOkControl(slave);
          }
        } else {
          removeOkControl(inp);
        }
        if(slave.data('data') != current) {
          removeOkControl(slave);
        }
      }
      if(inp.hasClass('linked-input') && inp.hasClass('linked-input-slave')){
        if(current.length > 0) {
          let master = $('#'+$(inp).attr('data-linked-input-id'));
          if(master.data('data') == current && rightControls.find('.control.ok').length == 0) {
            addOkControl(inp);
          } else {
            removeOkControl(inp);
          }
        } else {
          removeOkControl(inp);
        }
      }

      if(inp.hasClass('hidden-input')){
        inp.val(createMask(current, !inp.hasClass('hex-input')));
      } else {
        inp.val(current);
      }

      $(this).data('data', current);
      $(this).data('prev', current);
    })

    function createMask(str, maskSpace) {
      var maskedVal = '';
      for(var index in str) {
        maskedVal += str[index] != ' ' ? '●' : ' ';
      }
      return maskSpace ? maskedVal.replace(/ /g,"●") : maskedVal;
    }


    //control events
    $(input).find('.control').hover( function(e) {
      var control = $(e.currentTarget);
      var tooltip = control.find(".tooltip");
      tooltip.css({
        visibility: "",
        opacity: ""
      })
    });
    //control events
    $(input).find('.control').on('click', function(e) {
      var control = $(e.currentTarget);
      var tooltip = control.find(".tooltip");
      var ownInput = control.parent().parent().find('input');
      var disabled = ownInput.attr('disabled');
      var root = control.closest('.input');

      if(disabled && !control.hasClass('control-copy') && !control.hasClass('control-hidden')) {
        return;
      }

      //hidden control
      if(control.hasClass('control-hidden')) {
        if(ownInput.hasClass('hidden-input')) {
          ownInput.removeClass('hidden-input');
          control.removeClass('hidden');
        } else {
          ownInput.addClass('hidden-input');
          control.addClass('hidden');
        }
      }
      //hex-generate control
      if(control.hasClass('control-hex-generate')) {
        var bytesCount = ownInput.attr('data-hex-length');
        $(ownInput).data('data', generateHex(bytesCount ? bytesCount : 8) + ' ');
        $(ownInput).data('prev', $(ownInput).data('data'));
        root.get(0).validate();
      }
      //copy control
      if(control.hasClass('control-copy')) {
        var copyData = $(ownInput).data('data');
        if(copyData == undefined) {
          copyData = "";
        }
        $.copyToClipBoard(copyData.replace(/ /g, ''));
      }

      if(ownInput.hasClass('hidden-input')) {
        ownInput.val(createMask($(ownInput).data('data'), !ownInput.hasClass('hex-input')));
      } else {
        ownInput.val($(ownInput).data('data'));
      }

      tooltip.css({
        visibility: "hidden",
        opacity: 0
      })
    })

    $(input).find('input').on('focusout', function(e) {
      var inp = $(e.target);
      var disabled = inp.attr('disabled');

      if(disabled) {
        return;
      }
      if(inp.hasClass('hex-input')){
        inp.parent().parent().get(0).validate();
      }
    })

    function generateHex(bytesCount) {
      var hexSymbols = '0123456789ABCDEF';
      var hex = '';
      for (var i = 0; i < bytesCount * 2; i++) {
        hex += hexSymbols[Math.floor(Math.random() * hexSymbols.length)];
        if(i % 2 && i != bytesCount * 2 - 1) {
          hex += ' ';
        }
      }
      return hex;
    }

    //validate method
    input.validate = function() {
      if($(this).css('display') == 'none') {
        return true;
      }

      var inp = $(this).find('input');
      var error = $(this).find('error');
      var isValid = true;
      var errMsg;

      if($(this).hasClass('switcher')) {
        return true;
      }
      if(inp.hasClass('hex-input')) {
        var bytesCount = inp.attr('data-hex-length');
        bytesCount = bytesCount ? bytesCount : 8;
        isValid = inp.data('data') != undefined && inp.data('data').replace(/ /g, '').length == bytesCount * 2;
        errMsg = isValid ? undefined : 'Device EUI must consist of exactly ' + bytesCount + ' bytes';
      }
      // if(inp.hasClass('linked-input')){
      if(inp.hasClass('linked-input-slave')){
        var linkedInput = $('#'+$(inp).attr('data-linked-input-id'));
        isValid = inp.data('data') == linkedInput.data('data');
        errMsg = isValid ? undefined : 'The passwords you entered are not the same';
      }
      if(isValid) {
        isValid = inp.data('data') != undefined && inp.data('data') != '';
        errMsg = isValid ? undefined : 'The field cannot be is empty';
      }
      this.toogleError(errMsg);
      return isValid;
    }

    input.toogleError = function(msg) {
      let error = $(this).find('.error');
      if(!msg) {
        error.hide();
        $(this).removeClass('error');
        // $(this).addClass('success');
        addOkControl($(this).find('input'));
        return;
      }
      $(this).addClass('error');
      $(this).removeClass('success');
      error.find('.text').text(msg);
      error.show();
      removeOkControl($(this).find('input'));
      initInput(this);
    }

    input.clear = function() {
      let error = $(this).find('.error');
      error.hide();
      $(this).removeClass('error');
      removeOkControl($(this).find('input'));
      $(this).removeClass('success');
      initInput(this);
      $(this).find('input').data('data', '');
      $(this).find('input').data('prev', '');
      $(this).find('input').val('');
    }

    input.getNameAndValue = function() {
      let inp = $(this).find('input');
      return {
        value: inp.data('data') !== undefined  ?
                inp.data('data').replace(/ /g, '') : '',
        name: inp.attr('name')
      }
    }

    input.setValue = function(data) {
      var value = data.value;
      var input = $(this).find('input');

      if(input.hasClass('hex-input')) {
        value = value.replace(/ /g, '');
        var newVal = '';
        for (var i = 0; i < value.length; i++) {
          var v = value[i];
          newVal += v;
          if(i % 2 == 1) {
            newVal += ' ';
          }
        }
        value = newVal.toUpperCase();
      }
      if(input.hasClass('dropdown-input') && data.dropdown) {
        var list = $(this).find('ul.dropdown-list');
        list.empty();
        for (var index in data.dropdown) {
          var li = $(document.createElement('li'));
          li.addClass('item');
          li.text(data.dropdown[index]);
          list.append(li);
        }
      }
      if(input.hasClass('switcher-input')) {
        $(input).closest('.switcher').find('.cases .case').each(function (i, item) {
          item = $(item);
          if(item.text().replace(/ /g, '').replace(/\n/g, '').toLowerCase() == value.toLowerCase()) {
            if(i == 1) {
              $(input).prop("checked", true);
            } else {
              $(input).prop("checked", false);
            }
            $(input).get(0).analyze();
            return false;
          }
        });
      }

      input.data('data', value);
      input.data('prev', value);
      if(input.hasClass('hidden-input')) {
        input.val(createMask(value, !input.hasClass('hex-input')));
      } else {
        input.val(value);
      }
    }

    $.copyToClipBoard = function (text) {
      if(navigator.clipboard != undefined) {//Chrome
        navigator.clipboard.writeText(text).then(function () {
        }, function (err) {
          console.error('Async: Could not copy text: ', err);
        });
      } else if(window.clipboardData) { // Internet Explorer
        window.clipboardData.setData("Text", text);
      }
    };
  });
});

function addOkControl(inp) {
  var input = $(inp).closest('.input');
  var rightControls = $(input).find('.right-controls');
  if(rightControls.find('.control.ok').length == 0) {
    var ok = $(document.createElement('div'));
    ok.addClass('control');
    ok.addClass('ok');
    rightControls.prepend(ok);
    initInput(input.get(0));
  }
}

function removeOkControl(inp) {
  var input = $(inp).closest('.input');
  var rightControls = $(input).find('.right-controls');
  rightControls.find('.control.ok').remove();
}

function initInput(input) {
  var allPaddings = 0;
  var inputField = $(input).find('input');

  //Init input paddings
  var leftPadding = $(input).find('.left-controls').width();
  if($(input).find('.left-controls .control').length > 0){
    leftPadding += 5;
    allPaddings += leftPadding;
    inputField.css({paddingLeft: leftPadding + 'px'});
  } else {
    allPaddings += parseInt(inputField.css('padding-left'));
  }

  var rightPadding = $(input).find('.right-controls').width();
  if($(input).find('.right-controls .control').length > 0){
    rightPadding += 5;
    allPaddings += rightPadding;
    inputField.css({paddingRight: rightPadding + 'px'});
  } else {
    allPaddings += parseInt(inputField.css('padding-right'));
  }

  if(allPaddings != 0) {
    var borderWidth = inputField.css('border-top-width');
    inputField.css({width: "calc(100% - " + allPaddings + "px - " + borderWidth + " * 2)"});
  }

  //Init control tooltips
  $(input).find('.controls .control').each(function(i, control) {
    var tooltip;
    var controls = $(control).closest('.controls');
    control = $(control);

    if(!control.has('.tooltip').length && control.attr('data-tooltip')) {
      tooltip = $(document.createElement('div'));
      control.append(tooltip);
      tooltip.addClass('tooltip');
      tooltip.text(control.attr('data-tooltip'));

      if(tooltip && tooltip.length > 0) {
        var controlIcon = control.find('img');
        var tooltipArrow = tooltip.find(".arrow");
        if(tooltipArrow.length == 0) {
          tooltipArrow = $(document.createElement('div'));
          tooltipArrow.addClass('arrow');
          tooltip.append(tooltipArrow);
        }
      }
    }
  })

  //init if selectable input
  if(inputField.hasClass('dropdown-input')){
    inputField.attr('readonly', 'readonly');
    inputField.css({cursor: 'pointer'});
  }
}
