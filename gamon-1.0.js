(function(){

    var root = this;
    root.dataExtractions = {"noparse":{},"loop":{}};
    root.data = [];

    var config = {
        debug: true,
        setupRegex: false,
        scopeGlue: '\\.',
        varRegex: '',
        noParseRegex: '',
        varTagRegex:'',
        loopRegex:'',
        conditionalRegex:'',
        blockRegex: ''
    };

    var filters = {
        safe: function(){
            if(arguments.length == 0) return;
            if(typeof arguments[0] != "string") throw new Error('Invalid arguments type');
            return arguments[0].toString()
                .split('&').join('&amp;')
                .split('<').join('&lt;')
                .split('>').join('&gt;')
                .split('"').join('&quot;')
                .split('\'').join('&#039;');
        },
        "index": function(){
            if(arguments.length == 0) return;
            if(arguments.length == 2 && gamon.isArray(arguments[1])){
                return arguments[1][0];
            }else{
                if(!gamon.isArray(arguments[2]))  throw new Error("invalid arguments type");
                return arguments[2][arguments[0]][arguments[1]];
            }

        },
        length: function(){
            if(arguments.length == 0) return;
            if(gamon.isObject(arguments[0])){
                return Object.keys(arguments[0]).length;
            }else{
                return arguments[0].length;
            }
        }
    };

    var gamon = function(obj){
        if (obj instanceof gamon) return obj;
        if (!(this instanceof gamon)) return new gamon(obj);
    };

    //NodeJS support
    if (typeof exports !== "undefined") {
        if (typeof module !== "undefined" && module.exports) {
            exports = module.exports = gamon;
        }
        exports.gamon = gamon;
    } else {
        root.gamon = gamon;
    }

    //AMD support
    if (typeof define === 'function' && define.amd) {
        define('gmaon', [], function() {
            return gamon;
        });
    }

    gamon.scopeGlue = function(glue){
        if (glue !== "undefined"){
            config.setupRegex = false;
            config.scopeGlue = glue;
        }
        return config.scopeGlue;
    };

    gamon.parse = function(tmpl, data){

        setupRegex();

        var template, tpl = document.getElementById(tmpl);
        if(tpl !== null && typeof tpl !== "undefined" ){
            template = tpl.innerHTML;
            template = _doParse(template, data);

        }else{
            template = _doParse(tmpl, data);
        }

        return template;

    };

    gamon.parseComments = function(text){
        setupRegex();
        return text.replace(/\{\{#.*?#\}\}/g, '');
    };

    gamon.noParse = function(text){
        setupRegex();
        tokenMatch(config.noParseRegex, 'gm', text, function(matches){
            text = _setExtraction('noparse', matches[0], matches[1], text);
        });
        return text;
    };

    gamon.parseConditional = function(text, data) {
        setupRegex();

        tokenMatch(config.blockRegex, 'gm', text, function (matches) {
            text = _setExtraction('loop', matches[0], matches[0], text);
        });

        var cursor = 0,code = 'var data = obj; var r=[];';
        text = text.replace(/("|')/g,function(m){ return m == '"' ? "\"" : m == "'" ? "\\'" : ""; });

        tokenMatch(config.conditionalRegex, 'gm', text, function(matches){

            var str, condition = matches[2];
            var html = text.slice(cursor, matches.index);
            code += "\nr.push('" + html.replace(/("|')/g,function(m){return m == '"' ? "\"" : m == "'" ? "\'" : ""; }) + "');\n";
            tokenMatch('([a-zA-Z0-9_\\.\\|'+config.scopeGlue+']+)\\s*([<>=!]+)\\s*(\\".*?\\"|true|false|\\d+)', 'g', matches[0], function(match){
                condition = condition.replace(/\b(or|OR|and|AND)\b/g, function(m){
                    var operators = {or:"||", and:"&&"};
                    return operators[m.toLowerCase()] || '';
                });
            });

            str = _parseConditional(matches[1], condition, data);
            code += str.replace(/("|')/g,function(m){return m == '"' ? "\"" : m == "'" ? "\'" : ""; });
            cursor = matches.index + matches[0].length;

        });

        code += "\nr.push('" + text.slice(cursor, text.length) + "');\n";
        code += "\nreturn r.join('');";
        code = code.replace(/[\r\t\n]/g, '');
        return new Function("obj", code).apply(data, [data]);
    };

    gamon.parseVariables = function(text, data, extraction){
        setupRegex();

        if(extraction) text = _getExtraction('loop', text);

        tokenMatch(config.loopRegex, 'gm', text, function(matches){

            var variables = getVariables(matches[1], data);
            var looptext = '';
            for(i in variables){
                var str =  gamon.parseConditional(matches[2], variables[i]);
                str = gamon.parseVariables(str, variables[i], true);
                looptext += str;
            }
            text = text.replace(new RegExp('\\{\\{\\s*('+matches[1]+')\\s*\\}\\}([\\s\\S]*?)\\{\\{\\s*(\/'+matches[1]+')\\s*\\}\\}', ''), looptext);

        });

        tokenMatch(config.varTagRegex, 'g', text, function(matches){

            var filter = matches[1].split("|");
            if(filter.length > 1){
                var variable = getVariables(filter[0], data);
                var value = gamon.filter(filter[1], variable);
            }else{
                var value = getVariables(matches[1], data);
            }

            text = text.replace(matches[0], value);
        });

        return text;
    };

    gamon.filter = function(name, value){

        var args = [], fn = name;
        tokenMatch('([\\w]+)(\\(.*?\\))', 'g', name, function(match){

            tokenMatch('(\\B[\"\'].*?[\"\'])|(\\d)', 'g', match[2], function(matches){
                args.push(matches[0].replace(/("|')/g,function(){return ""}));
            });
            fn = match[1];
        });

        args.push(value);
        return filters[fn].apply(this, args);

    };

    gamon.filter.register = function(){

        if(arguments.length == 0) throw new Error("Register filter needs an object or filter's name and callback function");

        if(gamon.isObject(arguments[0])){
            for(var prop in arguments[0]){
                var obj = {};
                obj[prop] = arguments[0][prop];
                if(prop in filters) throw new Error('Filter "'+prop+'" already exist!');
                extend(filters, obj);
            }
        }else if(typeof arguments[0] == "string" && arguments[0].length){

            if(typeof arguments[1] !== "function") throw new Error('Filter needs a callback function');

            var obj = {};
            obj[arguments[0]] = arguments[1];
            extend(filters, obj);
        }else{
            throw new Error('Invalid filter register arguments');
        }

    };

    gamon.loadTemplate = function(params, isAjax){

        var params = gamon.isObject(params) ? params : {url:params};

        if(isAjax){
            return requestAjax(params);
        }else{
            return request(params.url);
        }
    };


    function _parseConditional(conditionalTag, condition, data){
        tokenMatch('([a-zA-Z0-9_\\.'+config.scopeGlue+'\\|]+)\\s*([<>=!]+)\\s*([\\"\\\'].*?[\\"\\\']|\\d+|true|false)', 'g', condition, function(matches){

            var filter = matches[1].trim().split("|");

            if(filter.length > 1){
                var variable = getVariables(filter[0], data);
                var result = gamon.filter(filter[1], variable);

                condition = result + " " + matches[2] + " " + matches[3];
            }else{
                var variable = valueToLiteral(getVariables(filter[0], data));
                condition = variable + " " + matches[2] + " " + matches[3];
            }
        });

        var conditional = condition;
        switch(conditionalTag){
            case "if":
                conditional = conditionalTag + "( " + condition + " ){";
                break;
            case "elseif":
                conditional = "}else if(" + condition + "){";
                break;
            case "else":
                conditional = "}"+conditionalTag+"{";
                break;
            case "endif":
                conditional = "}";
                break;
            case "/if":
                conditional = "}";
                break;

        }
        return conditional;
    }

    function _setExtraction(type, dataExtraction, dataReplacement, text){
        var date = new Date(),
            id = date.getTime()*dataReplacement.length;

        root.dataExtractions[type][id] = dataReplacement;
        return text.replace(dataExtraction, type+'_'+id);
    }

    function _getExtraction(type, text){
        if(typeof type == null || typeof type === "undefined"){
            for(var id in root.dataExtractions){
                text = text.replace(type+'_'+id, root.dataExtractions[type][id]);
                delete root.dataExtractions[type][id];
            }
        }else{
            for(var id in root.dataExtractions[type]){
                text = text.replace(type+'_'+id, root.dataExtractions[type][id]);
                delete root.dataExtractions[type][id];
            }
        }

        return text;
    }

    function _doParse(text, data){
        text = text.replace(/[\r\t\n]/g, '');
        text = gamon.parseComments(text);
        text = gamon.noParse(text);
        text = gamon.parseConditional(text, data);
        text = gamon.parseVariables(text, data, true);
        text = _getExtraction('noparse', text);

        return text;
    }

    function getVariables(key, data){
        if(key == "[]"){
            return data;
        }else {
            if (key.indexOf(config.scopeGlue) === -1) {
                var keys = key.split('.');
            } else {
                var keys = key.split(config.scopeGlue);
            }

            if (keys.length > 1) {
                for (var i = 0; i < keys.length; i++) {
                    if (gamon.isObject(data)) {
                        if (data[keys[i]].hasOwnProperty(keys[i + 1])) {
                            return getVariables(keys[i + 1], data[keys[i]]);
                        } else {
                            return data[keys[i]];
                        }
                    } else {
                        return data[keys[i]];
                    }
                }
            } else {
                return data[keys[0]];
            }
        }

        return data;
    }

    function tokenMatch(pattern, modifier, text, callback) {
        var modifier = modifier || '';
        var reg = new RegExp(pattern, modifier);
        var matches;

        while(matches = reg.exec(text)){
            var result = callback(matches, text);
            if(typeof result == 'number'){
                reg.lastIndex = result;
            }
        }
    }

    function setupRegex(){
        if(config.setupRegex) return;

        var glue = config.scopeGlue;
        config.varRegex = glue === '\\.' ? '[a-zA-Z0-9_'+glue+']+' : '[a-zA-Z0-9_\\.'+glue+']+';
        config.noParseRegex = '\\{\\{\\s*noparse\\s*\\}\\}([\\s\\S]*?)\\{\\{\\s*\/noparse\\s*\\}\\}';
        config.varTagRegex = '\\{\\{\\s*(.*?)\\s*\\}\\}';
        config.loopRegex = '\\{\\{\\s*('+config.varRegex+')\\s*\\}\\}([\\s\\S]*?)\\{\\{\\s*\/\\1\\s*\\}\\}';
        config.conditionalRegex = '\\{\\{\\s*(if|elseif|else|endif|\\/if)\\s*((?:\\()?([\\s\\S]*?)(?:\\))?)\\s*\\}\\}';
        config.blockRegex = '\\{\\{\\s*((?!noparse)'+config.varRegex+')\\s*\\}\\}([\\s\\S]*?)\\{\\{\\s*\/\\1\\s*\\}\\}';

        config.setupRegex = true;
    }

    function extend(target, options){
        target = target || {};
        for (var prop in options) {
            if (typeof options[prop] === 'object') {
                target[prop] = gamon.extend(target[prop], options[prop]);
            } else {
                target[prop] = options[prop];
            }
        }
        return target;
    }

    function valueToLiteral(value){
        if(value === null){
            return "null";
        }else if(value === true){
            return true;
        }else if(value === false){
            return false;
        }else if(typeof value === "string"){
            return '"'+value.replace(/\\"\\'/g,"\\$&")+'"';
        }else if(typeof value === "number"){
            return value;
        }else{
            return value;
        }
    }

    function requestAjax(params){
        params.method = ( params.method ? params.method : 'GET')

        var request = new newRequest();
        request.onreadystatechange = function(){
            if(request.readyState == 4){
                if(request.status == 200){
                    params.onComplete(request);
                }else{
                    params.onComplete(request);
                }
            }
        }
        request.open(params.method, params.url);
        request.send(null);
    }

    function request(path){
        var request = new newRequest()
        request.open("GET", path, false);

        try{request.send(null);}
        catch(e){return null;}

        if ( request.status == 404 || request.status == 2 ||(request.status == 0 && request.responseText == '') ) return null;

        return request.responseText
    }

    function newRequest(){
        var factories = [function() { return new ActiveXObject("Msxml2.XMLHTTP"); },function() { return new XMLHttpRequest(); },function() { return new ActiveXObject("Microsoft.XMLHTTP"); }];
        for(var i = 0; i < factories.length; i++) {
            try {
                var request = factories[i]();
                if (request != null)  return request;
            }
            catch(e) { continue;}
        }
    }

    gamon.log = function(severity, message){
        if(config.debug) {
            console[ (severity === 1) ? 'log' : (severity === 2) ? 'warn' : 'error'](message);
        }
    };

    gamon.isArray = Array.isArray || function(obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    };

    gamon.isObject = function(obj) {
        var type = typeof obj;
        return type === 'function' || type === 'object' && !!obj;
    };

    // Is a given value a boolean?
    gamon.isBoolean = function(obj) {
        return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
    };

    // Is a given value equal to null?
    gamon.isNull = function(obj) {
        return obj === null;
    };

    // Is a given variable "undefined"?
    gamon.isUndefined = function(obj) {
        return obj === void 0;
    };

}.call(this));