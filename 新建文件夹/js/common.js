$(function (){
	
	var s_md5 = document.createElement("script");
	s_md5.setAttribute("type", "text/javascript");
	s_md5.setAttribute("src", '/assets/javascript/cryptojs/md5.js');
	var s_hmac = document.createElement("script");
	s_hmac.setAttribute("type", "text/javascript");
	s_hmac.setAttribute("src", '/assets/javascript/cryptojs/hmac-sha1.js');
	document.getElementsByTagName("head")[0].appendChild(s_md5);
	document.getElementsByTagName("head")[0].appendChild(s_hmac);
	
	/*字节长度*/
	String.prototype.byteLength=function () {
		var byteLen = 0, len = this.length;
		if( !this ) return 0;
		for( var i=0; i<len; i++ )
			byteLen += this.charCodeAt(i) > 255 ? 2 : 1;
		return byteLen;
	};
	/*字节截取*/
	String.prototype.byteSubstring=function(len){  
		var result = '',
		strlen = this.length, // 字符串长度
		chrlen = this.replace(/[^\x00-\xff]/g,'**').length; // 字节长度

		if(chrlen<=len){return this;}
		for(var i=0,j=0;i<strlen;i++){
		    var chr = this.charAt(i);
		    if(/[\x00-\xff]/.test(chr)){
		        j++; // ascii码为0-255，一个字符就是一个字节的长度
		    }else{
		        j+=2; // ascii码为0-255以外，一个字符就是两个字节的长度
		    }
		    if(j<=len){ // 当加上当前字符以后，如果总字节长度小于等于L，则将当前字符真实的+在result后
		        result += chr;
		    }else{ // 反之则说明result已经是不拆分字符的情况下最接近L的值了，直接返回
		        return result;
		    }
		}
	};
	$.yyting={
		reg:{
			email:/^([a-zA-Z0-9]+[_|\-|\.]?)*[a-zA-Z0-9]+@([a-zA-Z0-9]+[_|\-|\.]?)*[a-zA-Z0-9]+\.[a-zA-Z]{2,3}$/,
			password:/^\w{6,20}$/,
			idcard:/^\d{15}$|^\d{17}(?:\d|x|X)$/
		},
		localStorage:function(key,val){
			if($.browser.msie&&parseInt($.browser.version)<8){
				if(arguments.length==2){
					if(key=='user'){
						$.cookie('cover',JSON.parse(val).cover);
					}
					$.cookie(key,val,{expires: 30,path:'/'});
				}else{
					if(key=='user'||key=='player-info'){
						var val=$.cookie(key);
						if(val){
							val=val.replace(/{/g,'').replace(/}/g,'');
							var obj={};
							var arr=val.split(',');
							for(var i=0;i<arr.length;i++){
								var temp=arr[i].replace(/:/,',');
								var splitArr=temp.split(',');
								if(splitArr){
									obj[splitArr[0]]=splitArr[1]||'';
								}
							}
							if(key=='user'){
								obj.cover=$.cookie('cover');
							}
							return JSON.stringify(obj);
						}else{
							return val;
						}
					}else{
						return $.cookie(key);
					}
				}
			}else{
				if(arguments.length==2){
					localStorage.setItem(key,val);
				}else{
					return localStorage.getItem(key);
				}
			}
		},
		handlerMsg:function(msg,v){
			$.dialog.tips({
			type:v?'success':'error',
			title:msg
			});
		},
		checkNull: function(v,msg){
			if(!v || v.length==0) {
				$.yyting.handlerMsg(msg,false);
				return false;
			}
			return true;
		},
		checkMinMax:function(v,min,max,msg){
			if(!v||v.byteLength()<min) {
				$.yyting.handlerMsg(msg+"不能少于"+min+"个字符",false);
				return false;
			} else if(v.byteLength()>max){
				$.yyting.handlerMsg(msg+"不能大于"+max+"个字符",false);
				return false;
			}
			return true;
		},
		redirect:function(url){
			if(url && !$.yyting.checkLogin()) {
				$.yyting.loginbox(function (){
					location.href=url;
				});
			}
		},
		ajax:function (options){
			if(options.type&&options.type.toUpperCase()=='POST'){
				if(options.login===true||options.login===undefined){//options.login是否检查登录
					if(!$.yyting.checkLogin()){
						$.yyting.loginbox(function (){
							$.yyting.ajax(options);
						});
						return;
					}
				}
			}
			if($.browser.msie&&options.cache===undefined){
				options.cache=false;
			}
			if(options.waiter){//options.waiter发送GET|POST请求需要承显的交互效果的地方
				var clas=!options.type||options.type.toUpperCase()=='GET'?'g-ajax-loader':'g-ajax-poster';
				if(options.waiter.hasClass('g-ajax-poster')){
					return;
				}
				options.waiter.addClass(clas);
				var success=options.success;
				options.success=function (){
					options.waiter.removeClass(clas);
					success.apply(this,arguments);
				}
				var error=options.error;
				options.error=function (){
					options.waiter.removeClass(clas);
					if(options.error&&typeof options.error=='function'){
						error.apply(this,arguments);
					}
				}
			}
			$.ajax(options);
		},
		parseURL:function (path){
			var result = {}, param = /([^?=&]+)=([^&]+)/ig, match;
			while (( match = param.exec(path)) != null) {
				result[match[1]] = match[2];
			}
			return result;
		},
		checkLogin:function (){
			return document.cookie.indexOf('sid=')>-1;
		},
		loginbox:function (callback){
			var that = this;
			$.dialog({
				title:'',
				content:$('#login-template').html(),
				complete:function (){
					var self=this;
					var localUser=$.yyting.localStorage('user');
					if(localUser){
					   localUser=JSON.parse(localUser);
					   self.el.find('input').eq(0).val(localUser.accountName);
					}
					this.el.find('.btn-primary').on('click',function (){
						var accountName=self.el.find('input').eq(0).val();
						var password=self.el.find('input').eq(1).val();
						var autoLogin=0;
						if( self.el.find('input').eq(2).attr("checked") =="checked" ){
						   autoLogin=self.el.find('input').eq(2).val();
						}
						
						if(!accountName || !password){
							self.el.find('.field-error').text('用户名密码不能为空').parent().show();
							return;
						}
						
						$.when(that.getToken(accountName)).done(function(token){
							if(!token){
								self.el.find('.field-error').text("操作异常").parent().show();
								return;
							}
						
							that.cryptoLogin(accountName,password,token,autoLogin,'',function (data) {
								if(data.status=='success'){
						    		$.yyting.localStorage('user', JSON.stringify(data.data));
						    		$.yyting.initUser();
							    	$.dialog.close();
							    	$.yyting.loginSuccess(data.data);
									if(callback&&typeof callback=='function'){
										callback();
									}
						    	}else{
						    		if(data.data=='login_code'){
										window.location.href='/login?showValidateCode=1';
									}else{
										self.el.find('.field-error').text(data.errMsg).parent().show();
									}
						    	}
							});
						});
						
					});
					this.el.on('keyup','input',function(e){
						if(e.keyCode==13){
							self.el.find('.btn-primary').click();
						}
					});
				}
			});
		},
		loginSuccess:function (data){},
		initUser:function(){
			var user=$.yyting.localStorage('user');
			var umenu=$('.g-top-umenu');
			if(user&&$.yyting.checkLogin()){
				user=JSON.parse(user);
				umenu.show().prev().hide();
				
				if(user.cover){
					umenu.find('.g-user-i img').attr('src',user.cover);					
				}

				//这里要修改登录状态的连接的地址				
				umenu.find('#myhome,#myhomecover').attr('href',"/user/"+ user.userId);
				umenu.find('#myfollowing').attr('href',"/my/following");
				umenu.find('#myalbum').attr('href',"/user/" + user.userId +"/album");		
			}else{
				umenu.hide().prev().show();
			}
		},getToken:function (accountName){
			var defer = $.Deferred();
			if(!accountName){
				defer.resolve('');
				return defer.promise();
			}
			$.ajax({
				login:false,
				url:"/user/login_token.do",
				type:"POST",
				dataType:"json",
				data:{
			    		"accountName":accountName
			    	 },
			    success: function(data){
			    	defer.resolve(data.data);
				}
			});
			return defer.promise();
		},cryptoLogin:function (accountName,password,token,autoLogin,validateCode,callback){
			if(!accountName || !password || !token) return;
			
			if(!autoLogin) autoLogin = 0;
			if(!validateCode) validateCode = '';
			
			var hashPass = CryptoJS.HmacSHA1(CryptoJS.MD5(password).toString(), token).toString();
			
			$.ajax({
				url:"/user/login.do",
				type:"POST",
				dataType:"json",
				data:{
			    		"accountName":accountName,
			    		"hashPass":hashPass,
			    		"autoLogin":autoLogin,
			    		"validateCode":validateCode
			    	 },
			   	//async:false,
			    success: function(data){
			    	if(callback) callback(data);
				}
			});
		}
	};
	$.yyting.initUser();
	$.yyting.params=$.yyting.parseURL(location.href);
	$('#dialog-login').click($.yyting.loginbox);
	$(document).on('focusin','textarea',function(){
		var $this=$(this);
		if(!$this.attr('data-check-login')&&!$.yyting.checkLogin()){
			$this.blur();
			$.yyting.loginbox(function(){
				$this.focus();
			});
		}
	})
	/*动态评论显示*/
	//$('.feed-item-comments').on('click',function (){
		//$(this).parent().next().toggleClass('hide');
	//});
	
	/*顶部搜索框*/
	$('.g-search-b input').on('keyup',function (e){
		var $this=$(this),v=$.trim($this.val());
		if(v){
			v=v.replace(/\.|\\|\//g,'');
			if(e.keyCode==38){
				var $prev=$('.g-search-l .active').prev();
				if($prev.length==1){
					$prev.addClass('active').siblings().removeClass('active');
				}
			} else if(e.keyCode==40){
				var $next=$('.g-search-l .active').next();
				if($next.length==1){
					$next.addClass('active').siblings().removeClass('active');
				}
			}
			if(e.keyCode==13){
				var t=$('.g-search-l .active i').attr('class').replace('icon-s-','');
				if(t=='user') t='anchor';
				location.href='/search/'+t+'/'+encodeURIComponent(v);
			}
			$('.g-search-l').show();
			$('.g-search-l span').text(v);
		}else{
			$('.g-search-l').hide();
		}
	}).on('focus',function(){
		var t=$(this);
		setTimeout(function(){t.select();},200);
	});
	$('.g-search-l li').on('click',function (){
		var v=$.trim($('.g-search-b input').val());
		if(v) {
			v=v.replace(/\.|\\|\//g,'');
			var t=$(this).find('i').attr('class').replace('icon-s-','');
			if(t=='user') t='anchor';
			location.href='/search/'+t+'/'+encodeURIComponent(v);
		}
	});
	$('.g-search-icon').on('click',function(){
		var v=$.trim($('.g-search-b input').val());
		if(v) {
			v=v.replace(/\.|\\|\//g,'');
			location.href='/search/book/'+encodeURIComponent(v);
		}
	});
	
	/*原著跳转*/
	$(document).on('click','.author',function(){
		var self = $(this);
		var v=$.trim(self.text());
		var stype = $.trim(self.attr('stype'));
		if(v) {
			if(stype=='album'){
				location.href='/search/album/'+encodeURIComponent(v);
			}else{
				location.href='/search/book/'+encodeURIComponent(v);
			}
		}
	});
	
	/*名片*/
	var namecardEnterTime=null,namecardLeaveTime=null,namecard=$('.g-name-card');
	$('body').append(namecard);
	$(document).on('mouseenter','.g-user',function (){
		if(namecardLeaveTime){
			clearTimeout(namecardLeaveTime);
		}
		var $this=$(this);
		var href=$this.attr('href');
		if($this.children('img').length==1){
			$this=$this.children('img')
		}
		if(namecard.trigger!=this){
			namecardEnterTime=setTimeout(function (){
				var userid=/\d+$/.exec(href)[0];
				if($.yyting.localStorage('user')&&userid==JSON.parse($.yyting.localStorage('user')).userId){
					namecard.addClass('self-name-card');
				}else{
					namecard.removeClass('self-name-card');
				}
				var obj={
					left:$this.offset().left-namecard.width()-16,
					top:$this.offset().top+$this.height()/2-45
				}
				namecard.find('.g-name-card-arrow').show().siblings('.g-name-card-arrow-b').hide();
				if($this.offset().left<$(window).width()/2){
					obj={
							left:$this.offset().left+$this.width()/2-42,
							top:$this.offset().top-15-namecard.height()
						}
					namecard.find('.g-name-card-arrow').hide().siblings('.g-name-card-arrow-b').show();
				}
				namecard.show().css(obj);
				namecard.trigger=$this[0];
				namecard.children('.g-name-card-inner').html('');
				$.yyting.ajax({
					url:'/user/'+userid+'/card',
					waiter:namecard.children('.g-name-card-inner'),
					success:function(data){
						namecard.children('.g-name-card-inner').html(data);
					}
				});
			},500);
		}
	}).on('mouseleave','.g-user',function (){
		if(namecardEnterTime){
			clearTimeout(namecardEnterTime);
		}
		namecardLeaveTime=setTimeout(function (){
			namecard.hide();
			namecard.trigger=null;
		},600);
	});
	namecard.on('mouseenter',function (){
		if(namecardLeaveTime){
			clearTimeout(namecardLeaveTime);
		}
	}).on('mouseleave',function (){
		namecardLeaveTime=setTimeout(function (){
			namecard.hide();
			namecard.trigger=null;
		},600);
	});
	
	//发私信
	$(document).on('click',".btn-msg",function (){		
		if(!$.yyting.checkLogin()){
			$.yyting.loginbox();
		}else{
			$.dialog({
				title:'',
				content:$('#sendDiv').html()
			});
			$('#name').text($(this).attr('name'));
		    $('#sendId').val($(this).attr('id'));
		}	
	});
		
	$(document).on("keyup","#sendText",function(){
			var c=parseInt(168),t=parseInt($.trim($(this).val()).length);
			if(t >1) {				
				$("#send").removeClass("btn-disable");
				$("#send").removeAttr("disabled");
			}else{
				$("#send").addClass("btn-disable");
				$("#send").attr("disabled", "disabled");
			}
			
			var count = parseInt(c-t);
			if(count<0){
				count=0;
			}			
			$("#shareCount").html(count);
			if(count < 1){
				$("#sendText").val($.trim($(this).val()).substring(0,167));
			}
	});
			
	$(document).on("click","#send",function (){
	   var id=$('#sendId').val();
	   var content=$('#sendText').val();
	   var textleng=$('#sendText').val().length;	
	   if(textleng){		   			   
			 $.yyting.ajax({
			    login:true,
				url :"/my/message/sendMessage.do",
				type:"POST",
				dataType:"json",
				data:{
			    		"receiverId":id,
			    		"content":content,
		    			"cToken":$('#cToken').val()
			    	 },
			    success: function(data){
		    		if(data.status=='success') {
		    			$('#sendEmail').hide();
		   				$('#upload-success').removeClass('hide').width(575);		   
		 					setTimeout(function(){
					  			$.dialog.close();
					  		},2000);
					}else{
						$.dialog.tips({
							type:'error',
							title:data.errMsg
						});
					}
				}
		     });
		 }else{
		    $.dialog.tips({
				type:'error',
				title:'请输入邮件内容'
			});
		 }			     
	})      		
	/*认证标示事件*/
	$(document).on("click",".icon-vip-m",function (){
		if(!$(this).attr('href')){
			location.href="/anchor";
		}
	})
	/*会员标示事件*/
	$(document).on("click",".icon-member-a,.icon-member-l,icon-member-b",function (){
		if(!$(this).attr('href')){
			location.href="/uservip/vip";
		}
	})
	/*关注和取消关注*/
	$(document).on('mouseenter','.btn-follow',function (){
		var $this=$(this);
		var text=$.trim($this.text());
		if(text=='已关注'){
			$this.text('取消关注');
		}
	}).on('mouseleave','.btn-follow',function (){
		var $this=$(this);
		var text=$.trim($this.text());
		if(text=='取消关注'){
			$this.text('已关注');
		}
	}).on('click','.btn-follow,.gc-follow',function (){
		var $this=$(this);
		var text=$.trim($this.text());
		if(text=='关注'){
			$.yyting.ajax({
				url:'/user/addFollow.do',
				type:'POST',
				dataType:"json",
				login:true,
				data:{
					userId:$this.data('userid'),
	    			cToken:$('#cToken').val()
				},
				success:function (data){
					if(data.status=='success'){
						$this.text('取消关注');
						if(!$this.hasClass('gc-follow')){
							$this.addClass('btn-follow-has');
						}
					}
				}
			})
			
		}else{
			$.yyting.ajax({
				url:'/user/cancellFollow.do',
				type:'POST',
				dataType:"json",
				login:true,
				data:{
					userId:$this.data('userid'),
	    			cToken:$('#cToken').val()
				},
				success:function (data){
					if(data.status=='success'){
						$this.html('<i class="icon-plus"></i>关注').removeClass('btn-follow-has');
					}
				}
			});
		}
	});
	/*加载更多*/
	$(document).on('click','.btn-load-more,.anchor-item-more',function(e){
		var $this=$(this).addClass('g-ajax-loader');
		var tempHTML=$this.html();
		$this.html('<i class="icon-ajax-loader"></i>&nbsp;&nbsp;加载中...');
		if($this.hasClass('anchor-item-more')){
			$this.find('i').addClass('icon-ajax-loader2');
		}
		var size=$this.attr('data-size')||20;
		$.yyting.ajax({
			url:$this.prev('ul').children('li:last').attr('data-more-url'),
			success:function (data){
				$this.html(tempHTML);
				if(data.data){
					data=data.data;
				}
				var li=$(data).children('li');
				$this.removeClass('g-ajax-loader').prev('ul').append(li);
				if(size&&li.length<parseInt(size)){
					$this.hide();
				}
			}
		});
		e.stopPropagation();
		e.preventDefault();
	});

	/*返回顶部*/
	$(window).on('scroll',function(){
		if($(window).scrollTop()>$(window).height()){
			$('.go-top').show();
		}else{
			$('.go-top').hide();
		}
	})
	$('.go-top').on('click',function (){
		$("html,body").animate({
			scrollTop: "0px"
		},400);
	});
	/*文本域登录提示*/
	$(document).on('focus','textarea[data-login="true"]',function(){
		if(!$.yyting.checkLogin()){
			$.yyting.loginbox()
		}
	});
	/*默认行为*/
	$(document).on('click',function (e){
		if($(e.target).closest('.g-auto-hide').length==0){
			$('.g-auto-hide').hide();
		}
		if($(e.target).closest('.g-auto-remove').length==0){
			$('.g-auto-remove').hide();
		}
	});
	/*ie7头部下拉菜单修正*/
	if($.browser.msie&&$.browser.version=='7.0'){
		var wrapper=$('body').children('.wrapper');
		$(document).on('mouseenter','.g-main-listen,.g-top-umenu',function (){
			wrapper.css({position:'relative',zIndex:-1});
		}).on('mouseleave','.g-main-listen,.g-top-umenu',function (){
			wrapper.removeAttr('style');
		});
	}
	
	/*收藏*/
	$(document).on('click','#addCollection,.addCollection',function(){
		var self = $(this);
		
		var entityId = self.attr("entityId");
		var entityType = self.attr("entityType");
		var collectionCount = parseInt(self.find("#collectionCount").text());
		var showType = self.attr("showType");
		
		if(showType == 4){
			entityType = window.ydata['share-entityType'];
			entityId = window.ydata['share-fatherEntityId'];
			
			if(entityType == 4){
				entityType = 3;
			}
		}
		
		//取消收藏
		if(self.hasClass("d-collection-a") || self.find(".icon-collection").hasClass("icon-collection-a")){
			$.yyting.ajax({
				url:'/user/delCollection.do',
				type:'POST',
				dataType:"json",
				data:{
					"entityId":entityId,
					"entityType":entityType,
	    			"cToken":$('#cToken').val()
				},
				success:function (data){
					if(data.status=='success'){
						if(showType == 1){
							self.removeClass("d-collection-a");
							self.html("添加收藏");
						}else if(showType == 2){
							self.find(".icon-collection").removeClass("icon-collection-a");
							self.find("#collectionShow").text("收藏");
						}else if(showType == 3){
							self.removeClass("d-collection-a");
							self.removeClass("disable");
							self.html("收藏");
						}else if(showType == 4){
							self.html("收藏");
							self.removeClass("d-collection-a");
						}else{
							self.removeClass("d-collection-a");
							self.find("#collectionShow").text("收藏");
						}
						collectionCount = collectionCount+parseInt(-1);
						self.find("#collectionCount").text(collectionCount);
					}else{
						$.dialog.tips({
							type:'error',
							title:data.errMsg
						});
					}
				}
			})
		}else{
			$.yyting.ajax({
				url:'/user/addCollection.do',
				type:'POST',
				dataType:"json",
				data:{
					"entityId":entityId,
					"entityType":entityType,
	    			"cToken":$('#cToken').val()
				},
				success:function (data){
					if(data.status=='success'){
						if(showType == 1){
							self.addClass("d-collection-a");
							self.html("取消收藏");
						}else if(showType == 2){
							self.find(".icon-collection").addClass("icon-collection-a");
							self.find("#collectionShow").text("已收藏");
						}else if(showType == 3){
							self.addClass("d-collection-a");
							self.addClass("disable");
							self.html("已收藏");
						}else if(showType == 4){
							self.html("已收藏");
							self.addClass("d-collection-a");
						}else{
							self.addClass("d-collection-a");
							self.find("#collectionShow").text("已收藏");
						}
						collectionCount = collectionCount+parseInt(1);
						self.find("#collectionCount").text(collectionCount);
					}else{
						$.dialog.tips({
							type:'error',
							title:data.errMsg
						});
					}
				}
			})
		}
	});
	$(document).on('mouseenter','.book-item .btn-collection',function (){
		var $this=$(this);
		var text=$.trim($this.text());
		if(text=='已收藏'){
			$this.text('取消收藏');
		}
	}).on('mouseleave','.book-item .btn-collection',function (){
		var $this=$(this);
		var text=$.trim($this.text());
		if(text=='取消收藏'){
			$this.text('已收藏');
		}
	})
	/*喜欢赞*/
	$(document).on('click','#addLike',function(){
		var self = $(this);
		//取消赞
		if(self.hasClass("d-praise-a")){
		}else{
			
			var entityId = self.attr("entityId");
			var entityType = self.attr("entityType");
			var likeCount = parseInt(self.find("#likeCount").text());
			//点赞
			$.yyting.ajax({
				url:'/user/addLike.do',
				type:'POST',
				dataType:"json",
				data:{
					"entityId":entityId,
					"entityType":entityType,
	    			"cToken":$('#cToken').val()
				},
				success:function (data){
					if(data.status=='success'){
						self.addClass("d-praise-a");
						likeCount = likeCount+parseInt(1);
						self.find("#likeCount").text(likeCount);
					}else{
						$.dialog.tips({
							type:'error',
							title:data.errMsg
						});
					}
				}
			})
		}
		
	})
	
	
	/*头部收听记录*/
	$(document).on('mouseenter','.g-listen',function(){
		var self = $(this);
		if($.yyting.checkLogin()){
			$.yyting.ajax({
				login:false,//根据需要填写
				url:'/my/history.do',
				type:'get',
				dataType:"json",
				data:{
				},
				success:function (data){
					if(data.status=='success'){
						self.siblings(".g-main-listen-l").html(data.data);
					}else{
						$.dialog.tips({
							type:'error',
							title:data.errMsg
						});
					}
				}
			})
		}else{
			$('.g-main-listen-more').hide();
		}
	});
	
	/*删除头部收听记录*/
	$(document).on('click','.icon-close',function(){
		var self = $(this);
		var id = self.attr("recent_id");
		if($.yyting.checkLogin()){
			$.yyting.ajax({
				login:false,//根据需要填写
				url:'/delReListen',
				type:'get',
				dataType:"json",
				data:{
					"id":id,
	    			"cToken":$('#cToken').val()
				},
				success:function (data){
					if(data.status=='success'){
						self.closest('li').remove();
					}else{
						$.dialog.tips({
							type:'error',
							title:data.errMsg
						});
					}
				}
			})
		}else{
			$('.g-main-listen-more').hide();
		}
	});
	
	$(document).on('click','#thirdLogin',function(){
		var url = $(this).attr("login")+"?bakUrl="+location.href;
		location.href=url;
	});
	
	//特殊请求 重新获取头部信息
	var isThird = $.yyting.params.isThird;
	
	if("000000" == isThird){
		$.yyting.ajax({
			login:false,//根据需要填写
			url:'/userinfo/info.do',
			type:'get',
			dataType:"json",
			data:{
			},
			success:function (data){
				if(data.status=='success'){
					$.yyting.localStorage('user', JSON.stringify(data.data));
					$.yyting.initUser();
					$.yyting.loginSuccess(data.data);
				}else{
					$.dialog.tips({
						type:'error',
						title:data.errMsg
					});
				}
			}
		});
	}
	
	var playerEvent={
		timer:null,
		data:{},
		init:function(){
			var self=this;
			if($.browser.msie){
				if(location.href.indexOf('/playlist')>-1){
					setInterval(function(){
						var request=$.yyting.localStorage('request');
						if(request&&self.data.request!=request){
							self.data.request=request;
							self.request();
						}
						var response=$.yyting.localStorage('response');
						if(response&&self.data.response!=response){
							self.data.response=response;
							self.response();
						}
						
					},300);
				}else{
					setInterval(function(){
						var exist=$.yyting.localStorage('exist');
						if(exist&&self.data.exist!=exist){
							self.data.exist=exist;
							self.exist();
						}
					},300)
				}
			}else{
				window.addEventListener('storage',function(l){
					if(self[l.key]){
						self[l.key].apply(self,arguments);
					}
				},false);
			}
			this.bind();
		},
		exist:function(){
			this.isopen=true;
			var self=this;
			if(this.timer){
				clearTimeout(this.timer);
			}
			this.timer=setTimeout(function(){
				self.isopen=false;
			},1000);
		},
		response:function(l){
			if(!window.audio){
				
				this.playTips();
				//console.log('已经开始播放了。。。');
			}
		},
		request:function(){
			if(window.audio){
				//console.log('响应播放了。。。');
				$.yyting.localStorage('response',this.getRandom());
				this.play();
			}
		},
		play:function(){
			if(window.audio){
				window.player.toPlay();
			}
		},
		getRandom:function(){
			return Math.ceil(Math.random()*100000);
		},
		bind:function(){
			var self=this;
			$(document).on('click','.player-trigger',function(e){
				self.target=this;
				var $this=$(this);
				var $input=$this.find('input[type="hidden"]');
				
				// 收费书籍屏蔽 2016-06-06 TODO
				if($this.hasClass('pay-section')){
					$.dialog({
						title:'',
						content:$('#download-pre').html(),
						complete:function(){
							var  $h4 = this.el.find('h4');
							$h4.text($h4.text().replace(/下载/,'收听'));
						}
					})
					e.preventDefault();
					return
				}
				
				if($input.length==1&&parseInt($input.val())==0){
					self.playTips('没有可以播放的声音');
					e.stopPropagation();
					return;
				}
				if(!self.isopen){
					window.open('/playlist','player');
				}
				if($.browser.msie){
					self.poll();
				}
				var data=$.yyting.parseURL($this.attr('player-info'));
				$.yyting.localStorage('request',self.getRandom());
				$.yyting.localStorage('player-info',JSON.stringify(data));
			
				e.preventDefault();
			});
		},
		poll:function(){
			var self=this;
			this.interval=setInterval(function(){
				var response=$.yyting.localStorage('response');
				if(self.data.response!=response){
					self.data.response=response;
					self.response();
				}
			},100);
			setTimeout(function(){
				if(self.interval){
					clearInterval(self.interval);
				}
			},450)
		},
		playTips:function(text){
			if(!this.target){
				return;
			}
			var text=text||'已经开始播放...';
			var $this=$(this.target);
			var tips=$('<div class="play-tips g-auto-hide"><p>'+text+'</p></div>').show();
			$('body').append(tips);
			var top=$this.offset().top-tips.height()-5;
			tips.css({
				left:$this.offset().left,
				top:top
			});
			setTimeout(function(){
				tips.animate({top:top-40,opacity:0},400,function(){
					tips.remove();
				});
			},200);
			this.target=null;
		}
	}
	playerEvent.init();
	//轮询获取通知
	if(location.href.indexOf('/playlist')==-1){
		setInterval(function(){
			if($.yyting.checkLogin()){
				$.ajax({
					url:'/my/message/unread',
					success:function(data){
						if(data.status=='success'){
							window.setNotifyNumber(data);
						}
					}
				});
			}
		},10000);
	}
	window.setNotifyNumber=function(data){
		var notifyNum=0;
		for(var i in data.data){
			var $dom=$('.g-top-menu-l .notify-remind-'+i);
			var $lDom=$('.sns-control .notify-remind-'+i);
			if($dom.length>0){
				var number=data.data[i]>1000?'1000+':data.data[i];
				if(data.data[i]>0){
					$dom.text('('+data.data[i]+')').show();
					$lDom.text(number).show();
				}else{
					$dom.text('('+data.data[i]+')').hide();
					$lDom.text(number).hide();
				}
				notifyNum+=data.data[i];
			}
		}
		if(notifyNum>0){
			$('.icon-notify-number').show().text(notifyNum>1000?'1000+':notifyNum);
			$('.notify-count').text(notifyNum).parent().show();
		}else{
			$('.icon-notify-number').hide();
			$('.notify-count').parent().hide();
		}
		
	}
	setTimeout(function(){
		var columnL=$('article .column-l');
		var columnR=$('article .column-r');
		if(columnL.length==1&&columnR.length==1){
			columnR.css('minHeight',columnR.parent().height());
			columnL.css('minHeight',columnR.parent().height());
		}
	},1000);
});