var captionArr = [],
	cueStart = null,
	cueEnd = null,
	cueText = null,
	captionBeingDisplayed = -1;

$('#transcriptSrc').children('span').each(function(){
	cueStart = $(this).attr('begin');
	cueEnd = $(this).attr('end');
	cueText = $(this).attr('end');
	if(cueStart && cueEnd && cueText){
		captionArr.push({ start:cueStart, end:cueEnd, caption:Trim(cueText)});
		cueStart = cueEnd = cueText = null;
	}
});

function FindCaptionIndex(seconds) {
    var below = -1;
    var above = captionsArr.length;
    var i = Math.floor((below + above) / 2);

    while (below < i && i < above) {

        if (captionsArr[i].start <= seconds && seconds < captionsArr[i].end)
            return i;
        
        if (seconds < captionsArr[i].start) {
            above = i;
        } else {
            below = i;
        }
        
        i = Math.floor((below + above) / 2);
    }

    return -1;
}

function getCaption(seconds){
	console.log(FindCaptionIndex(seconds));
	var ci = FindCaptionIndex(seconds);
  if(ci !== captionBeingDisplayed){
  	captionBeingDisplayed = ci;
    if(ci != -1){
    	var theCaption = ci;
      $('#out').html(theCaption.caption);
      $('#transcriptSrc').children('span').removeClass('highlight');
      $('#transcriptSrc').children('span').eq(ci).addClass('highlight');
      
      var transcriptContainer = $('#transcriptSrc');
      var scrollTo = $('#transcriptSrc').children('span').eq(ci);
      
      transcriptContainer.animate({
      	scrollTop:scrollTo.offset().top - transcriptContainer.offset().top + transcriptContainer.scrollTop()
      
      }, 300);
    
    } else {
    	$('#out').html('');
      $('#transcriptSrc').children('span').removeClass('highlight');
    }
  }
}

function audioTimeUpdateEventHandler(){
	var playTime = FormatTime($('#audioElm').prop('currentTime'));
	$('#audioElm').val(playTime);
	getCaption(playTime);
}

$('#audioElm').bind({
	//'play':audioPlayEventHandler,
	timeupdate: audioTimeUpdateEventHandler
});