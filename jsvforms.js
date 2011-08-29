var JSV = require("../JSV").JSV;
var typeOf = JSV.typeOf;
var isJSONSchema = JSV.isJSONSchema;
var idCounter = 0;

Array.removeAll = function (arr, o) {
	var index;
	while ((index = arr.indexOf(o)) > -1) {
		arr.splice(index, 1);
	}
};

Array.addAll = function (arr, os) {
	var x, xl;
	for (x = 0, xl = os.length; x < xl; ++x) {
		if (arr.indexOf(os[x]) === -1) {
			arr.push(os[x]);
		}
	}
};

function escapeXMLAttribute(str) {
	return str
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");
}

/*
function createSchema(schema, instance) {
	var id = "jsvf-" + ++idCounter;
	var inputId = "jsvf-" + ++idCounter;
	var attributes = schema.getAttributes();
	var content = [];
	var options = [];
	var type = JSV.toArray(attributes["type"]);
	var currentType;
	var currentValue;
	
	content.push('<div id="' + id + '" class="jsvf-instance" data-jsvf-schemaURI="' + escapeXMLAttribute(schema.getURI()) + '">');
	
	//if (attributes["title"]) {
	//	content.push('<label class="jsvf-title" for="' + inputId + '">' + attributes["title"] + '</label>');
	//}
	
	//if (attributes["description"]) {
	//	content.push('<p class="jsvf-description">' + attributes["description"] + '</p>');
	//}
	
	if (type.length === 1 && type[0] !== "any") {
		currentType = (typeOf(type) === "array" ? type[0] : type);
	} else {
		if (type.length === 0 || type.indexOf("any") !== -1) {
			type = ["null", "boolean", "number", "string", "object", "array"];
		}
		
		content.push('<select class="jsvf-type">');
		
		var typeSelected = 0;
		for (var x = 0, xl = type.length; x < xl; ++x) {
			var typeValue, typeLabel;
			options = [];
			
			if (isJSONSchema(type[x])) {
				typeValue = type[x].getURI();
				typeLabel = type[x].getAttribute("title") || typeValue;
			} else {
				typeLabel = typeValue = type[x];
			}
			
			if (x === typeSelected) {
				currentType = typeValue;
				options.push('selected="selected"');
			}
			
			content.push('<option value="' + typeValue + '" ' + options.join(" ") + '>' + typeLabel + '</option>');
		}
		
		content.push('</select>');
	}
	
	options = [];
	//if (attributes["required"]) {
	//	options.push('required="required"');
	//}
	if (attributes["readonly"]) {
		options.push('readonly="readonly"');
	}
	
	switch (currentType) {
	case "any":
	case "null":
		break;  //do nothing
	
	case "boolean":
		if (currentValue) {
			options.push('checked="checked"');
		}
		
		content.push('<input id="' + inputId + '" class="jsvf-boolean" type="checkbox" ' + options.join(" ") + '/>');
		break;
		
	case "number":
		if (typeOf(attributes["minimum"]) === "number") {
			options.push('min="' + attributes["minimum"] + '"');
		}
		if (typeOf(attributes["maximum"]) === "number") {
			options.push('max="' + attributes["maximum"] + '"');
		}
		//TODO: Support exclusiveMinimum/exclusiveMaximum
		if (typeOf(attributes["divisibleBy"]) === "number") {
			options.push('step="' + attributes["divisibleBy"] + '"');
		}
		if (typeOf(currentValue) === "number") {
			options.push('value="' + currentValue + '"');
		}
		
		content.push('<input id="' + inputId + '" class="jsvf-number" type="number" ' + options.join(" ") + '/>');
		break;
	
	case "string":
		if (attributes["pattern"]) {
			options.push('pattern="' + attributes["pattern"] + '"');
		}
		if (typeOf(attributes["minLength"]) === "number") {
			options.push('data-minLength="' + attributes["minLength"] + '"');
			if (attributes["minLength"] > 0) {
				options.push('required="required"');
			}
		}
		if (typeOf(attributes["maxLength"]) === "number") {
			options.push('maxlength="' + attributes["maxLength"] + '"');
		}
		if (currentValue) {
			options.push('value="' + currentValue + '"');
		}
		//TODO: Support format
		
		content.push('<input id="' + inputId + '" class="jsvf-string" type="text" ' + options.join(" ") + '/>');
		break;
	}
	
	content.push('</div>');
	
	return content.join('');
}
*/

var TYPES = ["null", "boolean", "number", "string", "object", "array"];
var TYPE_VALUES = {
	"null" : null,
	"boolean" : false,
	"number" : 0,
	"integer" : 0,
	"string" : "",
	"object" : {},
	"array" : []
};
var FORMAT_INPUT_TYPE = {
	"text" : "text",
	"search" : "search",
	"tel" : "tel",
	"phone" : "tel",
	"telephone" : "tel",
	"url" : "url",
	"uri" : "url",
	"urn" : "url",
	"email" : "email",
	"password" : "password",
	"datetime" : "datetime",
	"date-time" : "datetime",
	"date" : "date",
	"month" : "month",
	"week" : "week",
	"time" : "time",
	"datetime-local" : "datetime-local",
	"utc-millisec" : "number",
	"number" : "number",
	"color" : "color",
	"regex" : "text",
	"regexp" : "text",
	"style" : "text",
	"ip-address" : "text",
	"ipv4" : "text",
	"ipv6" : "text",
	"host-name" : "text",
	"textarea" : "textarea"
};

function renderSchema(schema, instance, id) {
	var html = [];
	var types = JSV.toArray(schema.getAttribute("type"));
	var title = schema.getAttribute("title");
	var description = schema.getAttribute("description");
	var defaultValue = schema.getAttribute("default");
	var instanceType;
	var instanceValue;
	var instanceUri;
	var x, xl;
	
	//fix "type" attribute
	if (types.length === 0 || (types.length === 1 && types[0] === "any")) {
		types = TYPES;
	} else if (types.indexOf("any") > -1) {
		Array.removeAll(types, "any");
		Array.addAll(types, TYPES);
	}
	
	if (!instance || instance.getType() === "undefined") {
		//if no instance provided, create a default one
		if (typeOf(defaultValue) !== "undefined") {
			//use the default value as the instance
			instanceType = typeOf(defaultValue);
			instanceValue = defaultValue;
			instanceUri = null;
			
			//determine type from value
			for (x = 0, xl = types.length; x < xl; ++x) {
				if ((typeOf(types[x]) === "string" && types[x] === instanceType) || (isJSONSchema(types[x]) && types[x].validate(instanceValue).errors.length === 0)) {
					instanceType = types[x];
					break;
				}
			}
		} else {
			//use the first type as a generic default instance
			instanceType = types[0];
			instanceValue = TYPE_VALUES[instanceType];
			instanceUri = (instance && instance.getURI());
		}
	} else {
		instanceType = instance.getType();
		instanceValue = instance.getValue();
		instanceUri = instance.getURI();
		
		//determine type from instance
		for (x = 0, xl = types.length; x < xl; ++x) {
			if ((typeOf(types[x]) === "string" && types[x] === instanceType) || (isJSONSchema(types[x]) && types[x].validate(instance).errors.length === 0)) {
				instanceType = types[x];
				break;
			}
		}
	}
	
	//render schema container
	html.push('<fieldset' + (id ? ' id="' + id + '"' : '') + ' class="jsvf-instance" data-jsvf-schemauri="' + escapeXMLAttribute(schema.getURI()) + '">');
	
	//render schema title
	if (title) {
		html.push('<legend class="jsvf-title">' + title + '</legend>');
	}
	
	//render schema description
	if (description) {
		html.push('<p class="jsvf-description">' + description + '</p>');
	}
	
	//render type selection
	if (types.length > 1) {
		html.push('<select class="jsvf-type">');
		
		var typeValue, typeLabel;
		for (x = 0, xl = types.length; x < xl; ++x) {
			if (typeOf(types[x]) === "string") {
				typeLabel = typeValue = types[x];
			} else if (isJSONSchema(types[x])) {
				typeValue = types[x].getURI();
				typeLabel = types[x].getAttribute("title") || typeValue;
			}
			
			html.push('<option value="' + typeValue + '"' + (types[x] === instanceType ? ' selected="selected"' : '') + '>' + typeLabel + '</option>');
		}
		
		html.push('</select>');
	}
	
	html.push(renderInstance(schema, instanceType, instanceValue, instanceUri));
	
	html.push('</fieldset>');  //jsvf-instance

	return html.join("");
}

function renderInstance(schema, type, value, uri, id) {
	var attributes = schema.getAttributes(),
		typeName = (isJSONSchema(type) ? "schema" : type),
		generic = 
			(id ? ' id="' + id + '"' : '') + 
			' class="jsvf-value jsvf-' + typeName + '"' +
			' data-jsvf-type="' + typeName + '"' +
			(attributes["readonly"] ? (typeName === "schema" ? ' data-jsvf-readonly="true"' : ' readonly="readonly"') : '')
	;
	
	switch (typeName) {
	case "null":
		return '<input' + generic + ' type="hidden" value="null"/>';
	
	case "boolean":
		return '<input' + generic + ' type="checkbox"' + (value ? ' checked="checked"' : '') + '/>';
		
	case "number":
		return '<input' + generic + ' type="number"' +
			(typeOf(attributes["minimum"]) === "number" ? ' min="' + attributes["minimum"] + '"' : '') +
			(typeOf(attributes["maximum"]) === "number" ? ' max="' + attributes["maximum"] + '"' : '') +
			(attributes["exclusiveMinimum"] ? ' data-jsvf-exclusiveMinimum="true"' : '') +
			(attributes["exclusiveMaximum"] ? ' data-jsvf-exclusiveMaximum="true"' : '') +
			(attributes["divisibleBy"] ? ' step="' + attributes["divisibleBy"] + '" data-jsvf-divisibleBy="' + attributes["divisibleBy"] + '"' : '') +
			' value="' + value + '"/>';
	
	case "string":
		var format = (FORMAT_INPUT_TYPE[attributes["format"]] || "text");
		
		generic += (attributes["pattern"] ? ' pattern="' + escapeXMLAttribute(attributes["pattern"]) + '"' : '') +
			(typeOf(attributes["minLength"]) === "number" ? ' required="required" data-jsvf-minLength="' + attributes["minLength"] + '"' : '') +
			(typeOf(attributes["maxLength"]) === "number" ? ' maxlength="' + attributes["maxLength"] + '"' : '')
		;
		
		if (format === "textarea") {
			return '<textarea' + generic + '>' + value + '</textarea>';
		}
		return '<input type="' + format + '"' + generic + ' value="' + value + '"/>';
	
	case "object":
		return;  //TODO
	
	case "array":
		return;  //TODO
	
	case "schema":
		return '<div' + generic + ' data-jsvf-type-uri="' + type.getURI() + '">' + renderSchema(type, schema.getEnvironment().createInstance(value, uri)) + '</div>';
	
	default:
		return '<input' + generic + ' type="hidden" value=""/>';
	}
}