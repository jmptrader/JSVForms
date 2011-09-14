var O = {};
var JSV = require("../JSV").JSV;
var typeOf = JSV.typeOf;
var isJSONSchema = JSV.isJSONSchema;
var toArray = JSV.toArray;
var mapArray = JSV.mapArray;
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

Array.remove = function (arr, obj) {
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

Array.removeAll = function (arr, objs) {
	var x, xl;
	for (x = 0, xl = objs.length; x < xl; ++x) {
		Array.remove(arr, objs[x]);
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
		Array.remove(types, "any");
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
		html, propertyNames, optionalNames, x, xl, properties
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
		propertyNames = [];
		properties = attributes["properties"];
		if (properties) {
			for (x in properties) {
				if (properties[x] !== O[x]) {
					if (!properties[x].getAttribute("optional") || value[x] !== O[x]) {
						propertyNames.push(x);
					}
				}
			}
		}
		Array.addAll(propertyNames, Object.keys(value));
		
		html.push('<div' + generic + '>');
		html.push('<ul class="jsvf-properties">');
		for (x = 0, xl = propertyNames.length; x < xl; ++x) {
			html.push(renderObjectProperty(schema, instance.getProperty(propertyNames[x]), propertyNames[x]));
		}
		html.push('</ul>');
		
		html.push(renderObjectAddMenu(schema, propertyNames));
		
		html.push('</div>');
		
		return html.join("");
	
	case "array":
		html = [];
		html.push('<div' + generic + '>');
		html.push('<ol class="jsvf-properties" start="0">');
		for (x = 0, xl = value.length; x < xl; ++x) {
			html.push(renderArrayProperty(schema, instance.getProperty(x), x));
		}
		html.push('</ol>');
		
		//TODO: Only add "Add" button if instance is allowed to have more items
		html.push('<button class="jsvf-add jsvf-add-property" type="button">Add</button>');
		
		html.push('</div>');
		
		return html.join("");
	
	case "schema":
		return '<div' + generic + ' data-jsvf-type-uri="' + type.getURI() + '">' + renderSchema(type, instance) + '</div>';
	
	default:
		return '<input' + generic + ' type="hidden" value=""/>';
	}
}

function renderObjectProperty(schema, instance, name) {
	var attributes = schema.getAttributes(),
		propertySchema,
		defined = false,
		id = "jsvf-" + ++idCounter;
	
	//find schema for this property
	if (attributes["properties"]) {
		propertySchema = attributes["properties"][name];
		if (propertySchema) {
			defined = true;
		}
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
	
	return '<li class="jsvf-property" data-jsvf-property-name="' + name + '">' +
		'<label class="jsvf-property-name" for="' + id + '">' + (defined ? name : '<input class="jsvf-property-name-value" type="text" required="required" value="' + escapeXMLAttribute(name) + '"/>') + '</label>' +
		renderSchema(propertySchema, instance, id, 'jsvf-property-value') +
		(propertySchema.getAttribute("required") !== true ? '<button class="jsvf-delete" type="button">Delete</button>' : '') +
		'</li>';
}

function renderObjectAddMenu(schema, excludeProperties) {
	excludeProperties = excludeProperties || {};
	var html = [];
	var properties = Object.keys(schema.getAttribute("properties") || {});
	Array.removeAll(properties, excludeProperties);
	
	html.push('<menu class="jsvf-add ' + (properties.length ? 'jsvf-add-multipleoptions' : 'jsvf-add-singleoption') + '" label="Add">');
	if (properties.length) {
		for (x = 0, xl = properties.length; x < xl; ++x) {
			html.push('<button class="jsvf-add-property" type="button" value="' + properties[x] + '">' + properties[x] + '</button>');
		}
		html.push('<hr/>');
	}
	html.push('<button class="jsvf-add-property" type="button" value="">Additional...</button>');
	html.push('</menu>');
	
	return html.join("");
}

function renderArrayProperty(schema, instance, index) {
	var attributes = schema.getAttributes(),
		propertySchema,
		id = "jsvf-" + ++idCounter;
	
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
	
	return '<li class="jsvf-property" data-jsvf-property-name="' + index + '">' +
		'<label class="jsvf-property-name" for="' + id + '">' + index + '</label>' +
		renderSchema(propertySchema, instance, id, "jsvf-property-value") +
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
	var firstChild = container.children[0];
	while (container.children.length) {
		element.appendChild(container.children[0]);
	}
	return firstChild;
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

function findParentAttribute(element, attributeName) {
	while (element && !element.hasAttribute(attributeName)) {
		element = element.parentNode;
	}
	return element && element.getAttribute(attributeName);
}

function findParentChildByClassName(element, className) {
	var parent = element.parentNode, children;
	while (parent) {
		for (children = parent.children, x = 0, xl = children.length; x < xl; ++x) {
			if (hasClassName(children[x], className)) {
				return children[x];
			}
		}
		parent = parent.parentNode;
	}
}

function findFirstChildByClassName(element, className, stopClassName) {
	var queue = toArray(element.children);
	var classNames;
	while (queue.length) {
		element = queue.shift();
		classNames = String(element.className).split(" ");
		if (classNames.indexOf(className) > -1) {
			return element;
		} else if (!stopClassName || classNames.indexOf(stopClassName) === -1) {
			queue.push.apply(queue, element.children);
		}
	}
}

function findChildrenByClassName(element, className, stopClassName) {
	var result = [];
	var queue = toArray(element.children);
	var classNames;
	while (queue.length) {
		element = queue.shift();
		classNames = String(element.className).split(" ");
		if (classNames.indexOf(className) > -1) {
			result.push(element);
		} else if (!stopClassName || classNames.indexOf(stopClassName) === -1) {
			queue.push.apply(queue, element.children);
		}
	}
	return result;
}

function findParentByTagName(element, tagName) {
	while (element && element.tagName.toLowerCase() !== tagName.toLowerCase()) {
		element = element.parentNode;
	}
	return element;
}

function findParentByClassName(element, className) {
	while (element && !hasClassName(element, className)) {
		element = element.parentNode;
	}
	return element;
}

function updateInstanceType(instanceElement, type, instance) {
	var env = findParentByTagName(instanceElement, "form").schemaEnvironment;
	var valueElement = findFirstChildByClassName(instanceElement, "jsvf-value", "jsvf-instance");
	var schema = env.findSchema(instanceElement.getAttribute("data-jsvf-schemauri"));
	
	//if type is a schema URI, replace with actual schema
	if (!TYPE_VALUES.hasOwnProperty(type)) {
		type = env.findSchema(type) || type;
	}
	
	outerHTML(valueElement, renderInstance(schema, type, instance || env.createInstance(TYPE_VALUES[type])));
}

function updateObjectAddMenu(instanceElement) {
	var env = findParentByTagName(instanceElement, "form").schemaEnvironment;
	var schema = env.findSchema(instanceElement.getAttribute("data-jsvf-schemauri"));
	var propertyNames = mapArray(findChildrenByClassName(instanceElement, "jsvf-property", "jsvf-instance"), function (element) {
		return element.getAttribute("data-jsvf-property-name");
	});
	var menuElement = findFirstChildByClassName(instanceElement, "jsvf-add", "jsvf-instance");
	
	outerHTML(menuElement, renderObjectAddMenu(schema, propertyNames));
}

function updateArrayPropertyNames(instanceElement) {
	var propertyElements = findFirstChildByClassName(instanceElement, "jsvf-properties", "jsvf-instance").children;
	for (var x = 0, xl = propertyElements.length; x < xl; ++x) {
		propertyElements[x].setAttribute("data-jsvf-property-name", String(x));
		findFirstChildByClassName(propertyElements[x], "jsvf-property-name", "jsvf-instance").innerHTML = String(x);
	}
}

function updateInstanceRemove(instanceElement, target) {
	var targetType = typeOf(target);
	var name, element;
	
	if (targetType === "string" || targetType === "number") {
		name = target;
		//TODO: Find element by name
	} else if (target) {
		//assume target is the element (property) to remove
		name = target.getAttribute("data-jsvf-property-name");
		element = target;
	}
	
	if (element) {
		//remove element
		element.parentNode.removeChild(element);
		
		//update instance
		var type = findFirstChildByClassName(instanceElement, "jsvf-value", "jsvf-instance").getAttribute("data-jsvf-type");
		if (type === "object" || type === "schema") {
			updateObjectAddMenu(instanceElement);
		} else if (type === "array") {
			updateArrayPropertyNames(instanceElement);
			//TODO: If there is no "Add" button, and additional items are allowed, then add "Add" button
		}
	}
}

function updateInstanceAdd(instanceElement, name, instance) {
	var env = findParentByTagName(instanceElement, "form").schemaEnvironment;
	var schema = env.findSchema(instanceElement.getAttribute("data-jsvf-schemauri"));
	var propertiesElement = findFirstChildByClassName(instanceElement, "jsvf-properties", "jsvf-instance");
	var type = findFirstChildByClassName(instanceElement, "jsvf-value", "jsvf-instance").getAttribute("data-jsvf-type");
	
	if (type === "object" || type === "schema") {
		var propertyElement = appendHTML(propertiesElement, renderObjectProperty(schema, instance, name));
		var propertyNameInputElement = findFirstChildByClassName(propertyElement, "jsvf-property-name-value", "jsvf-instance");
		updateObjectAddMenu(instanceElement);
		if (propertyNameInputElement) {
			propertyNameInputElement.focus();
		}
	} else if (type === "array") {
		appendHTML(propertiesElement, renderArrayProperty(schema, instance, name));
		//TODO: If there is an "Add" button, and additional items are not allowed, then remove "Add" button
	}
}

function onInputChange(event) {
	var target = event.target;
	var targetClassNames = String(target.className).split(" ");
	
	if (targetClassNames.indexOf("jsvf-type") > -1) {
		var instanceElement = findParentByClassName(target, "jsvf-instance");
		var type = target.value;
		updateInstanceType(instanceElement, type, null);
	} else if (targetClassNames.indexOf("jsvf-property-name-value") > -1) {
		var propertyElement = findParentByClassName(target, "jsvf-property");
		propertyElement.setAttribute("data-jsvf-property-name", target.value);
		//TODO: Apply a different schema if needed
	}
}

function onButtonActivate(event) {
	var target = event.target;
	var targetClassNames = String(target.className).split(" ");
	
	if (targetClassNames.indexOf("jsvf-delete") > -1) {
		var instanceElement = findParentByClassName(target, "jsvf-instance");
		var propertyElement = findParentByClassName(target, "jsvf-property");
		updateInstanceRemove(instanceElement, propertyElement);
	} else if (targetClassNames.indexOf("jsvf-add-property") > -1) {
		var instanceElement = findParentByClassName(target, "jsvf-instance");
		var type = findFirstChildByClassName(instanceElement, "jsvf-value", "jsvf-instance").getAttribute("data-jsvf-type");
		var name;
		if (type === "object" || type === "schema") {
			name = target.value;
		} else if (type === "array") {
			name = findFirstChildByClassName(instanceElement, "jsvf-properties", "jsvf-instance").children.length;
		}
		updateInstanceAdd(instanceElement, name, null);
	}
}

document.addEventListener("change", onInputChange);
document.addEventListener("click", onButtonActivate);