/**
 * @author xuwei
 * @desc 生成表格
 */

;(function($, window, undefined) {
	function plugin(option) {
		
		//初始化插件实例
		var instance = new Plugin();
		
		option = $.extend({}, plugin.defaults, option);
		
		var $e = this;		
		
		//定义全局变量
		var pager = {
			page : option.page,
			rows : option.rows
		};
		var cur_records = null;
		var cur_params = null;
		var cur_sort = {
			sortField : '',
			sortType : 'asc'
		};
		
/* ************************************************************************************ */
		
		$e.addClass('tile');
		
		//表格头部
   		var $header;
   		_init_header();
   		
   		if(option.hideHeader)
   			$header.addClass('hidden');
   		
		//初始化工具栏
   		var controls = _init_controls();
   		   		
   		$e.prepend($header);
   		
   		//是否有合并列
		var merged = false;
		
   		var $body, $body_table, $table, $thead, $tbody, $head_box, $box;
   		_init_body();
		
   		//自定义内容
		var $widget;
		_init_widget();
		
		$e.append($body);
		
		var $footer, $prev, $next, $pager;
		_init_footer();
		
		if(option.hideFooter)
			$footer.addClass('hidden');
		
		$e.append($footer);
		
		if(!option.lazyload)
			_refresh();
		
		_adapt_height();

		if(option.resizeable) {
			$body_table.niceScroll({
	            cursorcolor: "#000000",
	            zindex: 999999,
	            bouncescroll: true,
	            cursoropacitymax: 0.4,
	            cursorborder: "",
	            cursorborderradius: 7,
	            cursorwidth: "7px",
	            background: "rgba(0,0,0,.1)",
	            autohidemode: false,
	            overflowy: true,
	            railpadding: {
	                top: 0,
	                right: 2,
	                left: 2,
	                bottom: 0
	            }
	        });
			
			$(window).resize(function() {
				_adapt_height();
			});
		}
		
		
		function _init_header() {
			//表格头部
	   		$header = $('<div>').addClass('tile-header text-center');
	   		//标题
	   		$('<h1>').text(option.title).appendTo($header);
		}
		
		function _init_widget() {
			var $search = controls.left.$search;
			$widget = $e.find('.tile-widget');
			if($widget.length > 0) {
				$body.prepend($widget);
	        	if($search.is(":visible")) {  
	        		$widget.addClass('hidden');
	        		$widget.find('input.input-date').prop('type', 'date');
	        	}
	        	
	        	$search.click(function() {
	        		if($widget.hasClass('hidden'))
		    			$widget.removeClass('hidden');
		    		else
		    			$widget.addClass('hidden');
	        	});
	        	
				//初始化插件按钮样式
				$widget.find('.btn').addClass('tile-btn');
				$widget.find('.btn-group').find('.btn').click(function() {
					$(this).addClass('active').siblings('.btn').removeClass('active');
				});
			} else {
				$search.addClass('hidden');
			}
		}
		
		function _init_controls() {
			//左侧小工具栏
			var $left_controls = $('<div>').addClass('tile-controls pull-left').appendTo($header);
	   		//右侧小工具栏
			var $right_controls = $('<div>').addClass('tile-controls pull-right').appendTo($header);
			
			var init_control = function(ctl, controls) {
	   			var $a = $('<a>').prop('href', '#').prop('title', ctl.title).addClass('hidden').appendTo(controls);
	   			
	   	   		var $i = $('<i>').addClass(ctl.icon).appendTo($a);
	   	   		
	   	   		if(ctl.initialized)
	   	   			ctl.initialized.call($a);
	   	   		
				$a.click(function() {
	   	   			var callback = option[ctl.id + 'Callback'];
	   	   			if(callback) {
	   	   				callback();
	   	   				return;
	   	   			}
		   	   		if(ctl.callback)
	   	   				ctl.callback.call(instance);
	   	   		});
	   	   		var id = ctl.id.replace(/^./, function ($0){
		   	        return $0.toUpperCase();
		   	    });
	   	   		
	   	   		var visible = option['show' + id];
	   	   		if(visible == undefined) 
	   	   			visible = ctl.visible;
	   	   		if(visible)
	   	   			$a.removeClass('hidden');
	   	   		
	   	   		return $a;
			}
	   		
			var left = {};
			var right = {};
			
	   		$.each(plugin.controls.left, function(i, ctl) {
	   			left['$' + ctl.id] = init_control(ctl, $left_controls);
	   		});
		   
	   		$.each(plugin.controls.right, function(i, ctl) {
	   			right['$' + ctl.id] = init_control(ctl, $right_controls);
	   		});
	   		
	   		return {
	   			left : left,
	   			right : right
	   		};
		}
		
		function _wrap_params() {
			var p = false;
			if(typeof option.params == 'function') 
				p = option.params();
			else if(typeof option.params == 'object')
				p = option.params;
			else if(typeof option.params == 'string')
				p = $(option.params).serializeArray()
				
			if(!p)
				p = {}
			
			if(Object.prototype.toString.call(p) == '[object Array]') {
				p.push({name : 'page', value : pager.page});
				p.push({name : 'rows', value : pager.rows});
				p.push({name : 'sortType', value : cur_sort.sortType});
				p.push({name : 'sortField', value : cur_sort.sortField});
			} else {
				p.page = pager.page;
				p.rows = pager.rows;
				p.sortType = cur_sort.sortType;
				p.sortField = cur_sort.sortField;
			}
			
			cur_params = p;
		}
		
		function _refresh(params) {
			pager.page = 1;
			
			if(params) 
				option.params = params;
			
			_get_records();
			
			_init_table();
			
			_init_pager();
		}
		    		
		function _get_records() {
			_wrap_params();
			
			if(option.beforeQuery && !option.beforeQuery(cur_params)) {
				return;
			}
			
			$.ajax({
	             type : 'GET',
	             async : false,
	             url: option.url,
	             data : cur_params,
	             dataType : 'json',
	             success : function(data) {
	            	cur_records = data[option.recordsName];
	            	if(data[option.pagerName])
	            		pager.total = data[option.pagerName].total;
	            	else
	            		pager.total = data.total;
                 }
	         });
		}
		
		function _init_body() {
			//表格主体
			$body = $('<div>').addClass('tile-body no-vpadding');
			
			$body_table = $('<div>').addClass('body-table table-responsive').appendTo($body);
			
			$table = $('<table>').addClass('table').addClass(option.tableStyle).appendTo($body_table);
			
			$thead = $('<thead>').appendTo($table);
			
			//标题栏
			var $tr_head = $('<tr>').appendTo($thead);		
			//多选按钮总开关
			var $th_box_head = $('<th>').width(40).addClass('hidden text-' + option.align).appendTo($tr_head);
			var $box_div_head = $('<div>').addClass('').appendTo($th_box_head);
			$box_head = $('<input>').prop('type', 'checkbox').prop('id', 'allchck2').val(1).appendTo($box_div_head);
			var $label_head = $('<label>').prop('for', 'allchck2').appendTo($box_div_head);
			
			$box_head.change(function() {
				$box.prop('checked', $(this).prop('checked'));
		    });
			
			if(option.checkbox) {
				$th_box_head.removeClass('hidden');
			}

			//表格序号栏
//			var $th_num = $('<th>').width(40).text('#').addClass('text-' + option.align).appendTo($tr_head);
			var defaultWidth = 100 / option.fields.length + '%';
			
			//数据标题
			$.each(option.fields, function(i, field) {
				merged = merged || field.merged;
				
				var $th = $('<th>').css('width', defaultWidth).data('field', field).text(field.name).addClass('title text-' + (field.align || option.align)).appendTo($tr_head);
				//显示排序
				if((field.sortable == undefined && option.sortable) || field.sortable) {
					$th.addClass('sortable');
					if(field.sortType) 
						$th.addClass('sort-' + field.sortType);
				}
			});
			
			//排序点击事件
			var $sort_ths = $thead.find('tr > th.sortable');
			$sort_ths.click(function() {
		        var c = $(this).hasClass('sort-asc') ? 'desc' : 'asc';
		        $sort_ths.removeClass('sort-asc').removeClass('sort-desc');
		        $(this).addClass('sort-' + c);
		        cur_sort.sortType = c;
		        var field = $(this).data('field');
		        cur_sort.sortField = field.mapping || field.key;
		        _refresh();
		    });
			
			//标题栏集合
			var $title_ths = $tr_head.find('tr.title');
			
			$tbody = $('<tbody>').appendTo($table);
		}
		
		function _init_table() {	
			//清空内容
			$tbody.empty();
			
			if(!cur_records || cur_records.length == 0) {
				$tbody.html('<tr><td class="text-center color-yellow" colspan="' + $thead.find('tr > th').length + '">'+lang["No_access_to_data"]+'</td></tr>');
				return;
			}
			
			$.each(cur_records, function(k, record) {
				//合并数据列表
				var data;
				//合并列的取值对象
				var mergedField = false;
				if(!merged) {
					//如果没有合并列，则封装记录为数组，以便以合并列方式解析数据
					data = [record];
				} else if(Object.prototype.toString.call(record) != '[object Array]') {
					//如果不为数组（也就是为对象），则取该对象的data属性
					data = record.data;
					mergedField = record;
				} else {
					//如果为数组，则直接赋值
					data = record;
				}
				
				$.each(data, function(i, obj) {
				
					var $tr_body = $('<tr>').click(function() {
						$(this).addClass('active').siblings('tr.active').removeClass('active');
					}).appendTo($tbody);
									
					var $td_box_body = $('<td>').addClass('hidden text-' + option.align).appendTo($tr_body);
					var $box_div_body = $('<div>').addClass('').appendTo($td_box_body);
					var $box_body = $('<input>').prop('type', 'checkbox').prop('id', 'chck' + (i + 4)).val(1).appendTo($box_div_body);
					var $label_body = $('<label>').prop('for', 'chck' + (i + 4)).appendTo($box_div_body);
	
//					var $td_num = $('<td>').text(i + 1).addClass('number text-' + option.align).appendTo($tr_body);
					
					$.each(option.fields, function(j, field) {
						var $td = $('<td>');
						//如果此列数据需要合并，且非第一行，则不再创建列
						if(field.merged) {
							if(i > 0)
								return true;
							else {
								//设置需合并的行数
								if(data.length > 1) {
									$td.prop('rowspan', data.length).addClass('merged');
									$tr_body.addClass('merged');
								}
							}
						}		
						
						$td.addClass('text-' + (field.align || option.align)).appendTo($tr_body);
						
						var value = '';
						var render = field.render || option.render;
						
						if(render)  {
							value = merged ? render(i, obj, k, mergedField) : render(k, obj);
						} else {
							var key = field.key;
							if(!key)
								return true;
							value = obj[key];
							value = value == undefined ? (mergedField ? '' : mergedField[key]) : value;
						}
						
						var format = field.format;
						if(format) {
							if(typeof format == 'string')
								format = plugin.formats[format];
							value = format.call(instance, value);
							$td.html(value);
						} else if(value instanceof $) {
							$td.append(value);
						} else {
							$td.html(value);
						}
					});
				
				});
			});
			
			$box = $tbody.find('tr > td> div > input[type="checkbox"]');
			
			if(option.checkbox) {
				$box.parent().parent().removeClass('hidden');	
			}
		}
		
		function _init_footer() {
			$footer = $('<div>').addClass('tile-footer rounded-bottom-corners');
			var $pager_row = $('<div>').addClass('row transparent-white-2').appendTo($footer);
			var $pager_div = $('<div>').addClass('col-sm-4 text-left sm-center').appendTo($pager_row);
			$pager = $('<ul>').addClass('pagination pagination-xs no-margin pagination-custom').appendTo($pager_div);
			
			$prev = $('<li>').addClass('disabled').appendTo($pager);
			var $prev_a = $('<a>').appendTo($prev);
			var $prev_i = $('<i>').addClass('fa fa-angle-double-left').appendTo($prev_a);
			$prev.click(function() {
				_prev_page();
			});
			
			$next = $('<li>').appendTo($pager);
			var $next_a = $('<a>').appendTo($next);
			var $next_i = $('<i>').addClass('fa fa-angle-double-right').appendTo($next_a);
			
			$next.click(function() {
				_next_page();
			});
			
		}
		
		function _init_pager() {
			pager.maxPage = Math.ceil(pager.total / pager.rows)
			pager.prevPage = pager.page < option.pageNums ? (option.pageNums < pager.maxPage ? option.pageNums : pager.maxPage) : pager.page;
			$prev.removeClass('disabled');
			_prev_page();
			$pager.find('li').not(':first, :last').filter(':first').addClass('active');
		}
		
		function _next_page() {
			if($next.hasClass('disabled'))
				return;
			$pager.find('li').not(':first, :last').remove();
			var curPage = pager.nextPage;
			pager.prevPage = curPage - 1;
   			var nums = pager.maxPage - pager.prevPage;
			nums = nums < option.pageNums ? nums : (option.pageNums < pager.maxPage ? option.pageNums : pager.maxPage); 
			var endPage = curPage + nums;
			pager.nextPage = endPage;
			var $li = $prev;
			for( ; curPage < endPage; curPage++) {
				$li = $('<li>').data('page', curPage).insertAfter($li);
				var $a = $('<a>').prop('href', '#').text(curPage).appendTo($li);
			}
			_process_pager();
		}
		
		function _prev_page() {
			if($prev.hasClass('disabled'))
				return;
			$pager.find('li').not(':first, :last').remove();
			var curPage = pager.prevPage;
			var startPage = curPage - option.pageNums;
			if(startPage < 0)
				startPage = 0;
			pager.nextPage = curPage + 1;
			pager.prevPage = startPage;
			var $li = $next;
			for( ; curPage > startPage; curPage--) {
				$li = $('<li>').data('page', curPage).insertBefore($li);
				var $a = $('<a>').prop('href', '#').text(curPage).appendTo($li);
			}
			_process_pager();
		}
		
		function _process_pager(isNext) {

			if(pager.prevPage < 1) 
				$prev.addClass('disabled');
			else
				$prev.removeClass('disabled');
			
			if(pager.nextPage > pager.maxPage)
				$next.addClass('disabled');
			else 
				$next.removeClass('disabled');

			$pager.find('li').not(':first, :last').click(function() {
				$pager.find('li').not(':first, :last').removeClass('active');
				$(this).addClass('active');
				pager.page = $(this).data('page');
				_get_records();
				_init_table();
			}).each(function() {
				if(pager.page == $(this).data('page')) {
					$(this).addClass('active');
					return false;
				}
			});
		}
		
		function _adapt_height() {
			var h1 = $header.outerHeight();
			
			var h2 = 0;
			if($widget.length > 0 && controls.left.$search.is(':hidden')) 
				h2 = $widget.outerHeight();
			
			var h3 = $footer.outerHeight();
			
			var h = $e.height() - h1 - h2 - h3 - 20;
			
			$body_table.height(h);
		}
		
		$.extend(Plugin.prototype, {
	    	refresh : _refresh,
	    	element : function() {
	    		return $e;
	    	},
	    	option : function() {
	    		return option;
	    	},
	    	curPager : function() {
	    		return pager;
	    	},
	    	curParams : function() {
	    		return cur_params;
	    	},
	    	curRecords : function() {
	    		return cur_records;
	    	},
	    	showControl : function(id, pos) {
	    		
	    	},
	    	showWidget : function() {
	    		$widget.removeClass('hidden');
	    	},
	    	hideWidget : function() {
	    		$widget.addClass('hidden');
	    	}
	    });
		
		return instance;
	}
	
	function Plugin() {
		this.version = '1.0';
	}
	
	plugin.defaults = {
		tableStyle : 'table-hover table-striped table-no-bordered table-sortable',
		title : '',
		fields : [{name : '', key : '', merged : true}],
		records : [],
		recordsName : 'records',
		pagerName : 'pager',
		url : '',
		exportUrl : '',
		params : {},
		page : 1,
		rows : 50,
		pageNums : 5,
		align : 'center',
		sortname : 'asc',
		beforeQuery : undefined,
		resizeable : true,
		hideHeader : false,
		hideFooter : false,
		showWidget : true,
		enableSerial : true,
		checkbox : false,
		sortable : false,
		editable : false,
		lazyload : false,
		
	}
	
	$.fn.nicetable = $.fn.niceTable = plugin;
	
})(jQuery, window);

/**
 * 注册基础控制工具
 */
;(function($) {
	var plugin = $.fn.nicetable;
	/**
	 * 表头小工具列表
	 */
	plugin.controls = {
		left : [],
		right : []
	}
	
	/**
	 * 添加表头小工具
	 * callback函数中使用this指针时，this指向初始化后的nicetable实例，
	 * visible和callback可在初始化nicetable时被指定属性覆盖，
	 * visible会被'show[id]'属性覆盖，
	 * callback会被'[id]Callback'属性覆盖，
	 * 例如工具id=close, 则show[id]=showClose， [id]Callback=closeCallback，以此类推
	 * 
	 * @author xuwei
	 * @param obj 工具实体 {id:唯一标识, icon:图标class, title:说明, visible:是否默认显示, callback:点击后回调}
	 * @param pos 位置 left：左侧 right：右侧，默认right
	 * @before 在另一个工具之前插入 id：目标工具id, index：目标工具索引（在列表中的位置）
	 */
	plugin.control = function(obj, pos, before) {
		if(!pos)
			pos = 'right';
		
		var ctls = plugin.controls[pos];
		
		if(!ctls)
			return;
		
		var has = false;
		if(before != undefined && before != null) {
			for(var i=0; i<ctls.length; i++) {
				var clt = ctls[i];
				if(clt.id == obj.id) {
					clts[i] = obj;
					has = true;
					break;
				}
				
				if(clt.id == before || i == before) {
					ctls.splice(i, 0, obj);
					has = true;
					break;
				}
			}
		}
		if(!has) {
			if(pos == 'right')
				ctls.splice(0, 0, obj);
			else
				ctls.push(obj);
		} 
	}
	
	plugin.control({
		id : 'back',
		icon : 'fa fa-reply',
		title : '返回',
		visible : false
	}, 'left');
	
	plugin.control({
		id : 'search',
		icon : 'fa fa-search',
		title : '查询',
		visible : true,
		initialized : function() {
			this.removeClass('hidden').addClass('hidden-md hidden-lg');
		}
	}, 'left');
	
	plugin.control({
		id : 'close',
		icon : 'fa fa-times',
		title : '关闭',
		visible : true,
		callback : function() {
			this.element().fadeOut(500);
		}
	}, 'right');
	
	plugin.control({
		id : 'refresh',
		icon : 'fa fa-refresh',
		title : '刷新',
		visible : true,
		callback : this.refresh
	}, 'right');	
	
	plugin.control({
		id : 'export',
		icon : 'fa fa-file-excel-o',
		title : '导出',
		visible : false,
		callback : function() {
			var exportUrl = this.option().exportUrl;
			var exportUrl = exportUrl + (exportUrl.match("[\?]") ? '&' : '?') + $.param(this.curParams());
			window.location.assign(exportUrl);
		}
	}, 'right');
	
})(jQuery);

/**
 * 格式化函数库
 */
;(function($) {
	var plugin = $.fn.nicetable;
	var formats = plugin.formats = new Object();
	
	/**
	 * 格式化数字，以货币形式显示 1,000.00
	 * @author xuwei
	 * @param value value可为任意类型，调用toString方法得到文本，文本中所有数字都会被格式化
	 * 如：
	 * 价格列表：
	 * 西瓜：9999.9999，
	 * 苹果：999.99，
	 * 榴莲：9999999
	 * 
	 * 格式化后为：
	 * 价格列表：
	 * 西瓜：9,999.9999，
	 * 苹果：999.99，
	 * 榴莲：9,999,999
	 */
	formats.currency = function(value) {
		if(typeof(value) == 'number') {
			var s = 1;
			if(value < 0) {
				value = Math.abs(value);
				s = -1;
			}
			value = s * Math.floor(value * 100) / 100;
		}

		var pattern = '\\d(?=(?:\\d{3})+(?:$|[^\\d]))';
		var regex = new RegExp(pattern, 'gm');
		return !value ? '0' : value.toString().replace(regex, function($0) {
			return $0 + ',';
		});
	}
	
})(jQuery);

/**
 * 重写jquery对象toString方法，返回对应HTML代码
 */
;(function($) {
	$.fn.extend({
		toString : function() {
			return $(this).prop('outerHTML');
		}
	});
})(jQuery);