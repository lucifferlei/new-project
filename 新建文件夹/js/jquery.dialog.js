(function ($){
	var defaults={
		type:'pop',//pop||confirm:确认框
		title:'温馨提示',
		width:'auto',
		height:'auto',
		content:'',
		iframesrc:'',//引入iframe的url
		loadurl:'',//加载的url
		overlay:true,//是否显示遮罩层
		complete:function (){},//弹出层后执行函数
		defined:function (){return true;}//确认框确认函数
	};
	function Dialog(options){
		this.options=$.extend({},defaults,options);
		$('.dialog').remove();
		this.el=$('<div class="dialog"><div class="dialog-title">'+this.options.title+'</div><a class="dialog-close"><i class="icon-close"></i></a><div class="dialog-content"></div></div>');
	}
	Dialog.prototype.init=function (){
		if(this.options.type=='confirm'){
			this.el.append('<div class="dialog-footer"><button class="btn-defined btn-primary">确定</button><button class="btn btn-cancel">取消</button></div>');
		}
		var content=this.el.children('.dialog-content');
		this.el.width(this.options.width);
		content.height(this.options.height);
		$(document.body).append(this.el);
		if(this.options.iframesrc){
			content.append('<iframe class="dialog-iframe" src="'+this.options.iframesrc+'" frameborder="0"></iframe>');
			this.options.complete.call(this);
		}else if(this.options.loadurl){
			var self=this;
			content.load(this.options.loadurl,function (){
				self.center();
				this.options.complete.call(this);
			});
		}else{
			content.html(this.options.content);
			this.options.complete.call(this);
		}
		if(this.options.overlay){
			this.overlay();
		}
		this.bindEvent();
		this.center();
		if($.placeholder){
			$.placeholder(this.el.find('input,textarea'));
		}
	}
	Dialog.prototype.bindEvent=function (){
		var self=this;
		this.el.on('click','.btn-cancel,.dialog-close,.dialog-close-trigger',function(e){
			e.stopPropagation();
			$.dialog.close();
		});
		this.el.on('click','.btn-defined',function (e){
			var ret=self.options.defined(e);
			if(ret!==false){
				$.dialog.close();		
			}
		});
	}
	Dialog.prototype.center=function (){
		this.el.show().css({
			marginLeft:'-'+this.el.width()/2+'px',
			marginTop:'-'+this.el.height()/2+'px'
		});
		if($.browser.msie&&parseInt($.browser.version)==6){
			this.el.show().css({
				top:$(document).scrollTop()+$(window).height()/2
			});
		}
	}
	Dialog.prototype.overlay=function (){
		$(document.body).append('<div class="dialog-overlay"></div>');
		if($.browser.msie&&parseInt($.browser.version)==6){
			$('.dialog-overlay').height($(document).height()).append('<iframe frameborder="0"></iframe>');
		}
	}
	$.dialog=function (options){
		var dialog=new Dialog(options);
		dialog.init();
	};
	$.dialog.close=function (){
		$('.dialog-overlay,.dialog').remove();
	}
	$.dialog.RConfirm=function (options){
		options.overlay=false;
		options.type='confirm';
		var dialog=new Dialog(options);
		dialog.el.addClass('dialog-r-c').find('.dialog-title').remove();
		dialog.center=function (){
			this.el.show().css({
				left:this.options.target.offset().left-this.el.width()/2+this.options.target.width()/2,
				top:this.options.target.offset().top+this.options.target.height(),
				position:'absolute'
			});
		}
		dialog.init();
		setTimeout(function (){
			dialog.el.addClass('g-auto-hide');
		},400)
	}
	
	$.dialog.tips=function(options){
		var el=$('<div class="pop-tips"><div class="pop-tips-bg"></div><div class="pop-tips-inner"><i></i><span class="pop-tips-title"></span></div></div>');
		el.find('i').addClass($.dialog.tips.icons[options.type||'success']);
		el.find('.pop-tips-title').html(options.title);
		$('body').append(el);
		el.show().css({
			left:($(window).width()-el.width())/2,
			top:($(window).height()-el.height())/2-20
		});
		setTimeout(function(){
			el.fadeOut(500,function(){
				el.remove();
			});
		},1500)
	}
	$.dialog.tips.icons={
		success:'icon-ajax-success',
		error:'icon-ajax-error'
	}
	
})(jQuery)