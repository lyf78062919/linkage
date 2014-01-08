/**
 * javascript Infinite Level Linkage Select
 * javascript 无限级联动
 * @Author lhy
 */


var Linkage = function(opts) {
    var $ = jQuery;
    var _this = this;
    this.elm_arr = [];
    this.current_value;
    this.st = {
        select: '',
        data: {},
        _data:[],
        selStyle: '',
        selClass: '',
        maxLevel: 30,
        onchange:null
    };

    if (opts && typeof opts === 'object') {
        $.extend(this.st, opts);
    }
    
    this._parseData();

    this._init();

    this.api = {
        on  :   function(name,func){
          _this.st['on'+name] = func;
        },
        getData : function(key,name){
            return _this._getData(key);
        },
        getRouter : function(name){
            return _this._getRouter();
        }


    }

    return this.api;
}

Linkage.prototype._parseData = function(d,fid) {
    var data = (!d)?this.st.data:d,
        fid = (!fid)?0:fid,
        _data = this.st._data;
        //console.info(_data);
        for (var i in data) {
            //console.info(data[i]);
            var _temp = {};
            _temp['v'] = data[i]['name'];
            _temp['f'] = fid;
            _data[i] = _temp;
            if( typeof data[i]['cell'] === 'undefined' || !data[i]['cell'] ){
                continue;
            }else{
                //console.info(data[i]);
                this._parseData(data[i]['cell'],i);
            }
        }
}


Linkage.prototype._init = function() {
    this._bind(this.st.select);
    this._update(0);

}


Linkage.prototype._bind = function(sel) {
    var elm_arr = this.elm_arr,
        _this = this,
        sel_index = elm_arr.length || 0,
        elm = $(sel),
        elm_obj = {
            jq_node  : elm,
            value   : null,
            initial : null,
            hasdata : null
            };

    elm.data('sel_index', sel_index);
    elm_arr.push(elm_obj);
    elm.change(_this, this._onchange);
}


Linkage.prototype._onchange = function(event) {
    var _this = event.data,
        elm_arr = _this.elm_arr,
        jq_node = $(this),
        index = jq_node.data('sel_index');
        sel_value = jq_node.val(),
        elm_node = elm_arr[index];
        elm_node['value'] = sel_value;
        _this.current_value = sel_value;
        //console.info(index)
        // var cur_sel_index = $(this).data('sel_index');
        // _this._onchange(cur_sel_index+1);
        _this._change(index + 1);
}



Linkage.prototype._change = function(index) {
    var data = this.data,
        elm_arr = this.elm_arr;

    //还没有第 idnex 个 select     
    if (elm_arr.length - 1 < index) {
        this._generateSel(index);
    } else {
        this._update(index);
    }

    this._linkage(index);
    this._hook('onchange');
}


Linkage.prototype._generateSel = function(index) {
    var elm_arr = this.elm_arr,
        st = this.st,
        id = 'linksel' + ('' + Math.random()).slice(-6),
        sel_html = '<select id="' + id + '" style="' + st.selStyle + '" class="' + st.selClass + '" ></select>';
    elm_arr[index-1]['jq_node'].after(sel_html);
    this._bind('#' + id);
    //console.info(elm_arr);
    this._fill(index);
}

Linkage.prototype._update = function(index) {
    var elm_arr = this.elm_arr;
    this._clean(index);
    this._fill(index);
}


Linkage.prototype._clean = function(index) {
    var elm_arr = this.elm_arr,
        len     = elm_arr.length;
    
    elm_arr[index]['jq_node'].empty();

/*    if(len-1 > index){
        for (var i = index+1; i <= len; i++) {
            elm_arr[i]['jq_node'].remove();
            elm_arr.splice(i,1);
        };
    }*/


}


Linkage.prototype._fill = function(index) {
    var elm_arr = this.elm_arr,
        all_data = this.st.data,
        data = this._selData(index);

    if(data){
        var head = '<option value="null" >请选择</option>';
        var options = [];
        options.push(head);
        for (var i in data) {
            var row = data[i];
            option = $("<option>").val(i).text(row['name']).get(0);
            options.push(option);
        }
        elm_arr[index]['jq_node'].append(options);
        elm_arr[index]['hasdata'] = true;
    }else{
        elm_arr[index]['hasdata'] = false;
    }
    
    this._render(index);
}


Linkage.prototype._render   = function(index){
    var elm_arr = this.elm_arr,
        elm_node = elm_arr[index],
        jq_node =   elm_arr[index]['jq_node'];
    if(!elm_node['hasdata']){
        jq_node.css('visibility', 'hidden');
        return;
    }else{
        jq_node.css('visibility', 'visible');
    }
}


Linkage.prototype._selData  = function(index){
    var st = this.st,
    data = this.st.data,
    elm_arr = this.elm_arr,
    len = elm_arr.length,
    pre_value;
    
    if (typeof index === 'undefined' || index >= st.maxLevel) {
        return false;
    }

    if (index == 0) {
        return data;
    }
    for (var i = 1; i <= index; i++ ) {
        pre_value = elm_arr[i-1].value;
        if (pre_value && data && data[pre_value]) {
            if (data[pre_value]['cell'] === false) {
                data = false;
            }
            else {
                data = data[pre_value]['cell'] || null;
            }
        }
        else {
            data = false;
            break;
        }
    }
    
    return data;

}


Linkage.prototype._linkage  = function(index){
    var elm_arr = this.elm_arr,
        len     = elm_arr.length;

        for (var i = index+1;i < len; i++) {
            var elm_node = elm_arr[i];
            elm_node['jq_node'].css('visibility', 'hidden');
            elm_node['value'] = null;
        };
}


Linkage.prototype._remoteData   = function(){

}

Linkage.prototype._getData   = function(key,name){
    var rsdata;
    if(!key){ return; }
    var _data = this.st._data;
    if( name  &&  typeof name === 'string' && _data.hasOwnProperty(name) ){
        rsdata = _data[name]
    }else if( name && isArray(name)){
        for(var i in name){
            if( typeof name[i] === 'string' &&  _data.hasOwnProperty(name[i])){
                rsdata[name[i]] = _data[name[i]];
            }
        }
    }else if(!name){
        rsdata =  _data;
    }else{
        rsdata = null;
    }
    return rsdata;
}

Linkage.prototype._getRouter   = function(key){

    var elm_arr = this.elm_arr,
        len = elm_arr.length,
        name,
        arr = [];
        if (!len) { return null; }
        for (var i = 0; i < len; i++) {
            //console.info();
            if(elm_arr[i]['value']!=null){
                name = this._getData(elm_arr[i]['value'],name);
                if(!name){
                    break;
                }else{
                    arr.push(name);
                }
            }   
        }
    return  arr;
}







Linkage.prototype._hook   = function(hook_name){
    var st = this.st;

    if(typeof hook_name === 'undefined' || !hook_name ){
        return;
    }else{
        if(st.hasOwnProperty(hook_name)  &&  typeof st[hook_name] === 'function'  ){
            st[hook_name].call(this.api,this.current_value);
        }else{
            return;
        }
    }
}






var isArray = function(v){ return Object.prototype.toString.apply(v) === '[object Array]';};
var isNumber = function(o) { return typeof o === 'number' && isFinite(o); };