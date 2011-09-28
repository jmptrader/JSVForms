env = JSV.createEnvironment();
instance = {};

/* Schemas */

//Type Tests

env.createSchema({
	"title" : "Type Tests",
	"description" : "Tests rendering of the type attribute.",
	"type" : "object",
	"properties" : {
		"empty" : {},
		"any" : {"type" : "any"},
		"null" : {"type" : "null"},
		"boolean" : {"type" : "boolean"},
		"integer" : {"type" : "integer"},
		"number" : {"type" : "number"},
		"string" : {"type" : "string"},
		"object" : {"type" : "object"},
		"array" : {"type" : "array"}
	},
	"additionalProperties" : false,
	"required" : true
}, null, "types.schema.json");

//Boolean Tests

env.createSchema({
	"title" : "Boolean Tests",
	"description" : "Tests if boolean attributes are properly rendered.",
	"type" : "object",
	"properties" : {
		"simple" : {"type" : "boolean"},
		"simple + checked" : {"type" : "boolean"},
		"simple + readonly" : {"type" : "boolean", "readonly" : true}
	},
	"additionalProperties" : false,
	"required" : true
}, null, "boolean.schema.json");

instance["boolean"] = {
	"simple + checked" : true
};

//Number Tests

env.createSchema({
	"title" : "Number Tests",
	"description" : "Tests if number attributes are properly rendered.",
	"type" : "object",
	"properties" : {
		"number" : {"type" : "number"},
		"integer" : {"type" : "integer"},
		"min/max" : {
			"type" : "number",
			"minimum" : 2,
			"maximum" : 8,
			"exclusiveMinimum" : true,
			"exclusiveMaximum" : false
		},
		"divisibleBy" : {
			"type" : "number",
			"divisibleBy" : 2
		}
	},
	"additionalProperties" : false,
	"required" : true
}, null, "number.schema.json");

instance["number"] = {
	"number" : 5
};

//String Tests

env.createSchema({
	"title" : "String Tests",
	"description" : "Tests if string attributes are properly rendered.",
	"type" : "object",
	"properties" : {
		"simple" : {"type" : "string"},
		"pattern(^[A-Z]+$)" : {
			"type" : "string",
			"pattern" : "^[A-Z]+$"
		},
		"min/max" : {
			"type" : "string",
			"minLength" : 6,
			"maxLength" : 8
		},
		"format(uri)" : {
			"type" : "string",
			"format" : "uri"
		}
	},
	"additionalProperties" : false,
	"required" : true
}, null, "string.schema.json");

instance["string"] = {
	"simple" : "string"
};

//Object Tests

env.createSchema({
	"title" : "Object Tests",
	"description" : "Tests if object properties get the correct schema, and object attributes are properly enforced." +
		"With the exception of the 'defined' properties, properties that start with letters are strings, numbers are numeric, and others are booleans.",
	"type" : "object",
	"properties" : {
		"defined" : {"type" : "string"},
		"defined + required" : {"required" : true}
	},
	"patternProperties" : {
		"^[0-9]" : {"type" : "number"},
		"^[A-Za-z]" : {"type" : "string"}
	},
	"additionalProperties" : {"type" : "boolean"},
	"required" : true
}, null, "object.schema.json");

instance["object"] = {
	"a" : "z",
	"0" : 1,
	"!" : true
};

//Array Tests

env.createSchema({
	"title" : "Array Tests",
	"description" : "Tests if array items get the correct schema, and array attributes are properly enforced.",
	"type" : "object",
	"properties" : {
		"simple" : {
			"type" : "array",
			"items" : {"type" : "string"}
		},
		"tuple" : {
			"type" : "array",
			"items" : [
				{"type":"number"},
				{"type":"boolean"},
				{"type":"string"}
			],
			"additionalItems" : false
		},
		"tuple + additional" : {
			"type" : "array",
			"items" : [
				{"type":"number"},
				{"type":"boolean"},
				{"type":"string"}
			],
			"additionalItems" : {"type":"any"}
		},
		"additional" : {
			"type" : "array",
			"additionalItems" : {"type":"string"}
		},
		"none" : {
			"type" : "array",
			"additionalItems" : false
		},
		"min/max" : {
			"type" : "array",
			"minItems" : 2,
			"maxItems" : 4
		},
		"unique" : {
			"type" : "array",
			"uniqueItems" : true
		}
	},
	"additionalProperties" : false,
	"required" : true
}, null, "array.schema.json");

//Optional Tests

env.createSchema({
	"title" : "Optional Schema",
	"description" : "Tests if the optional attribute is respected.",
	"optional" : true
}, null, "optional.schema.json");

//
// Framework
//

testsSchema = env.createSchema({
	"title" : "Unit Tests",
	"description" : "Renders all tests for JSVForms.",
	"type" : "object",
	"properties" : {
		"types" : {"$ref" : "types.schema.json"},
		"boolean" : {"$ref" : "boolean.schema.json"},
		"number" : {"$ref" : "number.schema.json"},
		"string" : {"$ref" : "string.schema.json"},
		"object" : {"$ref" : "object.schema.json"},
		"array" : {"$ref" : "array.schema.json"},
		"optional" : {"$ref" : "optional.schema.json"}
	},
	"additionalProperties" : false,
	"required" : true
}, null, "schema.json");

window.addEventListener("load", function () {
	createForm(testsSchema, env.createInstance(instance), document.body);
});