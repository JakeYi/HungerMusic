

var EventCenter = {
    on: function(type, handler){
      $(document).on(type, handler)
    },
    fire: function(type, data){
      $(document).trigger(type, data)
    }
  }
  
  // EventCenter.on('hello', function(e, data){
  //   console.log(data)
  // })
  
  // EventCenter.fire('hello', '浣犲ソ')
  
  
  
 var Footer = {
    init: function(){
      this.$footer = $('footer')
      this.$ul = this.$footer.find('ul')
      this.$box = this.$footer.find('.box')
      this.$leftBtn = this.$footer.find('.icon-left')
      this.$rightBtn = this.$footer.find('.icon-right')
      this.isToStart = true
      this.isToEnd = false
      this.isAnimate = false
      this.bind()
      this.render()
    },
    bind: function () {
      var _this = this
      $(window).resize(function () {
        _this.setStyle()
      })
      this.$rightBtn.on('click', function () {
        if(_this.isAnimate) return
        var rowCount = Math.floor(parseFloat(_this.$box.width()) / parseFloat(_this.$footer.find('li').outerWidth(true)))
        var width = _this.$footer.find('li').outerWidth(true)
        if (!_this.isToEnd) {
          _this.isAnimate = true
          _this.$ul.animate({
            left: '-=' + rowCount * width
          }, 500, function () {
            _this.isAnimate = false
            _this.isToStart = false
            if (parseFloat(_this.$box.width()) - parseFloat(_this.$ul.css('left')) >= parseFloat(_this.$ul.css('width'))) {
              _this.isToEnd = true
            }
          })
        }
      })
      this.$leftBtn.on('click',function(){
        if(_this.isAnimate) return
        var rowCount = Math.floor(parseFloat(_this.$box.width()) / parseFloat(_this.$footer.find('li').outerWidth(true)))
        var width = _this.$footer.find('li').outerWidth(true)
        if(!_this.isToStart){
          _this.isAnimate = true
          _this.$ul.animate({
            left: '+=' + rowCount * width
          }, 500, function () {
              _this.isAnimate = false
              _this.isToEnd = false
            if (parseFloat(_this.$ul.css('left')) >= 0) {
              _this.isToStart = true
            }
          })
        }
      })
      this.$footer.on('click','li',function(){
        $(this).addClass('active')
            .siblings('li').removeClass('active')
        EventCenter.fire('select-album', {
          channelId: $(this).attr('data-channel-id'),
          channelName: $(this).attr('data-channel-name')
        })
      })
    },
    render: function(){
      var _this = this
      $.getJSON('https://jirenguapi.applinzi.com/fm/getChannels.php')
      .done(function(ret){
        console.log(ret)
        _this.renderFooter(ret.channels)
      })
      .fail(function(){
        console.log('render data is error...')
      })
    },
    renderFooter: function(data){
      var _this = this
      var html = ''
      data.forEach(function(channel){
        html += '<li data-channel-id='+ channel.channel_id +' data-channel-name='+ channel.name +'>'
        // html += '<li data-channel-id='+channel.channel_id+' data-channel-name='+channel.name+'>'
             +   '<div class="cover" style="background-image:url('+channel.cover_small +')"></div>'
             +   '<h3>"'+ channel.name +'"</h3>'
             + '</li>'
        _this.$ul.html(html)
      })
      _this.setStyle()
    },
    setStyle: function(){
      var _this = this 
      var count = _this.$footer.find('li').length
      var width = _this.$footer.find('li').outerWidth(true)
      _this.$ul.css({
        width: count * width + 'px'
      })
    }
 }

 var Fm = {
   init: function(){
      this.$container = $('#page-music')
      this.audio = new Audio()
      this.audio.autoplay = true
      this.bind()
   },
   bind: function(){
     var _this = this
    EventCenter.on('select-album',function(e , channelObj){
      _this.channelId = channelObj.channelId
      _this.channelName = channelObj.channelName
      _this.loadMusic()
    })
    this.$container.find('.btn-play').on('click',function(){
      $btn = $(this)
      if($btn.hasClass('icon-play')){
        $btn.removeClass('icon-play')
            .addClass('icon-pause')
        _this.audio.play()
      }else{
        $btn.removeClass('icon-pause')
            .addClass('icon-play')
        _this.audio.pause()
      }
    })
    this.$container.find('.btn-next').on('click',function(){
      _this.loadMusic()
    })
    this.audio.addEventListener('play',function(){
      clearInterval(_this.clock)
      _this.clock = setInterval(function(){
        _this.updateStatus()
      },1000)
    })
    this.audio.addEventListener('pause',function(){
      clearInterval(_this.clock)
    })
   },
   loadMusic: function(callback){
     var _this = this
    $.getJSON('https://jirenguapi.applinzi.com/fm/getSong.php',{channel:_this.channelId})
     .done(function(ret){
      _this.song = ret['song'][0]
      _this.setMusic()
      _this.loadLyric()
    })
   },
   loadLyric: function(){
    var _this = this
    $.getJSON('https://jirenguapi.applinzi.com/fm/getLyric.php',{sid: this.song.sid})
     .done(function(ret){
      var lyric = ret.lyric
      var lyricObj = {}
      lyric.split('\n').forEach(function(line){
        var times = line.match(/\d{2}:\d{2}/g)
        var str = line.replace(/\[\d{2}:\d{2}\.\d{2}\]/g,'')
        if(Array.isArray(times)){
          times.forEach(function(time){
            lyricObj[time] = str
          })
        }
      })
      _this.lyricObj = lyricObj
    })
   },
   setMusic: function(){
     var _this = this
     console.log(this.song)
     this.audio.src = this.song.url
     $('.bg').css('background-image','url('+ this.song.picture +')')
     _this.$container.find('.aside figure').css('background-image','url('+ this.song.picture +')')
     _this.$container.find('.detail h1').text(this.song.title)
     _this.$container.find('.detail .author').text(this.song.artist)
     _this.$container.find('.tag').text(this.channelName)
     _this.$container.find('.btn-play').removeClass('icon-play').addClass('icon-pause')
   },
   updateStatus: function(){
    var _this = this
    var min = Math.floor(_this.audio.currentTime/60)
    var second = (Math.floor(this.audio.currentTime)%60/100).toFixed(2).substr(2)
    // second = second === 2?second:'0'+second
    this.$container.find('.current-time').text(min+':'+second)
    this.$container.find('.bar-progress').css({
      width: _this.audio.currentTime/_this.audio.duration * 100 + '%'
    })
    var line = this.lyricObj['0'+min+':'+second]
    console.log(line)
    if(line){
      this.$container.find('.lyric p').text(line).boomText()
    }
   }
 }

$.fn.boomText = function(type){
  type = type || 'rollIn'
  console.log(type)
  this.html(function(){
    var arr = $(this).text()
                     .split('')
                     .map(function(word){
                        return '<span class="boomText">'+ word +'</span>'
                     })
    return arr.join('') 
  })
  var index = 0
  var $boomTexts = $(this).find('span')
  var clock = setInterval(function(){
    $boomTexts.eq(index).addClass('animated ' + type)
    index++
    if(index >= $boomTexts.length){
      clearInterval(clock)
    }
  },300)
}

  


Footer.init()
Fm.init()   
  
  
  