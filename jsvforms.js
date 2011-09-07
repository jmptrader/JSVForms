var O = {};
var JSV = require("../JSV").JSV;
var typeOf = JSV.typeOf;
var isJSONSchema = JSV.isJSONSchema;
var toArray = JSV.toArray;
var idCounter = 0;

if (!Object.keys) {
	Object.keys = function(obj) {
		var array = [], prop;
		for (prop in obj) {
			if (obj.hasOwnProperty(prop)) {
				array.push(prop);
			}
		}
		return array;
	};
}

Array.removeAll = function (arr, obj) {
	var index;
	while ((index = arr.indexOf(obj)) > -1) {
		arr.splice(index, 1);
	}
};

Array.addAll = function (arr, objs) {
	var x, xl;
	for (x = 0, xl = objs.length; x < xl; ++x) {
		if (arr.indexOf(objs[x]) === -1) {
			arr.push(objs[x]);
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

function renderSchema(schema, instance, id, classNames) {
	var html = [];
	var types = toArray(schema.getAttribute("type"));
	var title = schema.getAttribute("title");
	var description = schema.getAttribute("description");
	var defaultValue = schema.getAttribute("default");
	var instanceType;
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
			instance = schema.getEnvironment().createInstance(defaultValue);
			
			//determine type from value
			for (x = 0, xl = types.length; x < xl; ++x) {
				if ((typeOf(types[x]) === "string" && types[x] === instanceType) || (isJSONSchema(types[x]) && types[x].validate(instance).errors.length === 0)) {
					instanceType = types[x];
					break;
				}
			}
		} else {
			//use the first type as a generic default instance
			instanceType = types[0];
			instance = schema.getEnvironment().createInstance(TYPE_VALUES[instanceType], (instance && instance.getURI()));
		}
	} else {
		instanceType = instance.getType();
		
		//determine type from instance
		for (x = 0, xl = types.length; x < xl; ++x) {
			if ((typeOf(types[x]) === "string" && types[x] === instanceType) || (isJSONSchema(types[x]) && types[x].validate(instance).errors.length === 0)) {
				instanceType = types[x];
				break;
			}
		}
	}
	
	//render schema container
	html.push('<fieldset' + (id ? ' id="' + id + '"' : '') + ' class="jsvf-instance' + (classNames ? ' ' + classNames : '') + '" data-jsvf-schemauri="' + escapeXMLAttribute(schema.getURI()) + '">');
	
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
	
	html.push(renderInstance(schema, instanceType, instance));
	
	html.push('</fieldset>');  //jsvf-instance

	return html.join("");
}

function renderInstance(schema, type, instance) {
	var attributes = schema.getAttributes(),
		typeName = (isJSONSchema(type) ? "schema" : type),
		value = instance.getValue(),
		generic = 
			' class="jsvf-value jsvf-' + typeName + '"' +
			' data-jsvf-type="' + typeName + '"' +
			(attributes["readonly"] ? ' data-jsvf-readonly="true"' : ''),
		html, propertyNames, x, xl, propertySchema
	;
	
	switch (typeName) {
	case "null":
		return '<input' + generic + ' type="hidden" value="null"/>';
	
	case "boolean":
		return '<input' + generic + ' type="checkbox"' + (value ? ' checked="checked"' : '') + (attributes["readonly"] ? ' readonly="readonly"' : '') + '/>';
	
	case "number":
	case "integer":
		return '<input' + generic + ' type="number"' +
			(typeOf(attributes["minimum"]) === "number" ? ' min="' + attributes["minimum"] + '"' : '') +
			(typeOf(attributes["maximum"]) === "number" ? ' max="' + attributes["maximum"] + '"' : '') +
			(attributes["exclusiveMinimum"] ? ' data-jsvf-exclusiveMinimum="true"' : '') +
			(attributes["exclusiveMaximum"] ? ' data-jsvf-exclusiveMaximum="true"' : '') +
			(attributes["divisibleBy"] ? ' step="' + attributes["divisibleBy"] + '" data-jsvf-divisibleBy="' + attributes["divisibleBy"] + '"' : '') +
			(attributes["readonly"] ? ' readonly="readonly"' : '') + 
			' value="' + value + '"/>';
	
	case "string":
		var format = (FORMAT_INPUT_TYPE[attributes["format"]] || "text");
		
		generic += (attributes["pattern"] ? ' pattern="' + escapeXMLAttribute(attributes["pattern"]) + '"' : '') +
			(typeOf(attributes["minLength"]) === "number" ? ' required="required" data-jsvf-minLength="' + attributes["minLength"] + '"' : '') +
			(typeOf(attributes["maxLength"]) === "number" ? ' maxlength="' + attributes["maxLength"] + '"' : '') +
			(attributes["readonly"] ? ' readonly="readonly"' : '')
		;
		
		if (format === "textarea") {
			return '<textarea' + generic + '>' + value + '</textarea>';
		}
		return '<input type="' + format + '"' + generic + ' value="' + value + '"/>';
	
	case "object":
		html = [];
		propertyNames = (attributes["properties"] ? Object.keys(attributes["properties"]) : []);
		Array.addAll(propertyNames, Object.keys(value));
		
		html.push('<div' + generic + '>');
		html.push('<ul class="jsvf-properties">');
		for (x = 0, xl = propertyNames.length; x < xl; ++x) {
			html.push(renderProperty(schema, instance.getProperty(propertyNames[x]), propertyNames[x]));
		}
		html.push('</ul>');
		
		html.push('<button class="jsvf-add" type="button">Add</button>');
		
		html.push('</div>');
		
		return html.join("");
	
	case "array":
		html = [];
		html.push('<div' + generic + '>');
		html.push('<ol class="jsvf-items" start="0">');
		for (x = 0, xl = value.length; x < xl; ++x) {
			html.push(renderItem(schema, instance.getProperty(x), x));
		}
		html.push('</ol>');
		
		html.push('<button class="jsvf-add jsvf-add-item" type="button">Add</button>');
		
		html.push('</div>');
		
		return html.join("");
	
	case "schema":
		return '<div' + generic + ' data-jsvf-type-uri="' + type.getURI() + '">' + renderSchema(type, instance) + '</div>';
	
	default:
		return '<input' + generic + ' type="hidden" value=""/>';
	}
}

function renderProperty(schema, instance, name) {
	var attributes = schema.getAttributes(),
		propertySchema,
		defined = false,
		id = "jsvf-" + ++idCounter;
	
	//find schema for this property
	if (attributes["properties"]) {
		propertySchema = attributes["properties"][name];
		defined = true;
	}
	if (!propertySchema && attributes["patternProperties"]) {
		//TODO
	}
	if (!propertySchema) {
		propertySchema = attributes["additionalProperties"];
	}
	if (!isJSONSchema(propertySchema)) {
		propertySchema = schema.getEnvironment().createEmptySchema();
	}
	
	return '<li class="jsvf-property">' +
		'<label class="jsvf-property-name" for="' + id + '">' + (defined ? name : '<input type="text" value="' + escapeXMLAttribute(name) + '"/>') + '</label>' +
		renderSchema(propertySchema, instance, id, 'jsvf-property-value') +
		(propertySchema.getAttribute("required") !== true ? '<button class="jsvf-delete" type="button">Delete</button>' : '') +
		'</li>';
}

function renderItem(schema, instance, index) {
	var attributes = schema.getAttributes(),
		propertySchema;
	
	//find schema for this item
	propertySchema = attributes["items"];
	if (typeOf(propertySchema) === "array") {
		propertySchema = propertySchema[index];
	}
	if (!propertySchema) {
		propertySchema = attributes["additionalItems"];
	}
	if (!isJSONSchema(propertySchema)) {
		propertySchema = schema.getEnvironment().createEmptySchema();
	}
	
	return '<li class="jsvf-item">' +
		renderSchema(propertySchema, instance, null, "jsvf-item-value") +
		'<button class="jsvf-delete" type="button">Delete</button>' +
		'</li>';
}

function createForm(schema, instance, container) {
	var doc = (container ? (container.nodeType === Node.DOCUMENT_NODE ? container : container.ownerDocument) : document),
		form = doc.createElement("form");
	
	form.innerHTML = renderSchema(schema, instance);
	if (container) {
		container.appendChild(form);
	}
	
	form.schemaEnvironment = schema.getEnvironment();
	return form;
}

function hasClassName(element, className) {
	return String(element.className).split(" ").indexOf(className) > -1;
}

function outerHTML(element, html) {
	var container = element.ownerDocument.createElement("div");
	container.innerHTML = html;
	element.parentNode.replaceChild(container.children[0], element);
}

function appendHTML(element, html) {
	var container = element.ownerDocument.createElement("div");
	container.innerHTML = html;
	while (container.children.length) {
		element.appendChild(container.children[0]);
	}
}

function getChildrenByClassName(children, className) {
	var x, xl, results = [];
	if (children.children) {
		children = children.children;
	}
	for (x = 0, xl = children.length; x < xl; ++x) {
		if (hasClassName(children[x], className)) {
			results.push(children[x]);
		}
	}
	return results;
}

function onTypeChange(event) {
	var target = event.target;
	
	if (hasClassName(target, "jsvf-type")) {
		var newType = target.value;
		var valueElement = getChildrenByClassName(target.parentNode, "jsvf-value")[0];
		var env = target.form.schemaEnvironment;
		var schema = env.findSchema(target.parentNode.getAttribute("data-jsvf-schemauri"));
		
		//if type is a schema URI, replace with actual schema
		if (TYPE_VALUES[newType] === undefined) {
			newType = env.findSchema(newType) || newType;
		}
		
		outerHTML(valueElement, renderInstance(schema, newType, env.createInstance(TYPE_VALUES[newType])));
	}
}

function onButtonActivate(event) {
	var target = event.target;
	var targetClassNames = String(target.className).split(" ");
	
	if (targetClassNames.indexOf("jsvf-delete") > -1) {
		target.parentNode.parentNode.removeChild(target.parentNode);
		//TODO: Update Add button
	} else if (targetClassNames.indexOf("jsvf-add-item") > -1) {
		var env = target.form.schemaEnvironment;
		var schema = env.findSchema(target.parentNode.parentNode.getAttribute("data-jsvf-schemauri"));
		var itemsElement = getChildrenByClassName(target.parentNode, "jsvf-items")[0];
		var index = itemsElement.children.length;
		appendHTML(itemsElement, renderItem(schema, null, index));
		//TODO: Update Add button
	} else if (targetClassNames.indexOf("jsvf-add-property") > -1) {
		//TODO
	}
}

document.addEventListener("change", onTypeChange);
document.addEventListener("click", onButtonActivate);