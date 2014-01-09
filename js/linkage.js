/**
 * javascript Infinite Level Linkage Select
 * javascript 无限级联动 V1.0
 * @Author lhy
 */


var Linkage = function(opts) {
    var $ = jQuery;
    xxxxxxxxxxxxxxx = this;
    var _this = this;
    this.elm_arr = [];
    this.current_value;
    this.st = {
        value:null,
        select: '',
        names:[],
        name:'',
        //adapter:'string', //string,file,remote
        data: {},
        url:'',
        ajaxData:null,
        file:'',
        initial:[],
        _data:[],
        tip:{text:'请选择',value:'',display:true},
        selStyle: '',
        selClass: '',
        maxLevel: 30,
        son:'cell',
        optionText:'name',
        onchange:null
    };

    if (opts && typeof opts === 'object') {
        $.extend(this.st, opts);
    }

    this.api = {
        on  :   function(name,func){
          _this.st['on'+name] = func;
        },
        getData : function(key,name){
            return _this._getData(key,name);
        },
        getRouter : function(name){
            return _this._getRouter(name);
        },
        setValue : function(value){
            return _this._setValue(value);
        },
        arrayToTree : function(data, id, pid){
            return _this._arrayToTree(data, id, pid);
        }

    }

    this._init();
    return this.api;
}


Linkage.prototype._parseData = function(d,fid) {

    var st   = this.st,
        data = (!d)?st.data:d,
        fid = (!fid)?0:fid,
        _data = st._data;
        //console.info(_data);
        //TODO:数据存储可以优化
        for (var i in data) {
            //console.info(data[i]);
            var _temp = {};
            _temp =  data[i];
            _temp['_f'] = fid;
            _temp['_v'] = i;
            _data[i] = _temp;
            if( typeof data[i][st['son']] === 'undefined' || !data[i][st['son']] ){
                continue;
            }else{
                //console.info(data[i]);
                this._parseData(data[i][st['son']],i);
            }
        }
    return;    
}


Linkage.prototype._init = function() {
    var st = this.st;

    //初始化数据类型
    this._dataAdapter();
    this._bind(st.select);
    this._change(0);
    this._linkage(0);
    this._render(0);
    
    if(st.value){
        this._setValue(st.value);
    }
    
    return;
}

Linkage.prototype._dataAdapter = function(){
    var st = this.st,
        _this = this;
    if(!$.isEmptyObject(st.data)){
        st.adapter = 'string';
    }else if(st.url){
        $.ajax({ type: "POST", async: false,  url: st.url, data: st.ajaxData,  success: function(data){

            if($.isEmptyObject(data)){
                console.error("获取数据失败");
                return;
            }else{
                if(data['code'] == 1){
                    st.data = data['data'];
                }else{
                    st.url = null;
                    st.file = data['data'];
                    _this._dataAdapter();
                    return;
                }
            }
        }, dataType:'json'});
        //st.adapter = 'remote';
    }else if(st.file){

        $.ajax({
            type: "post",
            async: false,
            url: st.file,
            data: {},
            //contentType: "application/json; charset=utf-8",
            dataType: "json",
            cache: false,
            success: function (json) {
                st.data = json
            },
            error: function (err) {
                console.error("获取数据失败");
                return;
            }
        });
    }else{
        console.error("您没有指定数据源!");
    }

    this._parseData();
    return;
}


Linkage.prototype._setValue = function(value) {
    var st = this.st,
    data,result=[];
    
    data = this._serach(value);    
    while(data && data['_f'] != 0 ){
        result.push(data);
        data = this._serach(data['_f']);
    }
    result.push(data);


    for (var i = result.length - 1,j=0; i >= 0; i--,j++) {
        this._select(j,result[i]['_v']);
    };


    return;
}

Linkage.prototype._serach = function(value) {
    var _data = this.st._data;
    
    if(typeof _data[value] === 'undefined' ){
        return null;
    }else{
        return _data[value];
    }    

    return;
}



Linkage.prototype._bind = function(select) {
    var elm_arr = this.elm_arr,
        _this = this,
        st    = this.st,
        _select = [],
        sel_index = elm_arr.length || 0;

        if(select && typeof select === 'string' ){
            _select.push(select);
        }else if(st.select && $.isArray(st.select)){
            _select = select;
        }else{
             return false;
        }

        for(var i in _select){
            sel = _select[i];
            elm = $(sel),
            initial = (st && typeof st['initial'][sel_index] !== 'undefined')?st['initial'][sel_index]:null;
            elm_obj = {
                jq_node  : elm,
                value   : null,
                initial : initial,
                hasdata : null
                };           
            elm.data('sel_index', sel_index);
            elm_arr.push(elm_obj);
            elm.change(_this, this._onchange);
            sel_index++;
        }

    return;
}


Linkage.prototype._onchange = function(event) {
    var _this = event.data,
        elm_arr = _this.elm_arr,
        jq_node = $(this),
        index = jq_node.data('sel_index');
        sel_value = jq_node.val(),
        elm_node = elm_arr[index];
        if(sel_value === _this['st']['tip']['value']){
            sel_value = null;
        }
        elm_node['value'] = sel_value;
        _this.current_value = sel_value;
        //console.info(index)
        // var cur_sel_index = $(this).data('sel_index');
        // _this._onchange(cur_sel_index+1);
        _this._change(index + 1);
    return;
}



Linkage.prototype._change = function(index) {
    var data = this.data,
        elm_arr = this.elm_arr;
    //还没有第 idnex 个 select     
    if (elm_arr.length - 1 < index) {
        this._create(index);
    } else {
        this._update(index);
    }

    this._hook('onchange');
    this._linkage(index);
    this._render(index);
    return;
}


Linkage.prototype._create = function(index) {
    var elm_arr = this.elm_arr,
        st = this.st,
        data = this._selData(index);
        if(!data) return;
    var id = 'linksel' + ('' + Math.random()).slice(-6),
        sel_html = '<select id="' + id + '" style="' + st.selStyle + '" class="' + st.selClass + '" ></select>';
    elm_arr[index-1]['jq_node'].after(sel_html);
    this._bind('#' + id);
    //console.info(elm_arr);
    this._fill(index);
    return;
}

Linkage.prototype._update = function(index) {
    var elm_arr = this.elm_arr;
    this._clean(index);
    this._fill(index);
    return;
}


Linkage.prototype._clean = function(index) {
    var elm_arr = this.elm_arr,
        len     = elm_arr.length;
    
        for(var i = index;i<len;i++ ){
            elm_arr[i]['jq_node'].empty();
            elm_arr[i]['value'] = null;
            elm_arr[i]['hasdata'] = false;   
        }

/*    if(len-1 > index){
        for (var i = index+1; i <= len; i++) {
            elm_arr[i]['jq_node'].remove();
            elm_arr.splice(i,1);
        };
    }*/

    return;
}


Linkage.prototype._fill = function(index) {
    var elm_arr = this.elm_arr,
        st = this.st,
        all_data = this.st.data,
        data = this._selData(index);

    if(data){
        var head = '<option value="'+st['tip']['value']+'" >'+st['tip']['text']+'</option>';
        var options = [];
        if( st['tip']['display'] ) options.push(head);
        for (var i in data) {
            var row = data[i];
            option = $("<option>").val(i).text(row[st['optionText']]).get(0);
            options.push(option);
        }
        elm_arr[index]['jq_node'].append(options);
        elm_arr[index]['hasdata'] = true;
    }else{
        elm_arr[index]['hasdata'] = false;
        elm_arr[index]['display'] = false;
        elm_arr[index]['value'] = null;
    }
    
    return;
    //this._render(index);
}


Linkage.prototype._render   = function(index){

    var elm_arr = this.elm_arr,
        len     = elm_arr.length;
        for(var i = index;i<len;i++ ){
            elm_node = elm_arr[i];
            jq_node =   elm_arr[i]['jq_node'];
            if(elm_node['display'] && elm_node['hasdata']){
                jq_node.css('visibility', 'visible');
            }else{
                jq_node.css('visibility', 'hidden');
            }

        }

        this._addFormName();

    return;
}


Linkage.prototype._addFormName   = function(){
    var elm_arr = this.elm_arr,
        st      = this.st,
        last;
        for(var i in elm_arr){
            elm_node = elm_arr[i];

            if( st.names.length > 0 && $.isArray(st.names) && i < st['names'].length  ){
                elm_node['jq_node'].attr("name",st.names[i]);
            }else{
                elm_node['jq_node'].removeAttr('name');
            }

            if( elm_node['value'] && elm_node['display'] && elm_node['hasdata'] ){
                last = i;
            }else{
                continue;
            }

        }

        if(last){
            elm_arr[last]['jq_node'].attr("name",this.st.name);
        }
}

Linkage.prototype._select   = function(index,value){
    if(index === undefined) return;
    var elm_arr = this.elm_arr,
        elm_node= elm_arr[index],
        elm = typeof elm_node !== 'undefined'?elm_node['jq_node']:null,
        option;
        if(!elm) return;
        if(value === null) option = elm.find("option");
        else    option = elm.find("option[value='" + value + "']");
        if(option.length > 0 && option.eq(0).val() !== this.st.tip.value ){
            option.eq(0).prop('selected', true);
            elm_node['jq_node'].change();
        }
    return;
}


//获得某一个层级的数据
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
        st      = this.st,
        len     = elm_arr.length;

        for (var i = index+1;i < len; i++) {
            var elm_node = elm_arr[i];
            elm_node['value'] = null;
            elm_node['display'] = false; 
        }

        if(index<len){
            elm_node = elm_arr[index];
            elm_node['value'] = null; 
            elm_node['display'] = true; 
            //todo:可以合并多个change触发
            if(elm_node['initial']){
                this._select(index,elm_node['initial']);
            }else{
                this._select(index,null);
            }
        }



    return;
}


Linkage.prototype._fileData     = function(){

}


Linkage.prototype._remoteData   = function(){

}


Linkage.prototype._getData   = function(key,name){
    var rsdata;
    if(!key){ return; }
    var _data = this.st._data[key];
    if( name  &&  typeof name === 'string' && _data.hasOwnProperty(name) ){
        rsdata = _data[name];
    }else if( name && $.isArray(name)){
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

Linkage.prototype._getRouter   = function(name){
    var elm_arr = this.elm_arr,
        len = elm_arr.length,
        value,
        arr = [];
        if (!len) { return null; }
        for (var i = 0; i < len; i++) {
            //console.info();
            if(elm_arr[i]['value']!=null){
                value = this._getData(elm_arr[i]['value'],name);
                if(value === null || value === undefined ){
                    break;
                }else{
                    arr.push(value);
                }
            }   
        }
    return  arr;
}



Linkage.prototype._hook   = function(hook_name){

    var st = this.st,
        _this = this;

    if(typeof hook_name === 'undefined' || !hook_name ){
        return;
    }else{ 
        if(st.hasOwnProperty(hook_name)  &&  typeof st[hook_name] === 'function'  ){
            st[hook_name].call(this.api,this.current_value);
        }else{
            setTimeout(function() { _this._hook(hook_name); },0);
        }
    }
    return;
}


Linkage.prototype._arrayToTree = function (data, id, pid){
            if (!data || !data.length) return [];
            var targetData = [];                    //存储数据的容器(返回) 
            var records = {};
            var itemLength = data.length;           //数据集合的个数
            for (var i = 0; i < itemLength; i++)
            {
                var o = data[i];
                records[o[id]] = o;
            }
            for (var i = 0; i < itemLength; i++)
            {
                var currentData = data[i];
                var parentData = records[currentData[pid]];
                if (!parentData)
                {
                    targetData.push(currentData);
                    continue;
                }
                parentData.children = parentData.children || [];
                parentData.children.push(currentData);
            }
            return targetData;
}