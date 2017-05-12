(function($){
	$.fn.c_val=$.fn.val;
	$.fn.val=function(){
		var ret=$.fn.c_val.apply(this,arguments);
		if(arguments.length==0&&typeof ret=='string'){
			if($(this).attr('placeholder')==ret){
				return '';
			}
		}else{
			$(this).removeClass('placeholder');
		}
		return ret;
	}
	var selector='input[type="text"],textarea';
	$.extend({
		placeholder:function($dom){
			$dom=$dom||$(selector);
			$dom.each(function(){
				var $this=$(this);
				var placeholder=$this.attr('placeholder');
				if($.trim($this[0].value)==''&&placeholder){
					if($this.attr('type')!='password'){
						$this.val(placeholder);
					}else{
						$this.attr('title',placeholder);
					}
					$this.addClass('placeholder');
				}
			});
		}
	});
	$.placeholder();
	
	$(document).on('focus',selector,function(){
		var $this=$(this);
		if($.trim($this[0].value)==$this.attr('placeholder')){
			$this.val('').removeClass('placeholder');
		}
	}).on('blur',selector,function(){
		var $this=$(this);
		var placeholder=$this.attr('placeholder');
		if($.trim($this[0].value)==''&&placeholder){
			$this.val(placeholder);
			$this.addClass('placeholder');
		}
	})
})(jQuery);