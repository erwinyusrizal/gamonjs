# GamonJS

GamonJS is another Javascript Template Parser

## Usage
for demo you can check in the demo folder

## Custom Scope Glue
By default gamon will use dot (.) as a scope glue
```
//custom scope glue
gamon.scopeGlue("::");
```

## Comment
You can add comments to your templates by wrapping the text in {{# #}}.
```
{{# this text will not gonna rendered #}}
{{#
    They can be multi-line too.
#}}
```

## Prevent Parsing
If you would like to use a text contains gamon tag for example {{ your text }} inside your template, you can use gamon noparse tag. For example:
```
{{ noparse }}
    {{ this text wont be parsed }}
    {{ if array|length > 0 }}
    {{ objects }}
{{ /noparse }}
```

## Conditionals Tags
Conditionals in gamon are simple and easy to use. It allows for the standard if, elseif, and else.

All if blocks must be closed with either a {{ /if }} or {{ endif }} tag.

A Conditional can contain any Comparison Operators you would do in JS (==, !=, ===, !==, >, <, <=, >=). You can also use any of the Logical Operators (||, &&, and, or).
```
{{ if object.properties }}
    {{ properties }}
{{ endif }}

{{ if variable == "some text" }}
    <p>Will render: {{ variable }}</p>
{{ elseif variable == "another text" }}
    <p>Will render another text {{ variable }}</p>
{{ else }}
    <p>Maybe this is not a text</p>
{{ endif }}
```

##Variable Tags
When dealing with variables, you can: access single variables, access deeply nested variables inside arrays/objects, and loop over an array. You can even loop over nested arrays.
### Simple Variable
```
var data = {
    "title": "Mr.",
    "name": {
        "first_name": "John",
        "last_name": "Doe"
    },
    "childrens": [
        {
            "name": "Jhonny",
            "age": "25",
            "birthday": "1990-05-20"
        },
        {
            "name": "Merry",
            "age": "20",
            "birthday": "1995-02-10"
        }
    ],
    "asets": ["Cars", "House", "Bike", "Gold"]
};
```
### Basic Example
```
Hello {{ title }}
Hello {{ title }} {{ name.first_name }}
```

### Variable Loop
Varible Loop is a block tag contain variable name. Each loop variable tag must have its closing tag
```
//Loop an object
{{ childrens }}
    {{ name }}
    {{ age }}
    {{ birtday }}
{{ /childrens }}

//Loop an array
{{ assets }}
    {{ [] }}
{{ /assets }}
```

## Parse

### Simple Parse
```
var obj = {
    "name":{
        "first_name": "John",
        "last_name": "Doe"
    }
};
var text = '<p>First Name: {{ name.first_name }}, Last Name: {{ name.last_name }}</p>';
var html = gamon.parse(text, obj);
```

### Include Template
```
<script type="text/html" id="my-tmpl">
    <p>First Name: {{ name.first_name }}, Last Name: {{ name.last_name }}</p>
</script>
<div id="container"></div>

var obj = {
    "name":{
        "first_name": "John",
        "last_name": "Doe"
    }
};
var tmpl = document.getElementById("my-tmpl");
var container = document.getElementById("container");
var html = gamon.parse(tmpl, obj);
container.innerHtml = html;
```

### External Template
You can load an external template using gamon loadTemplate method
```
//NON-AJAX
var html = gamon.loadTemplate("path/to/template");
gamon.parse(html);

//AJAX
var html = gamon.loadTemplate({
    url: "partials/index.html",
    onComplete: function(response){
        //do parsing here
    }
}, true);
```

## Filter
Gamon filter is a function that you can use to filter a variable/array/object in your variable tags, loop tags or conditional tags separated by pipe (|) char. By default gamon provide filters: safe, index and length only but you can create your own custom filter

* |safe ==> return escaped characters &, <, >, ", '
* |index ==> return array index value, ex: array|index(keys,properties)
* |length ==> return string, array, object length

```
var obj = {
    "hello": "<script>alert('hello');</script>",
    "skills": ["HTML", "Javascript", "CSS"];
};

//safe
{{ hello|safe }}

//index
{{ skills|index(0) }}

// length
{{ skills|length }}

//conditional contain filter
{{ if skills|length > 0 }}
```

### Custom Filter
If you need a custom callback that you can use in your filter, you can create your custom filter

```
//Register Single Filter
gamon.filter.register("join", function(separator, value){
    if(!gamon.isArray(value)) throw new Error("Value not an array");
    return value.join(separator);
});

//Register multiple filters
gamon.filter.register({
    "join":function(separator, value){
        if(!gamon.isArray(value)) throw new Error("Value not an array");
        return value.join(separator);
    },
    "length": function(value){
        if(value === "undefined") return;
        if(gamon.isObject(value)){
            return Object.keys(value).length;
        }else{
            return value.length;
        }
    }
});
```
You can create your filter arguments as many as you want separated by "", but for the last argument should be the filter test value.
```
gamon.register("sample_filter", function(arg1, arg2, arg3, arg4, value){
    //logic here
});

//template usage
{{ variable|sample_filter("arg1","arg2","arg3","arg4") }}
```

License
----
MIT - 
Free to use, Free to Edit, Do whatever you want with the code

[Erwin yusrizal](http://erwinyusrizal.me)