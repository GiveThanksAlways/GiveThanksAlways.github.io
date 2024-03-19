/**
 * Particleground demo
 * @author Jonathan Nicol - @mrjnicol
 * edited by me - Spencer Willett @giveThanksAlways180
 */

// This can be used to set the Particles Effects. Check README for more details!
document.addEventListener('DOMContentLoaded', function () {
    particleground(document.getElementById('particles'), {
      dotColor: '#bdb55c',
      lineColor: '#bdb55c',
      particleRadius: 0,
      lineWidth: 5,

    });
    // This next part will put the content back into place
    var intro = document.getElementById('intro');
    intro.style.marginTop = - intro.offsetHeight + 'px';
  }, false);
  
  
  /*
  // jQuery plugin example:
  $(document).ready(function() {
    $('#particles').particleground({
      dotColor: '#5cbdaa',
      lineColor: '#5cbdaa'
    });
    $('.intro').css({
      'margin-top': -($('.intro').height() / 2)
    });
  });
  */