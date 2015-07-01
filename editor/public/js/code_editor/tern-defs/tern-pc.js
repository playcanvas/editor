editor.once('load', function () {
    var def = {
    "!name": "pc",
    "pc": {
        "!type": "fn()",
        "!doc": "Root namespace for the PlayCanvas Engine",
        "config": {
            "!type": "fn()",
            "!doc": "Configuration data made available to the application from the server",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#config"
        },
        "makeArray": {
            "!type": "fn(arr: object) -> []",
            "!doc": "Convert an array-like object into a normal array.\nFor example, this is useful for converting the arguments object into an array.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#makeArray"
        },
        "type": {
            "!type": "fn(obj: object) -> string",
            "!doc": "Extended typeof() function, returns the type of the object.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#type"
        },
        "extend": {
            "!type": "fn(target: object, ex: object) -> object",
            "!doc": "\n\npc.extend(A,B);\nA.a();\n// logs \"a\"\nA.b();\n// logs \"b\"\n</pre></code>",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#extend"
        },
        "isDefined": {
            "!type": "fn(o: object)",
            "!doc": "Return true if the Object is not undefined",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#isDefined"
        },
        "Color": {
            "!type": "fn(r: number, g: number, b: number, a?: number)",
            "!doc": "Representation of an RGBA color",
            "prototype": {
                "clone": {
                    "!type": "fn() -> +pc.Color",
                    "!doc": "Returns a clone of the specified color.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Color.html#clone"
                },
                "copy": {
                    "!type": "fn(rhs: +pc.Color) -> +pc.Color",
                    "!doc": "Copies the contents of a source color to a destination color.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Color.html#copy"
                },
                "set": {
                    "!type": "fn(r: number, g: number, b: number, a?: number) -> +pc.Color",
                    "!doc": "Assign values to the color components, including alpha",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Color.html#set"
                },
                "fromString": {
                    "!type": "fn(hex: string) -> +pc.Color",
                    "!doc": "Set the values of the color from a string representation '#11223344' or '#112233'.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Color.html#fromString"
                },
                "r": {
                    "!type": "number",
                    "!doc": "The red component of the color.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Color.html#r"
                },
                "g": {
                    "!type": "number",
                    "!doc": "The blue component of the color.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Color.html#g"
                },
                "b": {
                    "!type": "number",
                    "!doc": "The blue component of the color.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Color.html#b"
                },
                "a": {
                    "!type": "number",
                    "!doc": "The alpha component of the color.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Color.html#a"
                }
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Color.html"
        },
        "guid": {
            "!type": "fn()",
            "!doc": "Basically a very large random number (128-bit) which means the probability of creating two that clash is vanishingly small. GUIDs are used as the unique identifiers for Entities.",
            "create": {
                "!type": "fn() -> string",
                "!doc": "Create an RFC4122 version 4 compliant GUID"
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#guid"
        },
        "createURI": {
            "!type": "fn(options: object) -> string",
            "!doc": "Create a URI object from constiuent parts",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#createURI"
        },
        "URI": {
            "!type": "fn(uri: string)",
            "!doc": "A URI object",
            "prototype": {
                "scheme": {
                    "!type": "fn()",
                    "!doc": "The scheme. (e.g. http)",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.URI.html#scheme"
                },
                "authority": {
                    "!type": "fn()",
                    "!doc": "The authority. (e.g. www.example.com)",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.URI.html#authority"
                },
                "path": {
                    "!type": "fn()",
                    "!doc": "The path. (e.g. /users/example)",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.URI.html#path"
                },
                "query": {
                    "!type": "fn()",
                    "!doc": "The query, the section after a ?. (e.g. search=value)",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.URI.html#query"
                },
                "fragment": {
                    "!type": "fn()",
                    "!doc": "The fragment, the section after a #",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.URI.html#fragment"
                },
                "getQuery": {
                    "!type": "fn()",
                    "!doc": "Returns the query parameters as an Object",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.URI.html#getQuery"
                },
                "setQuery": {
                    "!type": "fn(params: object)",
                    "!doc": "Set the query section of the URI from a Object",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.URI.html#setQuery"
                }
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.URI.html"
        },
        "inherits": {
            "!type": "fn(Self: fn(), Super: fn()) -> fn()",
            "!doc": "Implementaton of inheritance for Javascript objects e.g. Class can access all of Base's function prototypes The super classes prototype is available on the derived class as _super",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#inherits"
        },
        "path": {
            "!type": "fn()",
            "!doc": "",
            "delimiter": {
                "!type": "fn()",
                "!doc": "The character that separates path segments"
            },
            "join": {
                "!type": "fn(one: string, two: string)",
                "!doc": "Join two sections of file path together, insert a delimiter if needed."
            },
            "split": {
                "!type": "fn()",
                "!doc": "Split the pathname path into a pair [head, tail] where tail is the final part of the path after the last delimiter and head is everything leading up to that. tail will never contain a slash"
            },
            "getBasename": {
                "!type": "fn() -> string",
                "!doc": "Return the basename of the path. That is the second element of the pair returned by passing path into pc.path.split."
            },
            "getDirectory": {
                "!type": "fn(path: string)",
                "!doc": "Get the directory name from the path. This is everything up to the final instance of pc.path.delimiter"
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#path"
        },
        "string": {
            "!type": "fn()",
            "!doc": "",
            "ASCII_LOWERCASE": {
                "!type": "fn()",
                "!doc": "All lowercase letters"
            },
            "ASCII_UPPERCASE": {
                "!type": "fn()",
                "!doc": "All uppercase letters"
            },
            "ASCII_LETTERS": {
                "!type": "fn()",
                "!doc": "All ASCII letters"
            },
            "format": {
                "!type": "fn(s: string, arguments?: object) -> string",
                "!doc": "Return a string with {n} replaced with the n-th argument"
            },
            "startsWith": {
                "!type": "fn(s: string, subs: string) -> Boolean",
                "!doc": "Check if a string s starts with another string subs"
            },
            "endsWith": {
                "!type": "fn(s: string, subs: string) -> Boolean",
                "!doc": "Check if a string s ends with another string subs"
            },
            "toBool": {
                "!type": "fn(s: string, strict?: Boolean) -> Boolean",
                "!doc": "Convert a string value to a boolean. In non-strict mode (the default), 'true' is converted to true, all other values are converted to false. In strict mode, 'true' is converted to true, 'false' is converted to false, all other values will throw an Exception."
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#string"
        },
        "debug": {
            "!type": "fn()",
            "!doc": "",
            "display": {
                "!type": "fn()",
                "!doc": "Display an object and it's data in a table on the page"
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#debug"
        },
        "events": {
            "!type": "fn()",
            "!doc": "Extend any normal object with events",
            "attach": {
                "!type": "fn(target: object) -> object",
                "!doc": "Attach event methods 'on', 'off', 'fire' and 'hasEvent' to the target object"
            },
            "on": {
                "!type": "fn(name: string, callback: fn(), scope?: object)",
                "!doc": "Attach an event handler to an event"
            },
            "off": {
                "!type": "fn(name: string, callback?: fn(), scope?: object)",
                "!doc": "Detach an event handler from an event. If callback is not provided then all callbacks are unbound from the event, if scope is not provided then all events with the callback will be unbound."
            },
            "fire": {
                "!type": "fn(name: object)",
                "!doc": "Fire an event, all additional arguments are passed on to the event listener"
            },
            "hasEvent": {
                "!type": "fn(name: string)",
                "!doc": "Test if there are any handlers bound to an event name"
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#events"
        },
        "math": {
            "!type": "fn()",
            "!doc": "",
            "DEG_TO_RAD": {
                "!type": "fn()",
                "!doc": "Conversion factor between degrees and radians"
            },
            "RAD_TO_DEG": {
                "!type": "fn()",
                "!doc": "Conversion factor between degrees and radians"
            },
            "clamp": {
                "!type": "fn(value: number, min: number, max: number) -> number",
                "!doc": "Clamp a number between min and max inclusive."
            },
            "intToBytes24": {
                "!type": "fn(i: number)",
                "!doc": "Convert an 24 bit integer into an array of 3 bytes."
            },
            "intToBytes32": {
                "!type": "fn(i: number)",
                "!doc": "Convert an 32 bit integer into an array of 4 bytes."
            },
            "bytesToInt24": {
                "!type": "fn(r: number, g: number, b: number)",
                "!doc": "Convert 3 8 bit Numbers into a single unsigned 24 bit Number"
            },
            "bytesToInt32": {
                "!type": "fn(r: number, g: number, b: number, a: number)",
                "!doc": "Convert 4 1-byte Numbers into a single unsigned 32bit Number"
            },
            "lerp": {
                "!type": "fn(a: number, b: number, alpha: number)",
                "!doc": "Calculates the linear interpolation of two numbers."
            },
            "lerpAngle": {
                "!type": "fn(a: number, b: number, alpha: number)",
                "!doc": "Calculates the linear interpolation of two angles ensuring that interpolation is correctly performed across the 360 to 0 degree boundary. Angles are supplied in degrees."
            },
            "powerOfTwo": {
                "!type": "fn(x: number) -> Boolean",
                "!doc": "Returns true if argument is a power-of-two and false otherwise."
            },
            "random": {
                "!type": "fn(min: number, max: number) -> number",
                "!doc": "Return a pseudo-random number between min and max. The number generated is in the range [min, max), that is inclusive of the minimum but exclusive of the maximum."
            },
            "smoothstep": {
                "!type": "fn(min: number, max: number, x: number) -> number",
                "!doc": "The function interpolates smoothly between two input values based on a third one that should be between the first two. The returned value is clamped between 0 and 1. The slope (i.e. derivative) of the smoothstep function starts at 0 and ends at 0. This makes it easy to create a sequence of transitions using smoothstep to interpolate each segment rather than using a more sophisticated or expensive interpolation technique. See http://en.wikipedia.org/wiki/Smoothstep for more details."
            },
            "smootherstep": {
                "!type": "fn(min: number, max: number, x: number) -> number",
                "!doc": "An improved version of the pc.math.smoothstep function which has zero 1st and 2nd order derivatives at t=0 and t=1. See http://en.wikipedia.org/wiki/Smoothstep for more details."
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#math"
        },
        "Vec3": {
            "!type": "fn(x?: number, y?: number, z?: number)",
            "!doc": "A 3-dimensional vector.",
            "prototype": {
                "add": {
                    "!type": "fn(rhs: +pc.Vec3) -> +pc.Vec3",
                    "!doc": "Adds a 3-dimensional vector to another in place.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Vec3.html#add"
                },
                "add2": {
                    "!type": "fn(lhs: +pc.Vec3, rhs: +pc.Vec3) -> +pc.Vec3",
                    "!doc": "Adds two 3-dimensional vectors together and returns the result.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Vec3.html#add2"
                },
                "clone": {
                    "!type": "fn() -> +pc.Vec3",
                    "!doc": "Returns an identical copy of the specified 3-dimensional vector.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Vec3.html#clone"
                },
                "copy": {
                    "!type": "fn(rhs: +pc.Vec3) -> +pc.Vec3",
                    "!doc": "Copied the contents of a source 3-dimensional vector to a destination 3-dimensional vector.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Vec3.html#copy"
                },
                "cross": {
                    "!type": "fn(lhs: +pc.Vec3, rhs: +pc.Vec3) -> +pc.Vec3",
                    "!doc": "Returns the result of a cross product operation performed on the two specified 3-dimensional vectors.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Vec3.html#cross"
                },
                "dot": {
                    "!type": "fn(rhs: +pc.Vec3) -> number",
                    "!doc": "Returns the result of a dot product operation performed on the two specified 3-dimensional vectors.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Vec3.html#dot"
                },
                "equals": {
                    "!type": "fn(rhs: +pc.Vec3) -> Booean",
                    "!doc": "Reports whether two vectors are equal.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Vec3.html#equals"
                },
                "length": {
                    "!type": "fn() -> number",
                    "!doc": "Returns the magnitude of the specified 3-dimensional vector.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Vec3.html#length"
                },
                "lengthSq": {
                    "!type": "fn() -> number",
                    "!doc": "Returns the magnitude squared of the specified 3-dimensional vector.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Vec3.html#lengthSq"
                },
                "lerp": {
                    "!type": "fn(lhs: +pc.Vec3, rhs: +pc.Vec3, alpha: number) -> +pc.Vec3",
                    "!doc": "Returns the result of a linear interpolation between two specified 3-dimensional vectors.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Vec3.html#lerp"
                },
                "mul": {
                    "!type": "fn(rhs: +pc.Vec3) -> +pc.Vec3",
                    "!doc": "Returns the result of multiplying the specified 3-dimensional vectors together.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Vec3.html#mul"
                },
                "mul2": {
                    "!type": "fn(lhs: +pc.Vec3, rhs: +pc.Vec3) -> +pc.Vec3",
                    "!doc": "Returns the result of multiplying the specified 3-dimensional vectors together.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Vec3.html#mul2"
                },
                "normalize": {
                    "!type": "fn() -> +pc.Vec3",
                    "!doc": "Returns the specified 3-dimensional vector copied and converted to a unit vector.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Vec3.html#normalize"
                },
                "project": {
                    "!type": "fn(rhs: +pc.Vec3) -> +pc.Vec3",
                    "!doc": "Projects this 3-dimensional vector onto the specified vector.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Vec3.html#project"
                },
                "scale": {
                    "!type": "fn(scalar: number) -> +pc.Vec3",
                    "!doc": "Scales each dimension of the specified 3-dimensional vector by the supplied scalar value.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Vec3.html#scale"
                },
                "set": {
                    "!type": "fn(x: number, y: number, z: number)",
                    "!doc": "Sets the specified 3-dimensional vector to the supplied numerical values.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Vec3.html#set"
                },
                "sub": {
                    "!type": "fn(rhs: +pc.Vec3) -> +pc.Vec3",
                    "!doc": "Subtracts a 3-dimensional vector from another in place.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Vec3.html#sub"
                },
                "sub2": {
                    "!type": "fn(lhs: +pc.Vec3, rhs: +pc.Vec3) -> +pc.Vec3",
                    "!doc": "Subtracts two 3-dimensional vectors from one another and returns the result.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Vec3.html#sub2"
                },
                "x": {
                    "!type": "number",
                    "!doc": "The first element of the vector.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Vec3.html#x"
                },
                "y": {
                    "!type": "number",
                    "!doc": "The second element of the vector.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Vec3.html#y"
                },
                "z": {
                    "!type": "number",
                    "!doc": "The third element of the vector.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Vec3.html#z"
                }
            },
            "BACK": {
                "!type": "+pc.Vec3",
                "!doc": "A constant vector set to [0, 0, 1]."
            },
            "DOWN": {
                "!type": "+pc.Vec3",
                "!doc": "A constant vector set to [0, -1, 0]."
            },
            "FORWARD": {
                "!type": "+pc.Vec3",
                "!doc": "A constant vector set to [0, 0, -1]."
            },
            "LEFT": {
                "!type": "+pc.Vec3",
                "!doc": "A constant vector set to [-1, 0, 0]."
            },
            "ONE": {
                "!type": "+pc.Vec3",
                "!doc": "A constant vector set to [1, 1, 1]."
            },
            "RIGHT": {
                "!type": "+pc.Vec3",
                "!doc": "A constant vector set to [1, 0, 0]."
            },
            "UP": {
                "!type": "+pc.Vec3",
                "!doc": "A constant vector set to [0, 1, 0]."
            },
            "ZERO": {
                "!type": "+pc.Vec3",
                "!doc": "A constant vector set to [0, 0, 0]."
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Vec3.html"
        },
        "Vec2": {
            "!type": "fn()",
            "!doc": "A 2-dimensional vector.",
            "prototype": {
                "add": {
                    "!type": "fn(rhs: +pc.Vec2) -> +pc.Vec2",
                    "!doc": "Adds a 2-dimensional vector to another in place.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Vec2.html#add"
                },
                "add2": {
                    "!type": "fn(lhs: +pc.Vec2, rhs: +pc.Vec2) -> +pc.Vec2",
                    "!doc": "Adds two 2-dimensional vectors together and returns the result.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Vec2.html#add2"
                },
                "clone": {
                    "!type": "fn() -> +pc.Vec2",
                    "!doc": "Returns an identical copy of the specified 2-dimensional vector.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Vec2.html#clone"
                },
                "copy": {
                    "!type": "fn(rhs: +pc.Vec2) -> +pc.Vec2",
                    "!doc": "Copied the contents of a source 2-dimensional vector to a destination 2-dimensional vector.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Vec2.html#copy"
                },
                "dot": {
                    "!type": "fn(rhs: +pc.Vec2) -> number",
                    "!doc": "Returns the result of a dot product operation performed on the two specified 2-dimensional vectors.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Vec2.html#dot"
                },
                "equals": {
                    "!type": "fn(rhs: +pc.Vec2) -> Booean",
                    "!doc": "Reports whether two vectors are equal.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Vec2.html#equals"
                },
                "length": {
                    "!type": "fn() -> number",
                    "!doc": "Returns the magnitude of the specified 2-dimensional vector.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Vec2.html#length"
                },
                "lengthSq": {
                    "!type": "fn() -> number",
                    "!doc": "Returns the magnitude squared of the specified 2-dimensional vector.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Vec2.html#lengthSq"
                },
                "lerp": {
                    "!type": "fn(lhs: +pc.Vec2, rhs: +pc.Vec2, alpha: number) -> +pc.Vec2",
                    "!doc": "Returns the result of a linear interpolation between two specified 2-dimensional vectors.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Vec2.html#lerp"
                },
                "mul": {
                    "!type": "fn(rhs: +pc.Vec2) -> +pc.Vec2",
                    "!doc": "Returns the result of multiplying the specified 2-dimensional vectors together.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Vec2.html#mul"
                },
                "mul2": {
                    "!type": "fn(lhs: +pc.Vec2, rhs: +pc.Vec2) -> +pc.Vec2",
                    "!doc": "Returns the result of multiplying the specified 2-dimensional vectors together.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Vec2.html#mul2"
                },
                "normalize": {
                    "!type": "fn() -> +pc.Vec2",
                    "!doc": "Returns the specified 2-dimensional vector copied and converted to a unit vector.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Vec2.html#normalize"
                },
                "scale": {
                    "!type": "fn(scalar: number) -> +pc.Vec2",
                    "!doc": "Scales each dimension of the specified 2-dimensional vector by the supplied scalar value.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Vec2.html#scale"
                },
                "set": {
                    "!type": "fn(x: number, y: number)",
                    "!doc": "Sets the specified 2-dimensional vector to the supplied numerical values.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Vec2.html#set"
                },
                "sub": {
                    "!type": "fn(rhs: +pc.Vec2) -> +pc.Vec2",
                    "!doc": "Subtracts a 2-dimensional vector from another in place.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Vec2.html#sub"
                },
                "sub2": {
                    "!type": "fn(lhs: +pc.Vec2, rhs: +pc.Vec2) -> +pc.Vec2",
                    "!doc": "Subtracts two 2-dimensional vectors from one another and returns the result.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Vec2.html#sub2"
                },
                "x": {
                    "!type": "number",
                    "!doc": "The first element of the vector.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Vec2.html#x"
                },
                "y": {
                    "!type": "number",
                    "!doc": "The second element of the vector.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Vec2.html#y"
                }
            },
            "ONE": {
                "!type": "+pc.Vec2",
                "!doc": "A constant vector set to [1, 1]."
            },
            "RIGHT": {
                "!type": "+pc.Vec2",
                "!doc": "A constant vector set to [1, 0]."
            },
            "UP": {
                "!type": "+pc.Vec2",
                "!doc": "A constant vector set to [0, 1]."
            },
            "ZERO": {
                "!type": "+pc.Vec2",
                "!doc": "A constant vector set to [0, 0]."
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Vec2.html"
        },
        "Vec4": {
            "!type": "fn()",
            "!doc": "A 4-dimensional vector.",
            "prototype": {
                "add": {
                    "!type": "fn(rhs: +pc.Vec4) -> +pc.Vec4",
                    "!doc": "Adds a 4-dimensional vector to another in place.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Vec4.html#add"
                },
                "add2": {
                    "!type": "fn(lhs: +pc.Vec4, rhs: +pc.Vec4) -> +pc.Vec4",
                    "!doc": "Adds two 4-dimensional vectors together and returns the result.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Vec4.html#add2"
                },
                "clone": {
                    "!type": "fn() -> +pc.Vec4",
                    "!doc": "Returns an identical copy of the specified 4-dimensional vector.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Vec4.html#clone"
                },
                "copy": {
                    "!type": "fn(rhs: +pc.Vec4) -> +pc.Vec4",
                    "!doc": "Copied the contents of a source 4-dimensional vector to a destination 4-dimensional vector.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Vec4.html#copy"
                },
                "dot": {
                    "!type": "fn(rhs: +pc.Vec4) -> number",
                    "!doc": "Returns the result of a dot product operation performed on the two specified 4-dimensional vectors.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Vec4.html#dot"
                },
                "equals": {
                    "!type": "fn(rhs: +pc.Vec4) -> Boolean",
                    "!doc": "Reports whether two vectors are equal.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Vec4.html#equals"
                },
                "length": {
                    "!type": "fn() -> number",
                    "!doc": "Returns the magnitude of the specified 4-dimensional vector.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Vec4.html#length"
                },
                "lengthSq": {
                    "!type": "fn() -> number",
                    "!doc": "Returns the magnitude squared of the specified 4-dimensional vector.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Vec4.html#lengthSq"
                },
                "lerp": {
                    "!type": "fn(lhs: +pc.Vec4, rhs: +pc.Vec4, alpha: number) -> +pc.Vec4",
                    "!doc": "Returns the result of a linear interpolation between two specified 4-dimensional vectors.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Vec4.html#lerp"
                },
                "mul": {
                    "!type": "fn(rhs: +pc.Vec4) -> +pc.Vec4",
                    "!doc": "Returns the result of multiplying the specified 4-dimensional vectors together.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Vec4.html#mul"
                },
                "mul2": {
                    "!type": "fn(lhs: +pc.Vec4, rhs: +pc.Vec4) -> +pc.Vec4",
                    "!doc": "Returns the result of multiplying the specified 4-dimensional vectors together.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Vec4.html#mul2"
                },
                "normalize": {
                    "!type": "fn() -> +pc.Vec4",
                    "!doc": "Returns the specified 4-dimensional vector copied and converted to a unit vector.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Vec4.html#normalize"
                },
                "scale": {
                    "!type": "fn(scalar: number) -> +pc.Vec4",
                    "!doc": "Scales each dimension of the specified 4-dimensional vector by the supplied scalar value.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Vec4.html#scale"
                },
                "set": {
                    "!type": "fn(x: number, y: number, z: number)",
                    "!doc": "Sets the specified 4-dimensional vector to the supplied numerical values.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Vec4.html#set"
                },
                "sub": {
                    "!type": "fn(rhs: +pc.Vec4) -> +pc.Vec4",
                    "!doc": "Subtracts a 4-dimensional vector from another in place.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Vec4.html#sub"
                },
                "sub2": {
                    "!type": "fn(lhs: +pc.Vec4, rhs: +pc.Vec4) -> +pc.Vec4",
                    "!doc": "Subtracts two 4-dimensional vectors from one another and returns the result.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Vec4.html#sub2"
                },
                "x": {
                    "!type": "number",
                    "!doc": "The first element of the vector.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Vec4.html#x"
                },
                "y": {
                    "!type": "number",
                    "!doc": "The second element of the vector.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Vec4.html#y"
                },
                "z": {
                    "!type": "number",
                    "!doc": "The third element of the vector.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Vec4.html#z"
                },
                "w": {
                    "!type": "number",
                    "!doc": "The third element of the vector.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Vec4.html#w"
                }
            },
            "ONE": {
                "!type": "+pc.Vec4",
                "!doc": "A constant vector set to [1, 1, 1, 1]."
            },
            "ZERO": {
                "!type": "+pc.Vec4",
                "!doc": "A constant vector set to [0, 0, 0, 0]."
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Vec4.html"
        },
        "Mat3": {
            "!type": "fn()",
            "!doc": "A 4x4 matrix.",
            "prototype": {
                "clone": {
                    "!type": "fn()",
                    "!doc": "Creates a duplicate of the specified matrix.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Mat3.html#clone"
                },
                "copy": {
                    "!type": "fn(src: +pc.Mat3)",
                    "!doc": "Copies the contents of a source 4x4 matrix to a destination 4x4 matrix.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Mat3.html#copy"
                },
                "equals": {
                    "!type": "fn() -> Boolean",
                    "!doc": "Reports whether two matrices are equal.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Mat3.html#equals"
                },
                "isIdentity": {
                    "!type": "fn() -> Boolean",
                    "!doc": "Reports whether the specified matrix is the identity matrix.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Mat3.html#isIdentity"
                },
                "setIdentity": {
                    "!type": "fn() -> +pc.Mat3",
                    "!doc": "Sets the matrix to the identity matrix.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Mat3.html#setIdentity"
                },
                "transpose": {
                    "!type": "fn() -> +pc.Mat3",
                    "!doc": "Generates the transpose of the specified 3x3 matrix.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Mat3.html#transpose"
                }
            },
            "IDENTITY": {
                "!type": "+pc.Mat3",
                "!doc": "A constant matrix set to the identity."
            },
            "ZERO": {
                "!type": "+pc.Mat3",
                "!doc": "A constant matrix with all elements set to 0."
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Mat3.html"
        },
        "Quat": {
            "!type": "fn(x?: number, y?: number, z?: number, w?: number)",
            "!doc": "A quaternion.",
            "prototype": {
                "x": {
                    "!type": "number",
                    "!doc": "The x component of the quaternion.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Quat.html#x"
                },
                "y": {
                    "!type": "number",
                    "!doc": "The y component of the quaternion.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Quat.html#y"
                },
                "z": {
                    "!type": "number",
                    "!doc": "The z component of the quaternion.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Quat.html#z"
                },
                "w": {
                    "!type": "number",
                    "!doc": "The w component of the quaternion.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Quat.html#w"
                },
                "clone": {
                    "!type": "fn() -> +pc.Quat",
                    "!doc": "Returns an identical copy of the specified quaternion.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Quat.html#clone"
                },
                "copy": {
                    "!type": "fn(rhs: +pc.Quat) -> +pc.Quat",
                    "!doc": "Copies the contents of a source quaternion to a destination quaternion.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Quat.html#copy"
                },
                "equals": {
                    "!type": "fn() -> Boolean",
                    "!doc": "Reports whether two quaternions are equal.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Quat.html#equals"
                },
                "getEulerAngles": {
                    "!type": "fn(eulers?: +pc.Vec3) -> +pc.Vec3",
                    "!doc": "Converts the supplied quaternion to Euler angles.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Quat.html#getEulerAngles"
                },
                "invert": {
                    "!type": "fn() -> +pc.Quat",
                    "!doc": "Generates the inverse of the specified quaternion.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Quat.html#invert"
                },
                "length": {
                    "!type": "fn() -> number",
                    "!doc": "Returns the magnitude of the specified quaternion.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Quat.html#length"
                },
                "lengthSq": {
                    "!type": "fn() -> number",
                    "!doc": "Returns the magnitude squared of the specified quaternion.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Quat.html#lengthSq"
                },
                "mul": {
                    "!type": "fn(rhs: +pc.Quat) -> +pc.Quat",
                    "!doc": "Returns the result of multiplying the specified quaternions together.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Quat.html#mul"
                },
                "mul2": {
                    "!type": "fn(lhs: +pc.Quat, rhs: +pc.Quat) -> +pc.Quat",
                    "!doc": "Returns the result of multiplying the specified quaternions together.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Quat.html#mul2"
                },
                "normalize": {
                    "!type": "fn() -> +pc.Quat",
                    "!doc": "Returns the specified quaternion converted in place to a unit quaternion.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Quat.html#normalize"
                },
                "set": {
                    "!type": "fn(x: number, y: number, z: number, w: number)",
                    "!doc": "Sets the specified quaternion to the supplied numerical values.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Quat.html#set"
                },
                "setFromAxisAngle": {
                    "!type": "fn(axis: +pc.Vec3, angle: number) -> +pc.Quat",
                    "!doc": "Sets a quaternion from an angular rotation around an axis.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Quat.html#setFromAxisAngle"
                },
                "setFromEulerAngles": {
                    "!type": "fn(ex: number, ey: number, ez: number) -> +pc.Quat",
                    "!doc": "Sets a quaternion from Euler angles specified in XYZ order.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Quat.html#setFromEulerAngles"
                },
                "setFromMat4": {
                    "!type": "fn(m: +pc.Mat4) -> +pc.Quat",
                    "!doc": "Converts the specified 4x4 matrix to a quaternion. Note that since a quaternion is purely a representation for orientation, only the translational part of the matrix is lost.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Quat.html#setFromMat4"
                },
                "slerp": {
                    "!type": "fn(lhs: +pc.Quat, rhs: +pc.Quat, alpha: number) -> +pc.Quat",
                    "!doc": "Performs a spherical interpolation between two quaternions. The result of the interpolation is written to the quaternion calling the function.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Quat.html#slerp"
                },
                "transformVector": {
                    "!type": "fn(vec: +pc.Vec3, res?: +pc.Vec3) -> +pc.Vec3",
                    "!doc": "Transforms a 3-dimensional vector by the specified quaternion.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Quat.html#transformVector"
                }
            },
            "IDENTITY": {
                "!type": "+pc.Quat",
                "!doc": "A constant quaternion set to [0, 0, 0, 1] (the identity)."
            },
            "ZERO": {
                "!type": "+pc.Quat",
                "!doc": "A constant quaternion set to [0, 0, 0, 0]."
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Quat.html"
        },
        "shape": {
            "!type": "fn()",
            "!doc": "Create primitive shapes such as spheres and cubes in 3D and check intersection with points, rays and other shapes",
            "Shape": {
                "!type": "fn()",
                "!doc": "Base class for geometrical shapes",
                "prototype": {
                    "containsPoint": {
                        "!type": "fn(point: +pc.Vec3) -> Boolean",
                        "!doc": "Check to see if the point is inside the shape"
                    }
                }
            },
            "Type": {
                "!type": "?",
                "!doc": "Type names for different shapes"
            },
            "Aabb": {
                "!type": "fn(center: +pc.Vec3, halfExtents: +pc.Vec3)",
                "!doc": "Axis-Aligned Bounding Box",
                "prototype": {
                    "getMin": {
                        "!type": "fn() -> +pc.Vec3",
                        "!doc": "Return the minimum corner of the AABB."
                    },
                    "getMax": {
                        "!type": "fn() -> +pc.Vec3",
                        "!doc": "Return the maximum corner of the AABB."
                    },
                    "containsPoint": {
                        "!type": "fn(point: +pc.Vec3) -> Boolean",
                        "!doc": "Test if a point is inside a AABB"
                    },
                    "setFromTransformedAabb": {
                        "!type": "fn(aabb: +pc.shape.Aabb, m: +pc.Mat4)",
                        "!doc": "Set an AABB to enclose the specified AABB if it were to be transformed by the specified 4x4 matrix."
                    }
                }
            },
            "intersection": {
                "!type": "fn()",
                "!doc": "",
                "rayAabb": {
                    "!type": "fn(rayOrigin: +pc.Vec3, rayDir: +pc.Vec3, aabb: +pc.shape.Aabb) -> Boolean",
                    "!doc": "Intersection test between a ray and an AABB"
                },
                "raySphere": {
                    "!type": "fn(rayOrigin: +pc.Vec3, rayDir: +pc.Vec3, sphere: +pc.shape.Sphere, result: object) -> Boolean",
                    "!doc": "Intersection test between a ray and a Sphere"
                }
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#shape"
        },
        "CurveSet": {
            "!type": "fn(curveKeys?: [])",
            "!doc": "A curve set is a collection of curves.",
            "prototype": {
                "length": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.CurveSet.html#length",
                    "!doc": "[Read only] The number of curves in the curve set",
                    "!type": "number"
                },
                "type": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.CurveSet.html#type",
                    "!doc": "The interpolation scheme applied to all curves in the curve set",
                    "!type": "+pc.CURVE"
                },
                "get": {
                    "!type": "fn(index: number) -> +pc.Curve",
                    "!doc": "Return a specific curve in the curve set.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.CurveSet.html#get"
                },
                "value": {
                    "!type": "fn(time: number, result?: []) -> []",
                    "!doc": "Returns the interpolated value of all curves in the curve set at the specified time.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.CurveSet.html#value"
                },
                "clone": {
                    "!type": "fn() -> +pc.CurveSet",
                    "!doc": "Returns a clone of the specified curve set object.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.CurveSet.html#clone"
                }
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.CurveSet.html"
        },
        "CURVE_LINEAR": {
            "!type": "?",
            "!doc": "A linear interpolation scheme.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#CURVE_LINEAR"
        },
        "CURVE_SMOOTHSTEP": {
            "!type": "?",
            "!doc": "A smooth step interpolation scheme.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#CURVE_SMOOTHSTEP"
        },
        "CURVE_CATMULL": {
            "!type": "?",
            "!doc": "A Catmull-Rom spline interpolation scheme.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#CURVE_CATMULL"
        },
        "CURVE_CARDINAL": {
            "!type": "?",
            "!doc": "A cardinal spline interpolation scheme.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#CURVE_CARDINAL"
        },
        "Curve": {
            "!type": "fn(data?: [])",
            "!doc": "A curve is a collection of keys (time/value pairs). The shape of the curve is defined by its type that specifies an interpolation scheme for the keys.",
            "prototype": {
                "add": {
                    "!type": "fn(time: number, value: number) -> []",
                    "!doc": "Add a new key to the curve.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Curve.html#add"
                },
                "get": {
                    "!type": "fn(index: number) -> []",
                    "!doc": "Return a specific key.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Curve.html#get"
                },
                "sort": {
                    "!type": "fn()",
                    "!doc": "Sort keys by time.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Curve.html#sort"
                },
                "value": {
                    "!type": "fn(time: number) -> number",
                    "!doc": "Returns the interpolated value of the curve at specified time.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Curve.html#value"
                },
                "clone": {
                    "!type": "fn() -> +pc.Curve",
                    "!doc": "Returns a clone of the specified curve object.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Curve.html#clone"
                }
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Curve.html"
        },
        "Mat4": {
            "!type": "fn()",
            "!doc": "A 4x4 matrix.",
            "prototype": {
                "add2": {
                    "!type": "fn(lhs: +pc.Mat4, rhs: +pc.Mat4) -> +pc.Mat4",
                    "!doc": "Adds the specified 4x4 matrices together and stores the result in the current instance.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Mat4.html#add2"
                },
                "add": {
                    "!type": "fn(rhs: +pc.Mat4) -> +pc.Mat4",
                    "!doc": "Adds the specified 4x4 matrix to the current instance.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Mat4.html#add"
                },
                "clone": {
                    "!type": "fn()",
                    "!doc": "Creates a duplicate of the specified matrix.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Mat4.html#clone"
                },
                "copy": {
                    "!type": "fn(src: +pc.Mat4)",
                    "!doc": "Copies the contents of a source 4x4 matrix to a destination 4x4 matrix.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Mat4.html#copy"
                },
                "equals": {
                    "!type": "fn() -> Boolean",
                    "!doc": "Reports whether two matrices are equal.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Mat4.html#equals"
                },
                "isIdentity": {
                    "!type": "fn() -> Boolean",
                    "!doc": "Reports whether the specified matrix is the identity matrix.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Mat4.html#isIdentity"
                },
                "mul2": {
                    "!type": "fn(lhs: +pc.Mat4, rhs: +pc.Mat4) -> +pc.Mat4",
                    "!doc": "Multiplies the specified 4x4 matrices together and stores the result in the current instance.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Mat4.html#mul2"
                },
                "mul": {
                    "!type": "fn(rhs: +pc.Mat4) -> +pc.Mat4",
                    "!doc": "Multiplies the current instance by the specified 4x4 matrix.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Mat4.html#mul"
                },
                "transformPoint": {
                    "!type": "fn(vec: +pc.Vec3, res?: +pc.Vec3) -> +pc.Vec3",
                    "!doc": "Transforms a 3-dimensional point by a 4x4 matrix.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Mat4.html#transformPoint"
                },
                "transformVector": {
                    "!type": "fn(vec: +pc.Vec3, res?: +pc.Vec3) -> +pc.Vec3",
                    "!doc": "Transforms a 3-dimensional vector by a 4x4 matrix.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Mat4.html#transformVector"
                },
                "setLookAt": {
                    "!type": "fn(position: +pc.Vec3, target: +pc.Vec3, up: +pc.Vec3) -> +pc.Mat4",
                    "!doc": "Sets the specified matrix to a viewing matrix derived from an eye point, a target point and an up vector. The matrix maps the target point to the negative z-axis and the eye point to the origin, so that when you use a typical projection matrix, the center of the scene maps to the center of the viewport. Similarly, the direction described by the up vector projected onto the viewing plane is mapped to the positive y-axis so that it points upward in the viewport. The up vector must not be parallel to the line of sight from the eye to the reference point.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Mat4.html#setLookAt"
                },
                "setPerspective": {
                    "!type": "fn(fovy: number, aspect: number, znear: number, zfar: number) -> +pc.Mat4",
                    "!doc": "Sets the specified matrix to a persective projection matrix. The function's parameters define the shape of a frustum.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Mat4.html#setPerspective"
                },
                "setOrtho": {
                    "!type": "fn(left: number, right: number, bottom: number, top: number, znear: number, zfar: number) -> +pc.Mat4",
                    "!doc": "Sets the specified matrix to an orthographic projection matrix. The function's parameters define the shape of a cuboid-shaped frustum.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Mat4.html#setOrtho"
                },
                "setFromAxisAngle": {
                    "!type": "fn(axis: +pc.Vec3, angle: number) -> +pc.Mat4",
                    "!doc": "Sets the specified matrix to a rotation matrix equivalent to a rotation around an axis. The axis must be normalized (unit length) and the angle must be specified in degrees.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Mat4.html#setFromAxisAngle"
                },
                "invert": {
                    "!type": "fn() -> +pc.Mat4",
                    "!doc": "Sets the specified matrix to its inverse.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Mat4.html#invert"
                },
                "setIdentity": {
                    "!type": "fn() -> +pc.Mat4",
                    "!doc": "Sets the specified matrix to the identity matrix.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Mat4.html#setIdentity"
                },
                "setTRS": {
                    "!type": "fn(t: +pc.Vec3, r: +pc.Quat, s: +pc.Vec3) -> +pc.Mat4",
                    "!doc": "Sets the specified matrix to the concatenation of a translation, a quaternion rotation and a scale.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Mat4.html#setTRS"
                },
                "transpose": {
                    "!type": "fn() -> +pc.Mat4",
                    "!doc": "Sets the specified matrix to its transpose.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Mat4.html#transpose"
                },
                "getTranslation": {
                    "!type": "fn(t?: +pc.Vec3) -> +pc.Vec3",
                    "!doc": "Extracts the transational component from the specified 4x4 matrix.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Mat4.html#getTranslation"
                },
                "getX": {
                    "!type": "fn(x?: +pc.Vec3) -> +pc.Vec3",
                    "!doc": "Extracts the x-axis from the specified 4x4 matrix.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Mat4.html#getX"
                },
                "getY": {
                    "!type": "fn(y?: +pc.Vec3) -> +pc.Vec3",
                    "!doc": "Extracts the y-axis from the specified 4x4 matrix.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Mat4.html#getY"
                },
                "getZ": {
                    "!type": "fn(z?: +pc.Vec3) -> +pc.Vec3",
                    "!doc": "Extracts the z-axis from the specified 4x4 matrix.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Mat4.html#getZ"
                },
                "getScale": {
                    "!type": "fn(scale?: +pc.Vec3) -> +pc.Vec3",
                    "!doc": "Extracts the scale component from the specified 4x4 matrix.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Mat4.html#getScale"
                },
                "setFromEulerAngles": {
                    "!type": "fn(ex: number, ey: number, ez: number) -> +pc.Mat4",
                    "!doc": "Sets the specified matrix to a rotation matrix defined by Euler angles. The Euler angles are specified in XYZ order and in degrees.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Mat4.html#setFromEulerAngles"
                },
                "getEulerAngles": {
                    "!type": "fn(eulers?: +pc.Vec3) -> +pc.Vec3",
                    "!doc": "Extracts the Euler angles equivalent to the rotational portion of the specified matrix. The returned Euler angles are in XYZ order an in degrees.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Mat4.html#getEulerAngles"
                }
            },
            "IDENTITY": {
                "!type": "+pc.Mat4",
                "!doc": "A constant matrix set to the identity."
            },
            "ZERO": {
                "!type": "+pc.Mat4",
                "!doc": "A constant matrix with all elements set to 0."
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Mat4.html"
        },
        "Frustum": {
            "!type": "fn(projectionMatrix: +pc.Mat4, viewMatrix: +pc.Mat4)",
            "!doc": "A frustum is a shape that defines the viewing space of a camera.",
            "prototype": {
                "update": {
                    "!type": "fn(projectionMatrix: +pc.Mat4, viewMatrix: +pc.Mat4)",
                    "!doc": "Updates the frustum shape based on a view matrix and a projection matrix.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Frustum.html#update"
                },
                "containsPoint": {
                    "!type": "fn(point: +pc.Vec3) -> Boolean",
                    "!doc": "Tests whether a point is inside the frustum. Note that points lying in a frustum plane are considered to be outside the frustum.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Frustum.html#containsPoint"
                },
                "containsSphere": {
                    "!type": "fn(sphere: +pc.BoundingSphere) -> number",
                    "!doc": "Tests whether a bounding sphere intersects the frustum. If the sphere is outside the frustum, zero is returned. If the sphere intersects the frustum, 1 is returned. If the sphere is completely inside the frustum, 2 is returned. Note that a sphere touching a frustum plane from the outside is considered to be outside the frustum.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Frustum.html#containsSphere"
                }
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Frustum.html"
        },
        "ADDRESS_REPEAT": {
            "!type": "?",
            "!doc": "Ignores the integer part of texture coordinates, using only the fractional part.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#ADDRESS_REPEAT"
        },
        "ADDRESS_CLAMP_TO_EDGE": {
            "!type": "?",
            "!doc": "Clamps texture coordinate to the range 0 to 1.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#ADDRESS_CLAMP_TO_EDGE"
        },
        "ADDRESS_MIRRORED_REPEAT": {
            "!type": "?",
            "!doc": "Texture coordinate to be set to the fractional part if the integer part is even; if the integer part is odd, then the texture coordinate is set to 1 minus the fractional part.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#ADDRESS_MIRRORED_REPEAT"
        },
        "BLENDMODE_ZERO": {
            "!type": "?",
            "!doc": "Multiply all fragment components by zero.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#BLENDMODE_ZERO"
        },
        "BLENDMODE_ONE": {
            "!type": "?",
            "!doc": "Multiply all fragment components by one.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#BLENDMODE_ONE"
        },
        "BLENDMODE_SRC_COLOR": {
            "!type": "?",
            "!doc": "Multiply all fragment components by the components of the source fragment.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#BLENDMODE_SRC_COLOR"
        },
        "BLENDMODE_ONE_MINUS_SRC_COLOR": {
            "!type": "?",
            "!doc": "Multiply all fragment components by one minus the components of the source fragment.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#BLENDMODE_ONE_MINUS_SRC_COLOR"
        },
        "BLENDMODE_DST_COLOR": {
            "!type": "?",
            "!doc": "Multiply all fragment components by the components of the destination fragment.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#BLENDMODE_DST_COLOR"
        },
        "BLENDMODE_ONE_MINUS_DST_COLOR": {
            "!type": "?",
            "!doc": "Multiply all fragment components by one minus the components of the destination fragment.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#BLENDMODE_ONE_MINUS_DST_COLOR"
        },
        "BLENDMODE_SRC_ALPHA": {
            "!type": "?",
            "!doc": "Multiply all fragment components by the alpha value of the source fragment.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#BLENDMODE_SRC_ALPHA"
        },
        "BLENDMODE_SRC_ALPHA_SATURATE": {
            "!type": "?",
            "!doc": "Multiply all fragment components by the alpha value of the source fragment.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#BLENDMODE_SRC_ALPHA_SATURATE"
        },
        "BLENDMODE_ONE_MINUS_SRC_ALPHA": {
            "!type": "?",
            "!doc": "Multiply all fragment components by one minus the alpha value of the source fragment.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#BLENDMODE_ONE_MINUS_SRC_ALPHA"
        },
        "BLENDMODE_DST_ALPHA": {
            "!type": "?",
            "!doc": "Multiply all fragment components by the alpha value of the destination fragment.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#BLENDMODE_DST_ALPHA"
        },
        "BLENDMODE_ONE_MINUS_DST_ALPHA": {
            "!type": "?",
            "!doc": "Multiply all fragment components by one minus the alpha value of the destination fragment.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#BLENDMODE_ONE_MINUS_DST_ALPHA"
        },
        "BLENDEQUATION_ADD": {
            "!type": "?",
            "!doc": "Add the results of the source and destination fragment multiplies.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#BLENDEQUATION_ADD"
        },
        "BLENDEQUATION_SUBTRACT": {
            "!type": "?",
            "!doc": "Subtract the results of the source and destination fragment multiplies.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#BLENDEQUATION_SUBTRACT"
        },
        "BLENDEQUATION_REVERSE_SUBTRACT": {
            "!type": "?",
            "!doc": "Reverse and subtract the results of the source and destination fragment multiplies.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#BLENDEQUATION_REVERSE_SUBTRACT"
        },
        "BUFFER_STATIC": {
            "!type": "?",
            "!doc": "The data store contents will be modified once and used many times.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#BUFFER_STATIC"
        },
        "BUFFER_DYNAMIC": {
            "!type": "?",
            "!doc": "The data store contents will be modified repeatedly and used many times.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#BUFFER_DYNAMIC"
        },
        "BUFFER_STREAM": {
            "!type": "?",
            "!doc": "The data store contents will be modified once and used at most a few times.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#BUFFER_STREAM"
        },
        "CLEARFLAG_COLOR": {
            "!type": "?",
            "!doc": "Clear the color buffer.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#CLEARFLAG_COLOR"
        },
        "CLEARFLAG_DEPTH": {
            "!type": "?",
            "!doc": "Clear the depth buffer.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#CLEARFLAG_DEPTH"
        },
        "CLEARFLAG_STENCIL": {
            "!type": "?",
            "!doc": "Clear the stencil buffer.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#CLEARFLAG_STENCIL"
        },
        "CULLFACE_NONE": {
            "!type": "?",
            "!doc": "No triangles are culled.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#CULLFACE_NONE"
        },
        "CULLFACE_BACK": {
            "!type": "?",
            "!doc": "Triangles facing away from the view direction are culled.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#CULLFACE_BACK"
        },
        "CULLFACE_FRONT": {
            "!type": "?",
            "!doc": "Triangles facing the view direction are culled.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#CULLFACE_FRONT"
        },
        "CULLFACE_FRONTANDBACK": {
            "!type": "?",
            "!doc": "Triangles are culled regardless of their orientation with respect to the view direction. Note that point or line primitives are unaffected by this render state.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#CULLFACE_FRONTANDBACK"
        },
        "ELEMENTTYPE_INT8": {
            "!type": "?",
            "!doc": "Signed byte vertex element type.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#ELEMENTTYPE_INT8"
        },
        "ELEMENTTYPE_UINT8": {
            "!type": "?",
            "!doc": "Unsigned byte vertex element type.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#ELEMENTTYPE_UINT8"
        },
        "ELEMENTTYPE_INT16": {
            "!type": "?",
            "!doc": "Signed short vertex element type.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#ELEMENTTYPE_INT16"
        },
        "ELEMENTTYPE_UINT16": {
            "!type": "?",
            "!doc": "Unsigned short vertex element type.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#ELEMENTTYPE_UINT16"
        },
        "ELEMENTTYPE_INT32": {
            "!type": "?",
            "!doc": "Signed integer vertex element type.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#ELEMENTTYPE_INT32"
        },
        "ELEMENTTYPE_UINT32": {
            "!type": "?",
            "!doc": "Unsigned integer vertex element type.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#ELEMENTTYPE_UINT32"
        },
        "ELEMENTTYPE_FLOAT32": {
            "!type": "?",
            "!doc": "Floating point vertex element type.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#ELEMENTTYPE_FLOAT32"
        },
        "FILTER_NEAREST": {
            "!type": "?",
            "!doc": "Point sample filtering.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#FILTER_NEAREST"
        },
        "FILTER_LINEAR": {
            "!type": "?",
            "!doc": "Bilinear filtering.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#FILTER_LINEAR"
        },
        "FILTER_NEAREST_MIPMAP_NEAREST": {
            "!type": "?",
            "!doc": "Use the nearest neighbor in the nearest mipmap level.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#FILTER_NEAREST_MIPMAP_NEAREST"
        },
        "FILTER_NEAREST_MIPMAP_LINEAR": {
            "!type": "?",
            "!doc": "Linearly interpolate in the nearest mipmap level.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#FILTER_NEAREST_MIPMAP_LINEAR"
        },
        "FILTER_LINEAR_MIPMAP_NEAREST": {
            "!type": "?",
            "!doc": "Use the nearest neighbor after linearly interpolating between mipmap levels.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#FILTER_LINEAR_MIPMAP_NEAREST"
        },
        "FILTER_LINEAR_MIPMAP_LINEAR": {
            "!type": "?",
            "!doc": "Linearly interpolate both the mipmap levels and between texels.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#FILTER_LINEAR_MIPMAP_LINEAR"
        },
        "INDEXFORMAT_UINT8": {
            "!type": "?",
            "!doc": "8-bit unsigned vertex indices.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#INDEXFORMAT_UINT8"
        },
        "INDEXFORMAT_UINT16": {
            "!type": "?",
            "!doc": "16-bit unsigned vertex indices.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#INDEXFORMAT_UINT16"
        },
        "INDEXFORMAT_UINT32": {
            "!type": "?",
            "!doc": "32-bit unsigned vertex indices.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#INDEXFORMAT_UINT32"
        },
        "PIXELFORMAT_A8": {
            "!type": "?",
            "!doc": "8-bit alpha.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#PIXELFORMAT_A8"
        },
        "PIXELFORMAT_L8": {
            "!type": "?",
            "!doc": "8-bit luminance.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#PIXELFORMAT_L8"
        },
        "PIXELFORMAT_L8_A8": {
            "!type": "?",
            "!doc": "8-bit luminance with 8-bit alpha.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#PIXELFORMAT_L8_A8"
        },
        "PIXELFORMAT_R5_G6_B5": {
            "!type": "?",
            "!doc": "16-bit RGB (5-bits for red channel, 6 for green and 5 for blue).",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#PIXELFORMAT_R5_G6_B5"
        },
        "PIXELFORMAT_R5_G5_B5_A1": {
            "!type": "?",
            "!doc": "16-bit RGBA (5-bits for red channel, 5 for green, 5 for blue with 1-bit alpha).",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#PIXELFORMAT_R5_G5_B5_A1"
        },
        "PIXELFORMAT_R4_G4_B4_A4": {
            "!type": "?",
            "!doc": "16-bit RGBA (4-bits for red channel, 4 for green, 4 for blue with 4-bit alpha).",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#PIXELFORMAT_R4_G4_B4_A4"
        },
        "PIXELFORMAT_R8_G8_B8": {
            "!type": "?",
            "!doc": "24-bit RGB (8-bits for red channel, 8 for green and 8 for blue).",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#PIXELFORMAT_R8_G8_B8"
        },
        "PIXELFORMAT_R8_G8_B8_A8": {
            "!type": "?",
            "!doc": "32-bit RGBA (8-bits for red channel, 8 for green, 8 for blue with 8-bit alpha).",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#PIXELFORMAT_R8_G8_B8_A8"
        },
        "PIXELFORMAT_DXT1": {
            "!type": "?",
            "!doc": "Block compressed format, storing 16 input pixels in 64 bits of output, consisting of two 16-bit RGB 5:6:5 color values and a 4x4 two bit lookup table.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#PIXELFORMAT_DXT1"
        },
        "PIXELFORMAT_DXT3": {
            "!type": "?",
            "!doc": "Block compressed format, storing 16 input pixels (corresponding to a 4x4 pixel block) into 128 bits of output, consisting of 64 bits of alpha channel data (4 bits for each pixel) followed by 64 bits of color data, encoded the same way as DXT1.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#PIXELFORMAT_DXT3"
        },
        "PIXELFORMAT_DXT5": {
            "!type": "?",
            "!doc": "Block compressed format, storing 16 input pixels into 128 bits of output, consisting of 64 bits of alpha channel data (two 8 bit alpha values and a 4x4 3 bit lookup table) followed by 64 bits of color data (encoded the same way as DXT1).",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#PIXELFORMAT_DXT5"
        },
        "PIXELFORMAT_RGB16F": {
            "!type": "?",
            "!doc": "16-bit floating point RGB (16-bit float for each red, green and blue channels).",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#PIXELFORMAT_RGB16F"
        },
        "PIXELFORMAT_RGBA16F": {
            "!type": "?",
            "!doc": "16-bit floating point RGBA (16-bit float for each red, green, blue and alpha channels).",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#PIXELFORMAT_RGBA16F"
        },
        "PIXELFORMAT_RGB32F": {
            "!type": "?",
            "!doc": "32-bit floating point RGB (32-bit float for each red, green and blue channels).",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#PIXELFORMAT_RGB32F"
        },
        "PIXELFORMAT_RGBA32F": {
            "!type": "?",
            "!doc": "32-bit floating point RGBA (32-bit float for each red, green, blue and alpha channels).",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#PIXELFORMAT_RGBA32F"
        },
        "PRIMITIVE_POINTS": {
            "!type": "?",
            "!doc": "List of distinct points.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#PRIMITIVE_POINTS"
        },
        "PRIMITIVE_LINES": {
            "!type": "?",
            "!doc": "Discrete list of line segments.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#PRIMITIVE_LINES"
        },
        "PRIMITIVE_LINELOOP": {
            "!type": "?",
            "!doc": "List of points that are linked sequentially by line segments, with a closing line segment between the last and first points.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#PRIMITIVE_LINELOOP"
        },
        "PRIMITIVE_LINESTRIP": {
            "!type": "?",
            "!doc": "List of points that are linked sequentially by line segments.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#PRIMITIVE_LINESTRIP"
        },
        "PRIMITIVE_TRIANGLES": {
            "!type": "?",
            "!doc": "Discrete list of triangles.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#PRIMITIVE_TRIANGLES"
        },
        "PRIMITIVE_TRISTRIP": {
            "!type": "?",
            "!doc": "Connected strip of triangles where a specified vertex forms a triangle using the previous two.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#PRIMITIVE_TRISTRIP"
        },
        "PRIMITIVE_TRIFAN": {
            "!type": "?",
            "!doc": "Connected fan of triangles where the first vertex forms triangles with the following pairs of vertices.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#PRIMITIVE_TRIFAN"
        },
        "SEMANTIC_POSITION": {
            "!type": "?",
            "!doc": "Vertex attribute to be treated as a position.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#SEMANTIC_POSITION"
        },
        "SEMANTIC_NORMAL": {
            "!type": "?",
            "!doc": "Vertex attribute to be treated as a normal.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#SEMANTIC_NORMAL"
        },
        "SEMANTIC_TANGENT": {
            "!type": "?",
            "!doc": "Vertex attribute to be treated as a tangent.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#SEMANTIC_TANGENT"
        },
        "SEMANTIC_BLENDWEIGHT": {
            "!type": "?",
            "!doc": "Vertex attribute to be treated as skin blend weights.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#SEMANTIC_BLENDWEIGHT"
        },
        "SEMANTIC_BLENDINDICES": {
            "!type": "?",
            "!doc": "Vertex attribute to be treated as skin blend indices.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#SEMANTIC_BLENDINDICES"
        },
        "SEMANTIC_COLOR": {
            "!type": "?",
            "!doc": "Vertex attribute to be treated as a color.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#SEMANTIC_COLOR"
        },
        "SEMANTIC_TEXCOORD0": {
            "!type": "?",
            "!doc": "Vertex attribute to be treated as a texture coordinate (set 0).",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#SEMANTIC_TEXCOORD0"
        },
        "SEMANTIC_TEXCOORD1": {
            "!type": "?",
            "!doc": "Vertex attribute to be treated as a texture coordinate (set 1).",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#SEMANTIC_TEXCOORD1"
        },
        "SEMANTIC_TEXCOORD2": {
            "!type": "?",
            "!doc": "Vertex attribute to be treated as a texture coordinate (set 2).",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#SEMANTIC_TEXCOORD2"
        },
        "SEMANTIC_TEXCOORD3": {
            "!type": "?",
            "!doc": "Vertex attribute to be treated as a texture coordinate (set 3).",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#SEMANTIC_TEXCOORD3"
        },
        "SEMANTIC_TEXCOORD4": {
            "!type": "?",
            "!doc": "Vertex attribute to be treated as a texture coordinate (set 4).",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#SEMANTIC_TEXCOORD4"
        },
        "SEMANTIC_TEXCOORD5": {
            "!type": "?",
            "!doc": "Vertex attribute to be treated as a texture coordinate (set 5).",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#SEMANTIC_TEXCOORD5"
        },
        "SEMANTIC_TEXCOORD6": {
            "!type": "?",
            "!doc": "Vertex attribute to be treated as a texture coordinate (set 6).",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#SEMANTIC_TEXCOORD6"
        },
        "SEMANTIC_TEXCOORD7": {
            "!type": "?",
            "!doc": "Vertex attribute to be treated as a texture coordinate (set 7).",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#SEMANTIC_TEXCOORD7"
        },
        "SEMANTIC_ATTR0": {
            "!type": "?",
            "!doc": "Vertex attribute with a user defined semantic.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#SEMANTIC_ATTR0"
        },
        "SEMANTIC_ATTR1": {
            "!type": "?",
            "!doc": "Vertex attribute with a user defined semantic.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#SEMANTIC_ATTR1"
        },
        "SEMANTIC_ATTR2": {
            "!type": "?",
            "!doc": "Vertex attribute with a user defined semantic.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#SEMANTIC_ATTR2"
        },
        "SEMANTIC_ATTR3": {
            "!type": "?",
            "!doc": "Vertex attribute with a user defined semantic.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#SEMANTIC_ATTR3"
        },
        "SEMANTIC_ATTR4": {
            "!type": "?",
            "!doc": "Vertex attribute with a user defined semantic.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#SEMANTIC_ATTR4"
        },
        "SEMANTIC_ATTR5": {
            "!type": "?",
            "!doc": "Vertex attribute with a user defined semantic.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#SEMANTIC_ATTR5"
        },
        "SEMANTIC_ATTR6": {
            "!type": "?",
            "!doc": "Vertex attribute with a user defined semantic.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#SEMANTIC_ATTR6"
        },
        "SEMANTIC_ATTR7": {
            "!type": "?",
            "!doc": "Vertex attribute with a user defined semantic.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#SEMANTIC_ATTR7"
        },
        "SEMANTIC_ATTR8": {
            "!type": "?",
            "!doc": "Vertex attribute with a user defined semantic.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#SEMANTIC_ATTR8"
        },
        "SEMANTIC_ATTR9": {
            "!type": "?",
            "!doc": "Vertex attribute with a user defined semantic.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#SEMANTIC_ATTR9"
        },
        "SEMANTIC_ATTR10": {
            "!type": "?",
            "!doc": "Vertex attribute with a user defined semantic.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#SEMANTIC_ATTR10"
        },
        "SEMANTIC_ATTR11": {
            "!type": "?",
            "!doc": "Vertex attribute with a user defined semantic.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#SEMANTIC_ATTR11"
        },
        "SEMANTIC_ATTR12": {
            "!type": "?",
            "!doc": "Vertex attribute with a user defined semantic.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#SEMANTIC_ATTR12"
        },
        "SEMANTIC_ATTR13": {
            "!type": "?",
            "!doc": "Vertex attribute with a user defined semantic.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#SEMANTIC_ATTR13"
        },
        "SEMANTIC_ATTR14": {
            "!type": "?",
            "!doc": "Vertex attribute with a user defined semantic.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#SEMANTIC_ATTR14"
        },
        "SEMANTIC_ATTR15": {
            "!type": "?",
            "!doc": "Vertex attribute with a user defined semantic.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#SEMANTIC_ATTR15"
        },
        "TEXTURELOCK_READ": {
            "!type": "?",
            "!doc": "Read only. Any changes to the locked mip level's pixels will not update the texture.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#TEXTURELOCK_READ"
        },
        "TEXTURELOCK_WRITE": {
            "!type": "?",
            "!doc": "Write only. The contents of the specified mip level will be entirely replaced.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#TEXTURELOCK_WRITE"
        },
        "VertexFormat": {
            "!type": "fn(graphicsDevice: +pc.GraphicsDevice, description: [])",
            "!doc": "A vertex format is a descriptor that defines the layout of vertex element data inside a pc.VertexBuffer object.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#VertexFormat"
        },
        "VertexIterator": {
            "!type": "fn(vertexBuffer: +pc.VertexBuffer)",
            "!doc": "A vertex iterator simplifies the process of writing vertex data to a vertex buffer.",
            "prototype": {
                "next": {
                    "!type": "fn()",
                    "!doc": "Moves the vertex iterator on to the next vertex.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.VertexIterator.html#next"
                },
                "end": {
                    "!type": "fn()",
                    "!doc": "Notifies the vertex buffer being iterated that writes are complete. Internally the vertex buffer is unlocked and vertex data is uploaded to video memory.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.VertexIterator.html#end"
                }
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.VertexIterator.html"
        },
        "IndexBuffer": {
            "!type": "fn(graphicsDevice: +pc.GraphicsDevice, format: number, numIndices: number, usage?: number)",
            "!doc": "An index buffer is the mechanism via which the application specifies primitive index data to the graphics hardware.",
            "prototype": {
                "destroy": {
                    "!type": "fn()",
                    "!doc": "Frees resources associated with this index buffer.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.IndexBuffer.html#destroy"
                },
                "getFormat": {
                    "!type": "fn() -> number",
                    "!doc": "Returns the data format of the specified index buffer.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.IndexBuffer.html#getFormat"
                },
                "getNumIndices": {
                    "!type": "fn() -> number",
                    "!doc": "Returns the number of indices stored in the specified index buffer.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.IndexBuffer.html#getNumIndices"
                },
                "lock": {
                    "!type": "fn() -> ArrayBuffer",
                    "!doc": "Gives access to the block of memory that stores the buffer's indices.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.IndexBuffer.html#lock"
                },
                "unlock": {
                    "!type": "fn()",
                    "!doc": "Signals that the block of memory returned by a call to the lock function is ready to be given to the graphics hardware. Only unlocked index buffers can be set on the currently active device.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.IndexBuffer.html#unlock"
                }
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.IndexBuffer.html"
        },
        "Texture": {
            "!type": "fn(graphicsDevice: +pc.GraphicsDevice, options: object)",
            "!doc": "A texture is a container for texel data that can be utilized in a fragment shader. Typically, the texel data represents an image that is mapped over geometry.",
            "prototype": {
                "minFilter": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Texture.html#minFilter",
                    "!doc": "The minification filter to be applied to the texture (see pc.FILTER_*).",
                    "!type": "number"
                },
                "magFilter": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Texture.html#magFilter",
                    "!doc": "The magnification filter to be applied to the texture (see pc.FILTER_*).",
                    "!type": "number"
                },
                "addressU": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Texture.html#addressU",
                    "!doc": "The addressing mode to be applied to the texture (see pc.ADDRESS_*).",
                    "!type": "number"
                },
                "addressV": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Texture.html#addressV",
                    "!doc": "The addressing mode to be applied to the texture (see pc.ADDRESS_*).",
                    "!type": "number"
                },
                "anisotropy": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Texture.html#anisotropy",
                    "!doc": "Integer value specifying the level of anisotropic to apply to the texture ranging from 1 (no anisotropic filtering) to the pc.GraphicsDevice property maxAnisotropy.",
                    "!type": "number"
                },
                "width": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Texture.html#width",
                    "!doc": "[Read only] The width of the based mip level in pixels.",
                    "!type": "number"
                },
                "height": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Texture.html#height",
                    "!doc": "[Read only] The height of the based mip level in pixels.",
                    "!type": "number"
                },
                "format": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Texture.html#format",
                    "!doc": "[Read only] The pixel format of the texture (see pc.PIXELFORMAT_*).",
                    "!type": "number"
                },
                "destroy": {
                    "!type": "fn()",
                    "!doc": "Forcibly free up the underlying WebGL resource owned by the texture.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Texture.html#destroy"
                },
                "lock": {
                    "!type": "fn(options: object)",
                    "!doc": "Locks a miplevel of the texture, returning a typed array to be filled with pixel data.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Texture.html#lock"
                },
                "setSource": {
                    "!type": "fn(source: [])",
                    "!doc": "Set the pixel data of the texture from an canvas, image, video DOM element. If the texture is a cubemap, the supplied source must be an array of 6 canvases, images or videos.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Texture.html#setSource"
                },
                "getSource": {
                    "!type": "fn() -> Image",
                    "!doc": "Get the pixel data of the texture. If this is a cubemap then an array of 6 images will be returned otherwise a single image.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Texture.html#getSource"
                },
                "unlock": {
                    "!type": "fn()",
                    "!doc": "Unlocks the currently locked mip level and uploads it to VRAM.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Texture.html#unlock"
                },
                "upload": {
                    "!type": "fn()",
                    "!doc": "Forces a reupload of the textures pixel data to graphics memory. Ordinarily, this function is called by internally by pc.Texture#setSource and pc.Texture#unlock. However, it still needs to be called explicitly in the case where an HTMLVideoElement is set as the source of the texture.  Normally, this is done once every frame before video textured geometry is rendered.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Texture.html#upload"
                }
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Texture.html"
        },
        "VertexBuffer": {
            "!type": "fn(graphicsDevice: +pc.GraphicsDevice, format: +pc.VertexFormat, numVertices: number, usage?: number)",
            "!doc": "A vertex buffer is the mechanism via which the application specifies vertex data to the graphics hardware.",
            "prototype": {
                "destroy": {
                    "!type": "fn()",
                    "!doc": "Frees resources associated with this vertex buffer.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.VertexBuffer.html#destroy"
                },
                "getFormat": {
                    "!type": "fn() -> +pc.VertexFormat",
                    "!doc": "Returns the data format of the specified vertex buffer.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.VertexBuffer.html#getFormat"
                },
                "getUsage": {
                    "!type": "fn() -> number",
                    "!doc": "Returns the usage type of the specified vertex buffer. This indicates whether the buffer can be modified once and used many times (pc.BUFFER_STATIC), modified repeatedly and used many times (pc.BUFFER_DYNAMIC) or modified once and used at most a few times (pc.BUFFER_STREAM).",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.VertexBuffer.html#getUsage"
                },
                "getNumVertices": {
                    "!type": "fn() -> number",
                    "!doc": "Returns the number of vertices stored in the specified vertex buffer.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.VertexBuffer.html#getNumVertices"
                },
                "lock": {
                    "!type": "fn() -> ArrayBuffer",
                    "!doc": "Returns a mapped memory block representing the content of the vertex buffer.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.VertexBuffer.html#lock"
                },
                "unlock": {
                    "!type": "fn()",
                    "!doc": "Notifies the graphics engine that the client side copy of the vertex buffer's memory can be returned to the control of the graphics driver.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.VertexBuffer.html#unlock"
                }
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.VertexBuffer.html"
        },
        "Shader": {
            "!type": "fn(graphicsDevice: +pc.GraphicsDevice, definition: object)",
            "!doc": "A shader is a program that is repsonsible for rendering graphical primitives on a device's graphics processor.",
            "prototype": {
                "destroy": {
                    "!type": "fn()",
                    "!doc": "Frees resources associated with this shader.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Shader.html#destroy"
                }
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Shader.html"
        },
        "RenderTarget": {
            "!type": "fn(graphicsDevice: +pc.GraphicsDevice, colorBuffer: +pc.Texture, options: object)",
            "!doc": "A render target is a rectangular rendering surface.",
            "prototype": {
                "colorBuffer": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.RenderTarget.html#colorBuffer",
                    "!doc": "Color buffer set up on the render target (read-only).",
                    "!type": "+pc.Texture"
                },
                "face": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.RenderTarget.html#face",
                    "!doc": "If the render target is bound to a cubemap, face stores the face index that the render target renders to. Face indices are 0 (pos X), 1 (neg X), 2 (pos y), 3 (neg Y), 4 (pos Z) and 5 (neg Z) (read-only).",
                    "!type": "number"
                },
                "width": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.RenderTarget.html#width",
                    "!doc": "Width of the render target in pixels (read-only).",
                    "!type": "number"
                },
                "height": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.RenderTarget.html#height",
                    "!doc": "Height of the render target in pixels (read-only).",
                    "!type": "number"
                },
                "destroy": {
                    "!type": "fn()",
                    "!doc": "Frees resources associated with this render target.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.RenderTarget.html#destroy"
                }
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.RenderTarget.html"
        },
        "GraphicsDevice": {
            "!type": "fn(canvas: object)",
            "!doc": "The graphics device manages the underlying graphics context. It is responsible for submitting render state changes and graphics primitives to the hardware. A graphics device is tied to a specific canvas HTML element. It is valid to have more than one canvas element per page and create a new graphics device against each.",
            "prototype": {
                "width": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphicsDevice.html#width",
                    "!doc": "Width of the back buffer in pixels (read-only).",
                    "!type": "number"
                },
                "height": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphicsDevice.html#height",
                    "!doc": "Height of the back buffer in pixels (read-only).",
                    "!type": "number"
                },
                "maxAnisotropy": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphicsDevice.html#maxAnisotropy",
                    "!doc": "The maximum supported texture anisotropy setting (read-only).",
                    "!type": "number"
                },
                "maxCubeMapSize": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphicsDevice.html#maxCubeMapSize",
                    "!doc": "The maximum supported dimension of a cube map (read-only).",
                    "!type": "number"
                },
                "maxTextureSize": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphicsDevice.html#maxTextureSize",
                    "!doc": "The maximum supported dimension of a texture (read-only). is attached is fullscreen or not.",
                    "!type": "number"
                },
                "setViewport": {
                    "!type": "fn(x: number, y: number, w: number, h: number)",
                    "!doc": "Set the active rectangle for rendering on the specified device.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphicsDevice.html#setViewport"
                },
                "setScissor": {
                    "!type": "fn(x: number, y: number, w: number, h: number)",
                    "!doc": "Set the active scissor rectangle on the specified device.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphicsDevice.html#setScissor"
                },
                "getProgramLibrary": {
                    "!type": "fn() -> +pc.ProgramLibrary",
                    "!doc": "Retrieves the program library assigned to the specified graphics device.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphicsDevice.html#getProgramLibrary"
                },
                "setProgramLibrary": {
                    "!type": "fn(programLib: +pc.ProgramLibrary)",
                    "!doc": "Assigns a program library to the specified device. By default, a graphics device is created with a program library that manages all of the programs that are used to render any graphical primitives. However, this function allows the user to replace the existing program library with a new one.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphicsDevice.html#setProgramLibrary"
                },
                "updateBegin": {
                    "!type": "fn()",
                    "!doc": "Marks the beginning of a block of rendering. Internally, this function binds the render target currently set on the device. This function should be matched with a call to pc.GraphicsDevice#updateEnd. Calls to pc.GraphicsDevice#updateBegin and pc.GraphicsDevice#updateEnd must not be nested.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphicsDevice.html#updateBegin"
                },
                "updateEnd": {
                    "!type": "fn()",
                    "!doc": "Marks the end of a block of rendering. This function should be called after a matching call to pc.GraphicsDevice#updateBegin. Calls to pc.GraphicsDevice#updateBegin and pc.GraphicsDevice#updateEnd must not be nested.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphicsDevice.html#updateEnd"
                },
                "draw": {
                    "!type": "fn(primitive: object)",
                    "!doc": "Submits a graphical primitive to the hardware for immediate rendering.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphicsDevice.html#draw"
                },
                "clear": {
                    "!type": "fn(options: object)",
                    "!doc": "Clears the frame buffer of the currently set render target.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphicsDevice.html#clear"
                },
                "setRenderTarget": {
                    "!type": "fn(The: +pc.RenderTarget)",
                    "!doc": "Sets the specified render target on the device. If null is passed as a parameter, the back buffer becomes the current target for all rendering operations.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphicsDevice.html#setRenderTarget"
                },
                "getRenderTarget": {
                    "!type": "fn() -> +pc.RenderTarget",
                    "!doc": "Queries the currently set render target on the device.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphicsDevice.html#getRenderTarget"
                },
                "getDepthTest": {
                    "!type": "fn() -> Boolean",
                    "!doc": "Queries whether depth testing is enabled.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphicsDevice.html#getDepthTest"
                },
                "setDepthTest": {
                    "!type": "fn(depthTest: Boolean)",
                    "!doc": "Enables or disables depth testing of fragments. Once this state is set, it persists until it is changed. By default, depth testing is enabled.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphicsDevice.html#setDepthTest"
                },
                "getDepthWrite": {
                    "!type": "fn() -> Boolean",
                    "!doc": "Queries whether writes to the depth buffer are enabled.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphicsDevice.html#getDepthWrite"
                },
                "setDepthWrite": {
                    "!type": "fn(writeDepth: Boolean)",
                    "!doc": "Enables or disables writes to the depth buffer. Once this state is set, it persists until it is changed. By default, depth writes are enabled.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphicsDevice.html#setDepthWrite"
                },
                "setColorWrite": {
                    "!type": "fn(writeRed: Boolean, writeGreen: Boolean, writeBlue: Boolean, writeAlpha: Boolean)",
                    "!doc": "Enables or disables writes to the color buffer. Once this state is set, it persists until it is changed. By default, color writes are enabled for all color channels.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphicsDevice.html#setColorWrite"
                },
                "getBlending": {
                    "!type": "fn() -> Boolean",
                    "!doc": "Queries whether blending is enabled.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphicsDevice.html#getBlending"
                },
                "setBlending": {
                    "!type": "fn(blending: Boolean)",
                    "!doc": "Enables or disables blending.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphicsDevice.html#setBlending"
                },
                "setBlendFunction": {
                    "!type": "fn(blendSrc: +pc.BLENDMODE, blendDst: +pc.BLENDMODE)",
                    "!doc": "Configures blending operations.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphicsDevice.html#setBlendFunction"
                },
                "setBlendEquation": {
                    "!type": "fn(blendEquation: +pc.BLENDEQUATION)",
                    "!doc": "Configures the blending equation. The default blend equation is pc.BLENDEQUATION_ADD.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphicsDevice.html#setBlendEquation"
                },
                "setCullMode": {
                    "!type": "fn(cullMode: +pc.CULLFACE)",
                    "!doc": "Configures the cull mode. The default cull mode is pc.CULLFACE_BACK.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphicsDevice.html#setCullMode"
                },
                "setIndexBuffer": {
                    "!type": "fn(indexBuffer: +pc.IndexBuffer)",
                    "!doc": "Sets the current index buffer on the graphics device. On subsequent calls to pc.GraphicsDevice#draw, the specified index buffer will be used to provide index data for any indexed primitives.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphicsDevice.html#setIndexBuffer"
                },
                "setVertexBuffer": {
                    "!type": "fn(vertexBuffer: +pc.VertexBuffer, stream: number)",
                    "!doc": "Sets the current vertex buffer for a specific stream index on the graphics device. On subsequent calls to pc.GraphicsDevice#draw, the specified vertex buffer will be used to provide vertex data for any primitives.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphicsDevice.html#setVertexBuffer"
                },
                "setShader": {
                    "!type": "fn(shader: +pc.Shader)",
                    "!doc": "Sets the active shader to be used during subsequent draw calls.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphicsDevice.html#setShader"
                },
                "resizeCanvas": {
                    "!type": "fn()",
                    "!doc": "Sets the width and height of the canvas, then fires the 'resizecanvas' event.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphicsDevice.html#resizeCanvas"
                }
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphicsDevice.html"
        },
        "PostEffect": {
            "!type": "fn(graphicsDevice: +pc.GraphicsDevice)",
            "!doc": "Base class for all post effects. Post effects take a a render target as input apply effects to it and then render the result to an output render target or the screen if no output is specified.",
            "prototype": {
                "render": {
                    "!type": "fn(inputTarget: +pc.RenderTarget, outputTarget: +pc.RenderTarget, rect: +pc.Vec4)",
                    "!doc": "Render the post effect using the specified inputTarget to the specified outputTarget.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PostEffect.html#render"
                }
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PostEffect.html"
        },
        "PostEffectQueue": {
            "!type": "fn(app: +pc.Application, camera: +pc.CameraComponent)",
            "!doc": "Used to manage multiple post effects for a camera",
            "prototype": {
                "addEffect": {
                    "!type": "fn(effect: +pc.PostEffect)",
                    "!doc": "Adds a post effect to the queue. If the queue is disabled adding a post effect will automatically enable the queue.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PostEffectQueue.html#addEffect"
                },
                "removeEffect": {
                    "!type": "fn(effect: +pc.PostEffect)",
                    "!doc": "Removes a post effect from the queue. If the queue becomes empty it will be disabled automatically.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PostEffectQueue.html#removeEffect"
                },
                "destroy": {
                    "!type": "fn()",
                    "!doc": "Removes all the effects from the queue and disables it",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PostEffectQueue.html#destroy"
                },
                "enable": {
                    "!type": "fn()",
                    "!doc": "Enables the queue and all of its effects. If there are no effects then the queue will not be enabled.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PostEffectQueue.html#enable"
                },
                "disable": {
                    "!type": "fn()",
                    "!doc": "Disables the queue and all of its effects.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PostEffectQueue.html#disable"
                }
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PostEffectQueue.html"
        },
        "BLEND_SUBTRACTIVE": {
            "!type": "?",
            "!doc": "Subtract the color of the source fragment from the destination fragment and write the result to the frame buffer.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#BLEND_SUBTRACTIVE"
        },
        "BLEND_ADDITIVE": {
            "!type": "?",
            "!doc": "Add the color of the source fragment to the destination fragment and write the result to the frame buffer.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#BLEND_ADDITIVE"
        },
        "BLEND_NORMAL": {
            "!type": "?",
            "!doc": "Enable simple translucency for materials such as glass. This is equivalent to enabling a source blend mode of pc.BLENDMODE_SRC_ALPHA and a destination blend mode of pc.BLENDMODE_ONE_MINUS_SRC_ALPHA.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#BLEND_NORMAL"
        },
        "BLEND_NONE": {
            "!type": "?",
            "!doc": "Disable blending.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#BLEND_NONE"
        },
        "BLEND_PREMULTIPLIED": {
            "!type": "?",
            "!doc": "Similar to pc.BLEND_NORMAL expect the source fragment is assumed to have already been multiplied by the source alpha value.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#BLEND_PREMULTIPLIED"
        },
        "BLEND_MULTIPLICATIVE": {
            "!type": "?",
            "!doc": "Multiply the color of the source fragment by the color of the destination fragment and write the result to the frame buffer.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#BLEND_MULTIPLICATIVE"
        },
        "FOG_NONE": {
            "!type": "?",
            "!doc": "No fog is applied to the scene.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#FOG_NONE"
        },
        "FOG_LINEAR": {
            "!type": "?",
            "!doc": "Fog rises linearly from zero to 1 between a start and end depth.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#FOG_LINEAR"
        },
        "FOG_EXP": {
            "!type": "?",
            "!doc": "Fog rises according to an exponential curve controlled by a density value.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#FOG_EXP"
        },
        "FOG_EXP2": {
            "!type": "?",
            "!doc": "Fog rises according to an exponential curve controlled by a density value.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#FOG_EXP2"
        },
        "LIGHTTYPE_DIRECTIONAL": {
            "!type": "?",
            "!doc": "Directional (global) light source.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#LIGHTTYPE_DIRECTIONAL"
        },
        "LIGHTTYPE_POINT": {
            "!type": "?",
            "!doc": "Point (local) light source.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#LIGHTTYPE_POINT"
        },
        "LIGHTTYPE_SPOT": {
            "!type": "?",
            "!doc": "Spot (local) light source.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#LIGHTTYPE_SPOT"
        },
        "PROJECTION_PERSPECTIVE": {
            "!type": "?",
            "!doc": "A perspective camera projection where the frustum shape is essentially pyrimidal.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#PROJECTION_PERSPECTIVE"
        },
        "PROJECTION_ORTHOGRAPHIC": {
            "!type": "?",
            "!doc": "An orthographic camera projection where the frustum shape is essentially a cuboid.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#PROJECTION_ORTHOGRAPHIC"
        },
        "Scene": {
            "!type": "fn()",
            "!doc": "A scene is a container for models, lights and cameras. Scenes are rendered via a renderer. PlayCanvas currently only supports a single renderer: the forward renderer (pc.ForwardRenderer).",
            "prototype": {
                "ambientLight": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Scene.html#ambientLight",
                    "!doc": "The color of the scene's ambient light.",
                    "!type": "+pc.Color"
                },
                "fog": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Scene.html#fog",
                    "!doc": "The type of fog used by the scene (see pc.FOG_).",
                    "!type": "string"
                },
                "fogColor": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Scene.html#fogColor",
                    "!doc": "The color of the fog, in enabled.",
                    "!type": "+pc.Color"
                },
                "fogDensity": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Scene.html#fogDensity",
                    "!doc": "The density of the fog. This property is only valid if the fog property is set to pc.FOG_EXP or pc.FOG_EXP2.",
                    "!type": "number"
                },
                "fogEnd": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Scene.html#fogEnd",
                    "!doc": "The distance from the viewpoint where linear fog reaches its maximum. This property is only valid if the fog property is set to pc.FOG_LINEAR.",
                    "!type": "number"
                },
                "fogStart": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Scene.html#fogStart",
                    "!doc": "The distance from the viewpoint where linear fog begins. This property is only valid if the fog property is set to pc.FOG_LINEAR.",
                    "!type": "number"
                },
                "gammaCorrection": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Scene.html#gammaCorrection",
                    "!doc": "Possible values are pc.GAMMA_NONE (no gamma correction), pc.GAMMA_SRGB and pc.GAMMA_SRGBFAST",
                    "!type": "+pc.GAMMA"
                },
                "tomeMapping": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Scene.html#tomeMapping",
                    "!doc": "The tonemapping transform to apply when writing fragments to the frame buffer. Default is pc.TONEMAP_LINEAR.",
                    "!type": "+pc.TONEMAP"
                },
                "skybox": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Scene.html#skybox",
                    "!doc": "A cube map texture used as the scene's skybox.",
                    "!type": "+pc.Texture"
                },
                "addModel": {
                    "!type": "fn()",
                    "!doc": "Adds the specified model to the scene.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Scene.html#addModel"
                },
                "removeModel": {
                    "!type": "fn()",
                    "!doc": "Removes the specified model from the scene.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Scene.html#removeModel"
                },
                "update": {
                    "!type": "fn()",
                    "!doc": "Synchronizes the graph node hierarchy of every model in the scene.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Scene.html#update"
                }
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Scene.html"
        },
        "GraphNode": {
            "!type": "fn()",
            "!doc": "A hierarchical scene node.",
            "prototype": {
                "right": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphNode.html#right",
                    "!doc": "Vector representing the X direction of the node in world space (read only).",
                    "!type": "+pc.Vec3"
                },
                "up": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphNode.html#up",
                    "!doc": "Vector representing the Y direction of the node in world space (read only).",
                    "!type": "+pc.Vec3"
                },
                "forward": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphNode.html#forward",
                    "!doc": "Vector representing the negative Z direction of the node in world space (read only).",
                    "!type": "+pc.Vec3"
                },
                "find": {
                    "!type": "fn(attr: string, value: string) -> [+pc.GraphNode]",
                    "!doc": "Search the graph for nodes using a supplied property or method name to get the value to search on.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphNode.html#find"
                },
                "findOne": {
                    "!type": "fn(attr: string, value: string) -> +pc.GraphNode",
                    "!doc": "@see pc.GraphNode#find, but this will only return the first graph node that it finds.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphNode.html#findOne"
                },
                "findByName": {
                    "!type": "fn(name: string) -> +pc.GraphNode",
                    "!doc": "Get the first node found in the graph with the name. The search is depth first.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphNode.html#findByName"
                },
                "findByPath": {
                    "!type": "fn(path: string) -> +pc.GraphNode",
                    "!doc": "Get the first node found in the graph by its full path in the graph. The full path has this form 'parent/child/sub-child'. The search is depth first.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphNode.html#findByPath"
                },
                "getPath": {
                    "!type": "fn() -> string",
                    "!doc": "Gets the path of the entity relative to the root of the hierarchy",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphNode.html#getPath"
                },
                "getRoot": {
                    "!type": "fn() -> +pc.GraphNode",
                    "!doc": "Get the highest ancestor node from this graph node.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphNode.html#getRoot"
                },
                "getParent": {
                    "!type": "fn() -> +pc.GraphNode",
                    "!doc": "Get the parent GraphNode",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphNode.html#getParent"
                },
                "getChildren": {
                    "!type": "fn() -> []",
                    "!doc": "Get the children of this graph node.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphNode.html#getChildren"
                },
                "getEulerAngles": {
                    "!type": "fn() -> +pc.Vec3",
                    "!doc": "Get the world space rotation for the specified GraphNode in Euler angle form. The order of the returned Euler angles is XYZ. The value returned by this function should be considered read-only. In order to set the world-space rotation of the graph node, use pc.GraphNode#setEulerAngles.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphNode.html#getEulerAngles"
                },
                "getLocalEulerAngles": {
                    "!type": "fn() -> +pc.Vec3",
                    "!doc": "Get the rotation in local space for the specified GraphNode. The rotation is returned as eurler angles in a 3-dimensional vector where the order is XYZ. The returned vector should be considered read-only. To update the local rotation, use pc.GraphNode#setLocalEulerAngles.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphNode.html#getLocalEulerAngles"
                },
                "getLocalPosition": {
                    "!type": "fn() -> +pc.Vec3",
                    "!doc": "Get the position in local space for the specified GraphNode. The position is returned as a 3-dimensional vector. The returned vector should be considered read-only. To update the local position, use pc.GraphNode#setLocalPosition.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphNode.html#getLocalPosition"
                },
                "getLocalRotation": {
                    "!type": "fn() -> +pc.Quat",
                    "!doc": "Get the rotation in local space for the specified GraphNode. The rotation is returned as a quaternion. The returned quaternion should be considered read-only. To update the local rotation, use pc.GraphNode#setLocalRotation.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphNode.html#getLocalRotation"
                },
                "getLocalScale": {
                    "!type": "fn() -> +pc.Vec3",
                    "!doc": "Get the scale in local space for the specified GraphNode. The scale is returned as a 3-dimensional vector. The returned vector should be considered read-only. To update the local scale, use pc.GraphNode#setLocalScale.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphNode.html#getLocalScale"
                },
                "getLocalTransform": {
                    "!type": "fn() -> +pc.Mat4",
                    "!doc": "Get the local transform matrix for this graph node. This matrix is the transform relative to the node's parent's world transformation matrix.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphNode.html#getLocalTransform"
                },
                "getName": {
                    "!type": "fn() -> string",
                    "!doc": "Get the human-readable name for this graph node. Note the name is not guaranteed to be unique. For Entities, this is the name that is set in the PlayCanvas Editor.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphNode.html#getName"
                },
                "getPosition": {
                    "!type": "fn() -> +pc.Vec3",
                    "!doc": "Get the world space position for the specified GraphNode. The value returned by this function should be considered read-only. In order to set the world-space position of the graph node, use pc.GraphNode#setPosition.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphNode.html#getPosition"
                },
                "getRotation": {
                    "!type": "fn() -> +pc.Quat",
                    "!doc": "Get the world space rotation for the specified GraphNode in quaternion form. The value returned by this function should be considered read-only. In order to set the world-space rotation of the graph node, use pc.GraphNode#setRotation.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphNode.html#getRotation"
                },
                "getWorldTransform": {
                    "!type": "fn() -> +pc.Mat4",
                    "!doc": "Get the world transformation matrix for this graph node.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphNode.html#getWorldTransform"
                },
                "reparent": {
                    "!type": "fn(parent: +pc.GraphNode, index: number)",
                    "!doc": "Remove graph node from current parent and add as child to new parent",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphNode.html#reparent"
                },
                "setLocalEulerAngles": {
                    "!type": "fn(e: +pc.Vec3)",
                    "!doc": "Sets the local space rotation of the specified graph node using euler angles. Eulers are interpreted in XYZ order. Eulers must be specified in degrees.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphNode.html#setLocalEulerAngles"
                },
                "setLocalPosition": {
                    "!type": "fn(pos: +pc.Vec3)",
                    "!doc": "Sets the local space position of the specified graph node.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphNode.html#setLocalPosition"
                },
                "setLocalRotation": {
                    "!type": "fn(q: +pc.Quat)",
                    "!doc": "Sets the local space rotation of the specified graph node.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphNode.html#setLocalRotation"
                },
                "setLocalScale": {
                    "!type": "fn(scale: +pc.Vec3)",
                    "!doc": "Sets the local space scale factor of the specified graph node.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphNode.html#setLocalScale"
                },
                "setName": {
                    "!type": "fn(name: string)",
                    "!doc": "Sets the non-unique name for this graph node.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphNode.html#setName"
                },
                "setPosition": {
                    "!type": "fn(position: +pc.Vec3)",
                    "!doc": "Sets the world space position of the specified graph node.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphNode.html#setPosition"
                },
                "setRotation": {
                    "!type": "fn(rot: +pc.Quat)",
                    "!doc": "Sets the world space rotation of the specified graph node using a quaternion.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphNode.html#setRotation"
                },
                "setEulerAngles": {
                    "!type": "fn(angles: +pc.Vec3)",
                    "!doc": "Sets the world space orientation of the specified graph node using Euler angles. Angles are specified in degress in XYZ order.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphNode.html#setEulerAngles"
                },
                "addChild": {
                    "!type": "fn(node: +pc.GraphNode)",
                    "!doc": "Add a new child to the child list and update the parent value of the child node",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphNode.html#addChild"
                },
                "insertChild": {
                    "!type": "fn(node: +pc.GraphNode, index: number)",
                    "!doc": "Insert a new child to the child list at the specified index and update the parent value of the child node",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphNode.html#insertChild"
                },
                "removeChild": {
                    "!type": "fn(node: +pc.GraphNode)",
                    "!doc": "Remove the node from the child list and update the parent value of the child.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphNode.html#removeChild"
                },
                "addLabel": {
                    "!type": "fn(label: string)",
                    "!doc": "Add a string label to this graph node, labels can be used to group and filter nodes. For example, the 'enemies' label could be applied to a group of NPCs who are enemies.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphNode.html#addLabel"
                },
                "getLabels": {
                    "!type": "fn() -> []",
                    "!doc": "Get an array of all labels applied to this graph node.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphNode.html#getLabels"
                },
                "hasLabel": {
                    "!type": "fn(label: string) -> Boolean",
                    "!doc": "Test if a label has been applied to this graph node.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphNode.html#hasLabel"
                },
                "removeLabel": {
                    "!type": "fn(label: string)",
                    "!doc": "Remove label from this graph node.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphNode.html#removeLabel"
                },
                "findByLabel": {
                    "!type": "fn(label: string, results?: [+pc.GraphNode]) -> [+pc.GraphNode]",
                    "!doc": "Find all graph nodes from the root and all descendants with the label.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphNode.html#findByLabel"
                },
                "syncHierarchy": {
                    "!type": "fn()",
                    "!doc": "Updates the world transformation matrices at this node and all of its descendants.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphNode.html#syncHierarchy"
                },
                "lookAt": {
                    "!type": "fn(target: +pc.Vec3, up?: +pc.Vec3)",
                    "!doc": "Reorients the graph node so that the negative z axis points towards the target.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphNode.html#lookAt"
                },
                "translate": {
                    "!type": "fn(translation: +pc.Vec3)",
                    "!doc": "Translates the graph node in world space by the specified translation vector.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphNode.html#translate"
                },
                "translateLocal": {
                    "!type": "fn(translation: +pc.Vec3)",
                    "!doc": "Translates the graph node in local space by the specified translation vector.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphNode.html#translateLocal"
                },
                "rotate": {
                    "!type": "fn(rot: +pc.Vec3)",
                    "!doc": "Rotates the graph node in world space by the specified Euler angles. Eulers are specified in degrees in XYZ order.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphNode.html#rotate"
                },
                "rotateLocal": {
                    "!type": "fn(rot: +pc.Vec3)",
                    "!doc": "Rotates the graph node in local space by the specified Euler angles. Eulers are specified in degrees in XYZ order.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphNode.html#rotateLocal"
                }
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GraphNode.html"
        },
        "BasicMaterial": {
            "!type": "fn()",
            "!doc": "A Basic material is is for rendering unlit geometry, either using a constant color or a color map modulated with a color.",
            "prototype": {
                "color": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.BasicMaterial.html#color",
                    "!doc": "The flat color of the material (RGBA, where each component is 0 to 1).",
                    "!type": "+pc.Color"
                },
                "colorMap": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.BasicMaterial.html#colorMap",
                    "!doc": "The color map of the material. If specified, the color map is modulated by the color property.",
                    "!type": "+pc.Texture"
                },
                "clone": {
                    "!type": "fn() -> +pc.BasicMaterial",
                    "!doc": "Duplicates a Basic material. All properties are duplicated except textures where only the references are copied.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.BasicMaterial.html#clone"
                }
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.BasicMaterial.html"
        },
        "Material": {
            "!type": "fn()",
            "!doc": "A material.",
            "prototype": {
                "getName": {
                    "!type": "fn() -> string",
                    "!doc": "Returns the string name of the specified material. This name is not necessarily unique. Material names set by an artist within the modelling application should be preserved in the PlayCanvas runtime.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Material.html#getName"
                },
                "setName": {
                    "!type": "fn(name: string)",
                    "!doc": "Sets the string name of the specified material. This name does not have to be unique.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Material.html#setName"
                },
                "getParameter": {
                    "!type": "fn(name: string) -> object",
                    "!doc": "Retrieves the specified shader parameter from a material.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Material.html#getParameter"
                },
                "setParameter": {
                    "!type": "fn(name: string, data: number)",
                    "!doc": "Sets a shader parameter on a material.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Material.html#setParameter"
                },
                "deleteParameter": {
                    "!type": "fn(name: string)",
                    "!doc": "Deletes a shader parameter on a material.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Material.html#deleteParameter"
                },
                "setParameters": {
                    "!type": "fn()",
                    "!doc": "Pushes all material parameters into scope.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Material.html#setParameters"
                },
                "getShader": {
                    "!type": "fn() -> +pc.Shader",
                    "!doc": "Retrieves the shader assigned to the specified material.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Material.html#getShader"
                },
                "setShader": {
                    "!type": "fn(shader: +pc.Shader)",
                    "!doc": "Assigns a shader to the specified material.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Material.html#setShader"
                }
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Material.html"
        },
        "DepthMaterial": {
            "!type": "fn()",
            "!doc": "A Depth material is is for rendering linear depth values to a render target.",
            "prototype": {
                "clone": {
                    "!type": "fn() -> +pc.DepthMaterial",
                    "!doc": "Duplicates a Depth material.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.DepthMaterial.html#clone"
                }
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.DepthMaterial.html"
        },
        "Mesh": {
            "!type": "fn()",
            "!doc": "A graphical primitive.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#Mesh"
        },
        "MeshInstance": {
            "!type": "fn(node: +pc.GraphNode, mesh: +pc.Mesh, material: +pc.Material)",
            "!doc": "A instance of a pc.Mesh. A single mesh can be referenced by many instances that can have different transforms and materials.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#MeshInstance"
        },
        "PickMaterial": {
            "!type": "fn()",
            "!doc": "A Pick material is for rendering a scene into the frame buffer such that different meshes have different colors that can be queried on a frame buffer read at a specific pixel (normally a click coordinate). This implements frame buffer picking.",
            "prototype": {
                "clone": {
                    "!type": "fn() -> +pc.PickMaterial",
                    "!doc": "Duplicates a Basic material. All properties are duplicated except textures where only the references are copied.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PickMaterial.html#clone"
                }
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PickMaterial.html"
        },
        "Model": {
            "!type": "fn()",
            "!doc": "A model is a graphical object that can be added to or removed from a scene. It contains a hierarchy and any number of mesh instances.",
            "prototype": {
                "graph": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Model.html#graph",
                    "!doc": "The root node of the model's graph node hierarchy.",
                    "!type": "+pc.GraphNode"
                },
                "meshInstances": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Model.html#meshInstances",
                    "!doc": "An array of meshInstances contained in this model.",
                    "!type": "[+pc.MeshInstance]"
                },
                "clone": {
                    "!type": "fn() -> +pc.Model",
                    "!doc": "Clones a model. The returned model has a newly created hierarchy and mesh instances, but meshes are shared between the clone and the specified model.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Model.html#clone"
                },
                "generateWireframe": {
                    "!type": "fn()",
                    "!doc": "Generates the necessary internal data for a model to be renderable as wireframe. Once this function has been called, any mesh instance in the model can have its renderStyle property set to pc.RENDERSTYLE_WIREFRAME",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Model.html#generateWireframe"
                }
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Model.html"
        },
        "Skin": {
            "!type": "fn(graphicsDevice: +pc.GraphicsDevice)",
            "!doc": "A skin contains data about the bones in a hierarchy that drive a skinned mesh animation. Specifically, the skin stores an array of bone names and for each bone, a inverse bind matrix. These matrices are instrumental in the mathematics of vertex skinning.",
            "prototype": {
                "ibp": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Skin.html#ibp",
                    "!doc": "The array of inverse bind matrices.",
                    "!type": "[]"
                },
                "boneNames": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Skin.html#boneNames",
                    "!doc": "The array of bone names for the bones referenced by this skin.",
                    "!type": "[]"
                }
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Skin.html"
        },
        "SkinInstance": {
            "!type": "fn(skin: +pc.Skin)",
            "!doc": "A skin instance is responsible for generating the matrix palette that is used to skin vertices from object space to world space.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#SkinInstance"
        },
        "PhongMaterial": {
            "!type": "fn()",
            "!doc": "A Phong material is the main, general purpose material that is most often used for rendering. It can approximate a wide variety of surface types and can simlulate dynamic reflected light.",
            "prototype": {
                "ambient": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PhongMaterial.html#ambient",
                    "!doc": "The ambient color of the material. This color value is 3-component (RGB), where each component is between 0 and 1.",
                    "!type": "+pc.Color"
                },
                "diffuse": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PhongMaterial.html#diffuse",
                    "!doc": "The diffuse color of the material. This color value is 3-component (RGB), where each component is between 0 and 1.",
                    "!type": "+pc.Color"
                },
                "diffuseMap": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PhongMaterial.html#diffuseMap",
                    "!doc": "The diffuse map of the material. This must be a 2D texture rather than a cube map. If this property is set to a valid texture, the texture is used as the source for diffuse color in preference to the 'diffuse' property.",
                    "!type": "+pc.Texture"
                },
                "diffuseMapTiling": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PhongMaterial.html#diffuseMapTiling",
                    "!doc": "Controls the 2D tiling of the diffuse map.",
                    "!type": "+pc.Vec2"
                },
                "diffuseMapOffset": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PhongMaterial.html#diffuseMapOffset",
                    "!doc": "Controls the 2D offset of the diffuse map. Each component is between 0 and 1.",
                    "!type": "+pc.Vec2"
                },
                "specular": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PhongMaterial.html#specular",
                    "!doc": "The specular color of the material. This color value is 3-component (RGB),",
                    "!type": "+pc.Color"
                },
                "specularMap": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PhongMaterial.html#specularMap",
                    "!doc": "The per-pixel specular map of the material. This must be a 2D texture rather than a cube map. If this property is set to a valid texture, the texture is used as the source for specular color in preference to the 'specular' property.",
                    "!type": "+pc.Texture"
                },
                "specularMapTiling": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PhongMaterial.html#specularMapTiling",
                    "!doc": "Controls the 2D tiling of the specular map.",
                    "!type": "+pc.Vec2"
                },
                "specularMapOffset": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PhongMaterial.html#specularMapOffset",
                    "!doc": "Controls the 2D offset of the specular map. Each component is between 0 and 1.",
                    "!type": "+pc.Vec2"
                },
                "metalness": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PhongMaterial.html#metalness",
                    "!doc": "Defines how much the surface is metallic. From 0 (dielectric) to 1 (metal). This can be used as alternative to specular color to save space. Metallic surfaces have their reflection tinted with diffuse color.",
                    "!type": "number"
                },
                "metalnessMap": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PhongMaterial.html#metalnessMap",
                    "!doc": "Monochrome metalness map.",
                    "!type": "+pc.Texture"
                },
                "useMetalness": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PhongMaterial.html#useMetalness",
                    "!doc": "Use metalness properties instead of specular.",
                    "!type": "Boolean"
                },
                "shininess": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PhongMaterial.html#shininess",
                    "!doc": "Defines glossiness of the material from 0 (rough) to 100 (mirror). A higher shininess value results in a more focussed specular highlight.",
                    "!type": "number"
                },
                "glossMap": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PhongMaterial.html#glossMap",
                    "!doc": "The per-pixel gloss of the material. This must be a 2D texture rather than a cube map. If this property is set to a valid texture, the texture is used as the source for shininess in preference to the 'shininess' property.",
                    "!type": "+pc.Texture"
                },
                "glossMapTiling": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PhongMaterial.html#glossMapTiling",
                    "!doc": "Controls the 2D tiling of the gloss map.",
                    "!type": "+pc.Vec2"
                },
                "glossMapOffset": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PhongMaterial.html#glossMapOffset",
                    "!doc": "Controls the 2D offset of the gloss map. Each component is between 0 and 1.",
                    "!type": "+pc.Vec2"
                },
                "refraction": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PhongMaterial.html#refraction",
                    "!doc": "Defines the visibility of refraction. Material can refract the same cube map as used for reflections.",
                    "!type": "number"
                },
                "refractionIndex": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PhongMaterial.html#refractionIndex",
                    "!doc": "Defines the index of refraction, i.e. the amount of distortion. The value is calculated as (outerIor / surfaceIor), where inputs are measured indices of refraction, the one around the object and the one of it's own surface. In most situations outer medium is air, so outerIor will be approximately 1. Then you only need to do (1.0 / surfaceIor).",
                    "!type": "number"
                },
                "emissive": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PhongMaterial.html#emissive",
                    "!doc": "The emissive color of the material. This color value is 3-component (RGB), where each component is between 0 and 1.",
                    "!type": "+pc.Vec3"
                },
                "emissiveMap": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PhongMaterial.html#emissiveMap",
                    "!doc": "The emissive map of the material. This must be a 2D texture rather than a cube map. If this property is set to a valid texture, the texture is used as the source for emissive color in preference to the 'emissive' property.",
                    "!type": "+pc.Texture"
                },
                "emissiveIntensity": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PhongMaterial.html#emissiveIntensity",
                    "!doc": "Emissive color multiplier.",
                    "!type": "number"
                },
                "emissiveMapTiling": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PhongMaterial.html#emissiveMapTiling",
                    "!doc": "Controls the 2D tiling of the emissive map.",
                    "!type": "+pc.Vec2"
                },
                "emissiveMapOffset": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PhongMaterial.html#emissiveMapOffset",
                    "!doc": "Controls the 2D offset of the emissive map. Each component is between 0 and 1.",
                    "!type": "+pc.Vec2"
                },
                "opacity": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PhongMaterial.html#opacity",
                    "!doc": "The opacity of the material. This value can be between 0 and 1, where 0 is fully transparent and 1 is fully opaque. If you want the material to be transparent you also need to set the pc.PhongMaterial#blendType to pc.BLEND_NORMAL or pc.BLEND_ADDITIVE.",
                    "!type": "number"
                },
                "opacityMap": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PhongMaterial.html#opacityMap",
                    "!doc": "The opacity map of the material. This must be a 2D texture rather than a cube map. If this property is set to a valid texture, the texture is used as the source for opacity in preference to the 'opacity' property. If you want the material to be transparent you also need to set the pc.PhongMaterial#blendType to pc.BLEND_NORMAL or pc.BLEND_ADDITIVE.",
                    "!type": "+pc.Texture"
                },
                "opacityMapTiling": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PhongMaterial.html#opacityMapTiling",
                    "!doc": "Controls the 2D tiling of the opacity map.",
                    "!type": "+pc.Vec2"
                },
                "opacityMapOffset": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PhongMaterial.html#opacityMapOffset",
                    "!doc": "Controls the 2D offset of the opacity map. Each component is between 0 and 1.",
                    "!type": "+pc.Vec2"
                },
                "blendType": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PhongMaterial.html#blendType",
                    "!doc": "The type of blending for this material. Can be one of the following valus: pc.BLEND_NONE, pc.BLEND_NORMAL, pc.BLEND_ADDITIVE.",
                    "!type": "number"
                },
                "normalMap": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PhongMaterial.html#normalMap",
                    "!doc": "The normal map of the material. This must be a 2D texture rather than a cube map. The texture must contains normalized, tangent space normals.",
                    "!type": "+pc.Texture"
                },
                "normalMapTiling": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PhongMaterial.html#normalMapTiling",
                    "!doc": "Controls the 2D tiling of the normal map.",
                    "!type": "+pc.Vec2"
                },
                "normalMapOffset": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PhongMaterial.html#normalMapOffset",
                    "!doc": "Controls the 2D offset of the normal map. Each component is between 0 and 1.",
                    "!type": "+pc.Vec2"
                },
                "heightMap": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PhongMaterial.html#heightMap",
                    "!doc": "The height map of the material. This must be a 2D texture rather than a cube map. The texture contain values defining the height of the surface at that point where darker pixels are lower and lighter pixels are higher.",
                    "!type": "+pc.Texture"
                },
                "heightMapTiling": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PhongMaterial.html#heightMapTiling",
                    "!doc": "Controls the 2D tiling of the height map.",
                    "!type": "+pc.Vec2"
                },
                "heightMapOffset": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PhongMaterial.html#heightMapOffset",
                    "!doc": "Controls the 2D offset of the height map. Each component is between 0 and 1.",
                    "!type": "+pc.Vec2"
                },
                "bumpiness": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PhongMaterial.html#bumpiness",
                    "!doc": "The bumpiness of the material. This value scales the assigned normal map and can be between 0 and 1, where 0 shows no contribution from the normal map and 1 results in a full contribution.",
                    "!type": "number"
                },
                "heightMapFactor": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PhongMaterial.html#heightMapFactor",
                    "!doc": "Height map multiplier. Height maps are used to create a parallax mapping effect and modifying this value will alter the strength of the parallax effect.",
                    "!type": "number"
                },
                "sphereMap": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PhongMaterial.html#sphereMap",
                    "!doc": "The spherical environment map of the material.",
                    "!type": "+pc.Texture"
                },
                "cubeMap": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PhongMaterial.html#cubeMap",
                    "!doc": "The cubic environment map of the material.",
                    "!type": "+pc.Texture"
                },
                "reflectivity": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PhongMaterial.html#reflectivity",
                    "!doc": "The reflectivity of the material. This value scales the reflection map and can be between 0 and 1, where 0 shows no reflection and 1 is fully reflective.",
                    "!type": "number"
                },
                "lightMap": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PhongMaterial.html#lightMap",
                    "!doc": "The light map of the material. This must be a 2D texture rather than a cube map.",
                    "!type": "+pc.Texture"
                },
                "ambientTint": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PhongMaterial.html#ambientTint",
                    "!doc": "Enables scene ambient multiplication by material ambient color.",
                    "!type": "Boolean"
                },
                "diffuseMapTint": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PhongMaterial.html#diffuseMapTint",
                    "!doc": "Enables diffuseMap multiplication by diffuse color.",
                    "!type": "Boolean"
                },
                "specularMapTint": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PhongMaterial.html#specularMapTint",
                    "!doc": "Enables specularMap multiplication by specular color.",
                    "!type": "Boolean"
                },
                "emissiveMapTint": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PhongMaterial.html#emissiveMapTint",
                    "!doc": "Enables emissiveMap multiplication by emissive color.",
                    "!type": "Boolean"
                },
                "aoMap": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PhongMaterial.html#aoMap",
                    "!doc": "Baked ambient occlusion map. Modulates ambient color.",
                    "!type": "+pc.Texture"
                },
                "occludeSpecular": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PhongMaterial.html#occludeSpecular",
                    "!doc": "Uses aoMap to occlude specular/reflection. It's a hack, because real specular occlusion is view-dependent. However, it's much better than nothing.",
                    "!type": "Boolean"
                },
                "occludeSpecularIntensity": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PhongMaterial.html#occludeSpecularIntensity",
                    "!doc": "Controls visibility of specular occlusion.",
                    "!type": "number"
                },
                "specularAntialias": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PhongMaterial.html#specularAntialias",
                    "!doc": "Enables Toksvig AA for mipmapped normal maps with specular.",
                    "!type": "Boolean"
                },
                "conserveEnergy": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PhongMaterial.html#conserveEnergy",
                    "!doc": "Defines how diffuse and specular components are combined when Fresnel is on.",
                    "!type": "Boolean"
                },
                "shadingModel": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PhongMaterial.html#shadingModel",
                    "!doc": "Defines the shading model. <ul> <li><strong>pc.SPECULAR_PHONG</strong>: Phong without energy conservation. You should only use it as a backwards compatibility with older projects.</li> <li><strong>pc.SPECULAR_BLINN</strong>: Energy-conserving Blinn-Phong.</li> </ul>",
                    "!type": "number"
                },
                "fresnelModel": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PhongMaterial.html#fresnelModel",
                    "!doc": "Defines the formula used for Fresnel effect. <ul> <li><strong>pc.FRESNEL_NONE</strong>: No Fresnel.</li> <li><strong>pc.FRESNEL_SCHLICK</strong>: Schlick's approximation of Fresnel (recommended). Parameterized by specular color.</li> </ul>",
                    "!type": "number"
                },
                "clone": {
                    "!type": "fn() -> +pc.PhongMaterial",
                    "!doc": "Duplicates a Phong material. All properties are duplicated except textures where only the references are copied.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PhongMaterial.html#clone"
                }
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PhongMaterial.html"
        },
        "Picker": {
            "!type": "fn(device: +pc.GraphicsDevice, width: number, height: number)",
            "!doc": "Picker object used to select mesh instances from screen coordinates.",
            "prototype": {
                "width": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Picker.html#width",
                    "!doc": "Width of the pick buffer in pixels (read-only).",
                    "!type": "number"
                },
                "height": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Picker.html#height",
                    "!doc": "Height of the pick buffer in pixels (read-only).",
                    "!type": "number"
                },
                "renderTarget": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Picker.html#renderTarget",
                    "!doc": "The render target used by the picker internally (read-only).",
                    "!type": "+pc.RenderTarget"
                },
                "getSelection": {
                    "!type": "fn(rect: object) -> []",
                    "!doc": "Return the list of mesh instances selected by the specified rectangle in the previously prepared pick buffer.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Picker.html#getSelection"
                },
                "prepare": {
                    "!type": "fn(camera: +pc.Camera, scene: +pc.Scene)",
                    "!doc": "Primes the pick buffer with a rendering of the specified models from the point of view of the supplied camera. Once the pick buffer has been prepared, pc.Picker#getSelection can be called multiple times on the same picker object. Therefore, if the models or camera do not change in any way, pc.Picker#prepare does not need to be called again.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Picker.html#prepare"
                },
                "resize": {
                    "!type": "fn(width: number, height: number)",
                    "!doc": "Sets the resolution of the pick buffer. The pick buffer resolution does not need to match the resolution of the corresponding frame buffer use for general rendering of the 3D scene. However, the lower the resolution of the pick buffer, the less accurate the selection results returned by pc.Picker#getSelection. On the other hand, smaller pick buffers will yield greater performance, so there is a trade off.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Picker.html#resize"
                }
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Picker.html"
        },
        "Animation": {
            "!type": "fn()",
            "!doc": "An animation is a sequence of keyframe arrays which map to the nodes of a skeletal hierarchy. It controls how the nodes of the hierarchy are transformed over time.",
            "prototype": {
                "getDuration": {
                    "!type": "fn() -> number",
                    "!doc": "Returns the duration of the animation in seconds.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Animation.html#getDuration"
                },
                "getName": {
                    "!type": "fn() -> string",
                    "!doc": "Returns the human-readable name of the animation.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Animation.html#getName"
                },
                "getNode": {
                    "!type": "fn() -> +pc.Node",
                    "!doc": "",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Animation.html#getNode"
                },
                "getNodes": {
                    "!type": "fn() -> []",
                    "!doc": "",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Animation.html#getNodes"
                },
                "setDuration": {
                    "!type": "fn(duration: number)",
                    "!doc": "Sets the duration of the specified animation in seconds.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Animation.html#setDuration"
                },
                "setName": {
                    "!type": "fn(name: number)",
                    "!doc": "Sets the human-readable name of the specified animation.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Animation.html#setName"
                },
                "setNode": {
                    "!type": "fn()",
                    "!doc": "",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Animation.html#setNode"
                }
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Animation.html"
        },
        "calculateTangents": {
            "!type": "fn(vertices: [], normals: [], uvs: [], indices: []) -> []",
            "!doc": "Generates tangent information from the specified vertices, normals, texture coordinates and triangle indices.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#calculateTangents"
        },
        "createMesh": {
            "!type": "fn(device: +pc.GraphicsDevice, positions: [], opts: object) -> +pc.Mesh",
            "!doc": "Creates a pc.Mesh object from the supplied vertex information and topology.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#createMesh"
        },
        "createTorus": {
            "!type": "fn(device: +pc.GraphicsDevice, opts: object) -> +pc.Mesh",
            "!doc": "<p>Creates a procedural torus-shaped mesh.</p> <p>The size, shape and tesselation properties of the torus can be controlled via function parameters. By default, the function will create a torus in the XZ-plane with a tube radius of 0.2, a ring radius of 0.3, 20 segments and 30 sides.</p> <p>Note that the torus is created with UVs in the range of 0 to 1. Additionally, tangent information is generated into the vertex buffer of the torus's mesh.</p>",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#createTorus"
        },
        "createCylinder": {
            "!type": "fn(device: +pc.GraphicsDevice, opts: object) -> +pc.Mesh",
            "!doc": "<p>Creates a procedural cylinder-shaped mesh.</p> <p>The size, shape and tesselation properties of the cylinder can be controlled via function parameters. By default, the function will create a cylinder standing vertically centred on the XZ-plane with a radius of 0.5, a height of 1.0, 1 height segment and 20 cap segments.</p> <p>Note that the cylinder is created with UVs in the range of 0 to 1. Additionally, tangent information is generated into the vertex buffer of the cylinder's mesh.</p>",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#createCylinder"
        },
        "createCapsule": {
            "!type": "fn(device: +pc.GraphicsDevice, opts: object) -> +pc.Mesh",
            "!doc": "<p>Creates a procedural capsule-shaped mesh.</p> <p>The size, shape and tesselation properties of the capsule can be controlled via function parameters. By default, the function will create a capsule standing vertically centred on the XZ-plane with a radius of 0.25, a height of 1.0, 1 height segment and 10 cap segments.</p> <p>Note that the capsule is created with UVs in the range of 0 to 1. Additionally, tangent information is generated into the vertex buffer of the capsule's mesh.</p>",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#createCapsule"
        },
        "createCone": {
            "!type": "fn(device: +pc.GraphicsDevice, opts: object) -> +pc.Mesh",
            "!doc": "<p>Creates a procedural cone-shaped mesh.</p> <p>The size, shape and tesselation properties of the cone can be controlled via function parameters. By default, the function will create a cone standing vertically centred on the XZ-plane with a base radius of 0.5, a height of 1.0, 5 height segments and 20 cap segments.</p> <p>Note that the cone is created with UVs in the range of 0 to 1. Additionally, tangent information is generated into the vertex buffer of the cone's mesh.</p>",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#createCone"
        },
        "createSphere": {
            "!type": "fn(device: +pc.GraphicsDevice, opts: object) -> +pc.Mesh",
            "!doc": "<p>Creates a procedural sphere-shaped mesh.</p> <p>The size and tesselation properties of the sphere can be controlled via function parameters. By default, the function will create a sphere centred on the object space origin with a radius of 0.5 and 16 segments in both longitude and latitude.</p> <p>Note that the sphere is created with UVs in the range of 0 to 1. Additionally, tangent information is generated into the vertex buffer of the sphere's mesh.</p>",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#createSphere"
        },
        "createPlane": {
            "!type": "fn(device: +pc.GraphicsDevice, opts: object) -> +pc.Mesh",
            "!doc": "<p>Creates a procedural plane-shaped mesh.</p> <p>The size and tesselation properties of the plane can be controlled via function parameters. By default, the function will create a plane centred on the object space origin with a width and length of 1.0 and 5 segments in either axis (50 triangles). The normal vector of the plane is aligned along the positive Y axis.</p> <p>Note that the plane is created with UVs in the range of 0 to 1. Additionally, tangent information is generated into the vertex buffer of the plane's mesh.</p>",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#createPlane"
        },
        "createBox": {
            "!type": "fn(device: +pc.GraphicsDevice, opts: object) -> +pc.Mesh",
            "!doc": "<p>Creates a procedural box-shaped mesh.</p> <p>The size, shape and tesselation properties of the box can be controlled via function parameters. By default, the function will create a box centred on the object space origin with a width, length and height of 1.0 unit and 10 segments in either axis (50 triangles per face).</p> <p>Note that the box is created with UVs in the range of 0 to 1 on each face. Additionally, tangent information is generated into the vertex buffer of the box's mesh.</p>",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#createBox"
        },
        "Skeleton": {
            "!type": "fn()",
            "!doc": "A skeleton.",
            "prototype": {
                "addTime": {
                    "!type": "fn(delta: number)",
                    "!doc": "Progresses the animation assigned to the specified skeleton by the supplied time delta. If the delta takes the animation passed its end point, if the skeleton is set to loop, the animation will continue from the beginning. Otherwise, the animation's current time will remain at its duration (i.e. the end).",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Skeleton.html#addTime"
                },
                "blend": {
                    "!type": "fn(skel1: +pc.Skeleton, skel2: +pc.Skeleton, alpha: number)",
                    "!doc": "Blends two skeletons together.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Skeleton.html#blend"
                },
                "getAnimation": {
                    "!type": "fn() -> +pc.Animation",
                    "!doc": "Returns the animation currently assigned to the specified skeleton.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Skeleton.html#getAnimation"
                },
                "getCurrentTime": {
                    "!type": "fn() -> number",
                    "!doc": "Returns the current time of the currently active animation as set on the specified skeleton. This value will be between zero and the duration of the animation.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Skeleton.html#getCurrentTime"
                },
                "setCurrentTime": {
                    "!type": "fn(time: number)",
                    "!doc": "Sets the current time of the currently active animation as set on the specified skeleton. This value must be between zero and the duration of the animation.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Skeleton.html#setCurrentTime"
                },
                "getNumNodes": {
                    "!type": "fn() -> number",
                    "!doc": "Returns the number of nodes held by the specified skeleton.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Skeleton.html#getNumNodes"
                },
                "setAnimation": {
                    "!type": "fn(animation: +pc.Animation)",
                    "!doc": "Sets an animation on the specified skeleton.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Skeleton.html#setAnimation"
                },
                "setGraph": {
                    "!type": "fn(graph: +pc.GraphNode)",
                    "!doc": "Links a skeleton to a node hierarchy. The nodes animated skeleton are then subsequently used to drive the local transformation matrices of the node hierarchy.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Skeleton.html#setGraph"
                },
                "updateGraph": {
                    "!type": "fn()",
                    "!doc": "Synchronizes the currently linked node hierarchy with the current state of the skeleton. Internally, this function converts the interpolated keyframe at each node in the skeleton into the local transformation matrix at each corresponding node in the linked node hierarchy.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Skeleton.html#updateGraph"
                },
                "setLooping": {
                    "!type": "fn(looping: Boolean)",
                    "!doc": "Specified whether a skeleton should loop its animation or not. If the animation loops, it will wrap back to the start when adding time to the skeleton beyond the duration of the animation. Otherwise, the animation stops at its end after a single play through.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Skeleton.html#setLooping"
                },
                "getLooping": {
                    "!type": "fn() -> Boolean",
                    "!doc": "Queries the specified skeleton to determine whether it is looping its animation.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Skeleton.html#getLooping"
                }
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Skeleton.html"
        },
        "EVENT_KEYDOWN": {
            "!type": "?",
            "!doc": "Name of event fired when a key is pressed",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#EVENT_KEYDOWN"
        },
        "EVENT_KEYUP": {
            "!type": "?",
            "!doc": "Name of event fired when a key is released",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#EVENT_KEYUP"
        },
        "EVENT_MOUSEDOWN": {
            "!type": "?",
            "!doc": "Name of event fired when a mouse button is pressed",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#EVENT_MOUSEDOWN"
        },
        "EVENT_MOUSEMOVE": {
            "!type": "?",
            "!doc": "Name of event fired when the mouse is moved",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#EVENT_MOUSEMOVE"
        },
        "EVENT_MOUSEUP": {
            "!type": "?",
            "!doc": "Name of event fired when a mouse button is released",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#EVENT_MOUSEUP"
        },
        "EVENT_MOUSEWHEEL": {
            "!type": "?",
            "!doc": "Name of event fired when the mouse wheel is rotated",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#EVENT_MOUSEWHEEL"
        },
        "EVENT_TOUCHSTART": {
            "!type": "?",
            "!doc": "Name of event fired when a new touch occurs. For example, a finger is placed on the device.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#EVENT_TOUCHSTART"
        },
        "EVENT_TOUCHEND": {
            "!type": "?",
            "!doc": "Name of event fired when touch ends. For example, a finger is lifted off the device.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#EVENT_TOUCHEND"
        },
        "EVENT_TOUCHMOVE": {
            "!type": "?",
            "!doc": "Name of event fired when a touch moves.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#EVENT_TOUCHMOVE"
        },
        "EVENT_TOUCHCANCEL": {
            "!type": "?",
            "!doc": "Name of event fired when a touch point is interupted in some way. The exact reasons for cancelling a touch can vary from device to device. For example, a modal alert pops up during the interaction; the touch point leaves the document area; or there are more touch points than the device supports, in which case the earliest touch point is canceled.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#EVENT_TOUCHCANCEL"
        },
        "KEY_BACKSPACE": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_BACKSPACE"
        },
        "KEY_TAB": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_TAB"
        },
        "KEY_RETURN": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_RETURN"
        },
        "KEY_ENTER": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_ENTER"
        },
        "KEY_SHIFT": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_SHIFT"
        },
        "KEY_CONTROL": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_CONTROL"
        },
        "KEY_ALT": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_ALT"
        },
        "KEY_PAUSE": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_PAUSE"
        },
        "KEY_CAPS_LOCK": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_CAPS_LOCK"
        },
        "KEY_ESCAPE": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_ESCAPE"
        },
        "KEY_SPACE": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_SPACE"
        },
        "KEY_PAGE_UP": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_PAGE_UP"
        },
        "KEY_PAGE_DOWN": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_PAGE_DOWN"
        },
        "KEY_END": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_END"
        },
        "KEY_HOME": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_HOME"
        },
        "KEY_LEFT": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_LEFT"
        },
        "KEY_UP": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_UP"
        },
        "KEY_RIGHT": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_RIGHT"
        },
        "KEY_DOWN": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_DOWN"
        },
        "KEY_PRINT_SCREEN": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_PRINT_SCREEN"
        },
        "KEY_INSERT": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_INSERT"
        },
        "KEY_DELETE": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_DELETE"
        },
        "KEY_0": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_0"
        },
        "KEY_1": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_1"
        },
        "KEY_2": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_2"
        },
        "KEY_3": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_3"
        },
        "KEY_4": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_4"
        },
        "KEY_5": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_5"
        },
        "KEY_6": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_6"
        },
        "KEY_7": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_7"
        },
        "KEY_8": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_8"
        },
        "KEY_9": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_9"
        },
        "KEY_SEMICOLON": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_SEMICOLON"
        },
        "KEY_EQUAL": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_EQUAL"
        },
        "KEY_A": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_A"
        },
        "KEY_B": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_B"
        },
        "KEY_C": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_C"
        },
        "KEY_D": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_D"
        },
        "KEY_E": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_E"
        },
        "KEY_F": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_F"
        },
        "KEY_G": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_G"
        },
        "KEY_H": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_H"
        },
        "KEY_I": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_I"
        },
        "KEY_J": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_J"
        },
        "KEY_K": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_K"
        },
        "KEY_L": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_L"
        },
        "KEY_M": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_M"
        },
        "KEY_N": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_N"
        },
        "KEY_O": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_O"
        },
        "KEY_P": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_P"
        },
        "KEY_Q": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_Q"
        },
        "KEY_R": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_R"
        },
        "KEY_S": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_S"
        },
        "KEY_T": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_T"
        },
        "KEY_U": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_U"
        },
        "KEY_V": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_V"
        },
        "KEY_W": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_W"
        },
        "KEY_X": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_X"
        },
        "KEY_Y": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_Y"
        },
        "KEY_Z": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_Z"
        },
        "KEY_WINDOWS": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_WINDOWS"
        },
        "KEY_CONTEXT_MENU": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_CONTEXT_MENU"
        },
        "KEY_NUMPAD_0": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_NUMPAD_0"
        },
        "KEY_NUMPAD_1": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_NUMPAD_1"
        },
        "KEY_NUMPAD_2": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_NUMPAD_2"
        },
        "KEY_NUMPAD_3": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_NUMPAD_3"
        },
        "KEY_NUMPAD_4": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_NUMPAD_4"
        },
        "KEY_NUMPAD_5": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_NUMPAD_5"
        },
        "KEY_NUMPAD_6": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_NUMPAD_6"
        },
        "KEY_NUMPAD_7": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_NUMPAD_7"
        },
        "KEY_NUMPAD_8": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_NUMPAD_8"
        },
        "KEY_NUMPAD_9": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_NUMPAD_9"
        },
        "KEY_MULTIPLY": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_MULTIPLY"
        },
        "KEY_ADD": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_ADD"
        },
        "KEY_SEPARATOR": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_SEPARATOR"
        },
        "KEY_SUBTRACT": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_SUBTRACT"
        },
        "KEY_DECIMAL": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_DECIMAL"
        },
        "KEY_DIVIDE": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_DIVIDE"
        },
        "KEY_F1": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_F1"
        },
        "KEY_F2": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_F2"
        },
        "KEY_F3": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_F3"
        },
        "KEY_F4": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_F4"
        },
        "KEY_F5": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_F5"
        },
        "KEY_F6": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_F6"
        },
        "KEY_F7": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_F7"
        },
        "KEY_F8": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_F8"
        },
        "KEY_F9": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_F9"
        },
        "KEY_F10": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_F10"
        },
        "KEY_F11": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_F11"
        },
        "KEY_F12": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_F12"
        },
        "KEY_COMMA": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_COMMA"
        },
        "KEY_PERIOD": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_PERIOD"
        },
        "KEY_SLASH": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_SLASH"
        },
        "KEY_OPEN_BRACKET": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_OPEN_BRACKET"
        },
        "KEY_BACK_SLASH": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_BACK_SLASH"
        },
        "KEY_CLOSE_BRACKET": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_CLOSE_BRACKET"
        },
        "KEY_META": {
            "!type": "?",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#KEY_META"
        },
        "MOUSEBUTTON_NONE": {
            "!type": "?",
            "!doc": "No mouse buttons pressed",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#MOUSEBUTTON_NONE"
        },
        "MOUSEBUTTON_LEFT": {
            "!type": "?",
            "!doc": "The left mouse button",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#MOUSEBUTTON_LEFT"
        },
        "MOUSEBUTTON_MIDDLE": {
            "!type": "?",
            "!doc": "The middle mouse button",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#MOUSEBUTTON_MIDDLE"
        },
        "MOUSEBUTTON_RIGHT": {
            "!type": "?",
            "!doc": "The right mouse button",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#MOUSEBUTTON_RIGHT"
        },
        "MouseEvent": {
            "!type": "fn(mouse: +pc.Mouse, event: MouseEvent)",
            "!doc": "MouseEvent object that is passed to events 'mousemove', 'mouseup', 'mousedown' and 'mousewheel'.",
            "prototype": {
                "x": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.MouseEvent.html#x",
                    "!doc": "The x co-ordinate of the mouse pointer relative to the element pc.Mouse is attached to",
                    "!type": "number"
                },
                "y": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.MouseEvent.html#y",
                    "!doc": "The y co-ordinate of the mouse pointer relative to the element pc.Mouse is attached to",
                    "!type": "number"
                },
                "dx": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.MouseEvent.html#dx",
                    "!doc": "The change in x co-ordinate since the last mouse event",
                    "!type": "number"
                },
                "dy": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.MouseEvent.html#dy",
                    "!doc": "The change in y co-ordinate since the last mouse event",
                    "!type": "number"
                },
                "button": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.MouseEvent.html#button",
                    "!doc": "The button",
                    "!type": "+pc.MOUSEBUTTON"
                },
                "wheel": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.MouseEvent.html#wheel",
                    "!doc": "A value representing the amount the mouse wheel has moved, only valid for mousemove events",
                    "!type": "number"
                },
                "element": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.MouseEvent.html#element",
                    "!doc": "The element that the mouse was fired from",
                    "!type": "DOMElement"
                },
                "ctrlKey": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.MouseEvent.html#ctrlKey",
                    "!doc": "True if the ctrl key was pressed when this event was fired",
                    "!type": "Boolean"
                },
                "shiftKey": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.MouseEvent.html#shiftKey",
                    "!doc": "True if the shift key was pressed when this event was fired",
                    "!type": "Boolean"
                },
                "altKey": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.MouseEvent.html#altKey",
                    "!doc": "True if the alt key was pressed when this event was fired",
                    "!type": "Boolean"
                },
                "metaKey": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.MouseEvent.html#metaKey",
                    "!doc": "True if the meta key was pressed when this event was fired",
                    "!type": "Boolean"
                },
                "event": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.MouseEvent.html#event",
                    "!doc": "The original browser event",
                    "!type": "MouseEvent"
                }
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.MouseEvent.html"
        },
        "Mouse": {
            "!type": "fn(element?: DOMElement)",
            "!doc": "A Mouse Device, bound to a DOM Element.",
            "isPointerLocked": {
                "!type": "fn() -> Boolean",
                "!doc": "Check if the mouse pointer has been locked, using pc.Mouse#enabledPointerLock"
            },
            "prototype": {
                "attach": {
                    "!type": "fn()",
                    "!doc": "Attach mouse events to a DOMElement.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Mouse.html#attach"
                },
                "detach": {
                    "!type": "fn()",
                    "!doc": "Remove mouse events from the element that it is attached to",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Mouse.html#detach"
                },
                "disableContextMenu": {
                    "!type": "fn()",
                    "!doc": "Disable the context menu usually activated with right-click",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Mouse.html#disableContextMenu"
                },
                "enableContextMenu": {
                    "!type": "fn()",
                    "!doc": "Enable the context menu usually activated with right-click. This option is active by default.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Mouse.html#enableContextMenu"
                },
                "enablePointerLock": {
                    "!type": "fn(success?: fn(), error?: fn())",
                    "!doc": "Request that the browser hides the mouse cursor and locks the mouse to the element. Allowing raw access to mouse movement input without risking the mouse exiting the element. Notes: <br /> <ul> <li>In some browsers this will only work when the browser is running in fullscreen mode. See pc.Application#enableFullscreen <li>Enabling pointer lock can only be initiated by a user action e.g. in the event handler for a mouse or keyboard input. </ul>",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Mouse.html#enablePointerLock"
                },
                "disablePointerLock": {
                    "!type": "fn(success?: fn())",
                    "!doc": "Return control of the mouse cursor to the user",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Mouse.html#disablePointerLock"
                },
                "update": {
                    "!type": "fn()",
                    "!doc": "Update method, should be called once per frame",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Mouse.html#update"
                },
                "isPressed": {
                    "!type": "fn() -> Boolean",
                    "!doc": "Returns true if the mouse button is currently pressed",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Mouse.html#isPressed"
                },
                "wasPressed": {
                    "!type": "fn() -> Boolean",
                    "!doc": "Returns true if the mouse button was pressed this frame (since the last call to update).",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Mouse.html#wasPressed"
                },
                "wasReleased": {
                    "!type": "fn() -> Boolean",
                    "!doc": "Returns true if the mouse button was released this frame (since the last call to update).",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Mouse.html#wasReleased"
                }
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Mouse.html"
        },
        "KeyboardEvent": {
            "!type": "fn(keyboard: +pc.Keyboard, event: KeyboardEvent)",
            "!doc": "The KeyboardEvent is passed into all event callbacks from the pc.Keyboard. It corresponds to a key press or release.",
            "prototype": {
                "key": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.KeyboardEvent.html#key",
                    "!doc": "The keyCode of the key that has changed.",
                    "!type": "+pc.KEY"
                },
                "element": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.KeyboardEvent.html#element",
                    "!doc": "The element that fired the keyboard event.",
                    "!type": "DOMElement"
                },
                "event": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.KeyboardEvent.html#event",
                    "!doc": "The original browser event which was fired.",
                    "!type": "KeyboardEvent"
                }
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.KeyboardEvent.html"
        },
        "Keyboard": {
            "!type": "fn(element?: DOMElement)",
            "!doc": "A Keyboard device bound to a DOMElement. Allows you to detect the state of the key presses. Note, Keyboard object must be attached to a DOMElement before it can detect any key presses.",
            "prototype": {
                "attach": {
                    "!type": "fn(element: DOMElement)",
                    "!doc": "Attach the keyboard event handlers to a DOMElement",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Keyboard.html#attach"
                },
                "detach": {
                    "!type": "fn()",
                    "!doc": "Detach the keyboard event handlers from the element it is attached to.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Keyboard.html#detach"
                },
                "update": {
                    "!type": "fn()",
                    "!doc": "Called once per frame to update internal state",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Keyboard.html#update"
                },
                "isPressed": {
                    "!type": "fn(key: +pc.KEY) -> Boolean",
                    "!doc": "Return true if the key is currently down",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Keyboard.html#isPressed"
                },
                "wasPressed": {
                    "!type": "fn(key: +pc.KEY) -> Boolean",
                    "!doc": "Returns true if the key was pressed since the last update.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Keyboard.html#wasPressed"
                },
                "wasReleased": {
                    "!type": "fn(key: +pc.KEY) -> Boolean",
                    "!doc": "Returns true if the key was released since the last update.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Keyboard.html#wasReleased"
                }
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Keyboard.html"
        },
        "GamePads": {
            "!type": "fn()",
            "!doc": "Input handler for accessing GamePad input",
            "prototype": {
                "update": {
                    "!type": "fn()",
                    "!doc": "Update the current and previous state of the gamepads. This must be called every frame for wasPressed() to work",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GamePads.html#update"
                },
                "poll": {
                    "!type": "fn() -> []",
                    "!doc": "Poll for the latest data from the gamepad API.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GamePads.html#poll"
                },
                "isPressed": {
                    "!type": "fn(index: number, button: number) -> Boolean",
                    "!doc": "Returns true if the button on the pad requested is pressed",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GamePads.html#isPressed"
                },
                "wasPressed": {
                    "!type": "fn(index: number, button: number) -> Boolean",
                    "!doc": "Returns true if the button was pressed since the last frame",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GamePads.html#wasPressed"
                },
                "getAxis": {
                    "!type": "fn(index: number, axes: number) -> number",
                    "!doc": "Get the value of one of the analogue axes of the pad",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GamePads.html#getAxis"
                }
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.GamePads.html"
        },
        "TouchEvent": {
            "!type": "fn(device: +pc.TouchDevice, event: TouchEvent)",
            "!doc": "A Event corresponding to touchstart, touchend, touchmove or touchcancel. TouchEvent wraps the standard browser event and provides lists of pc.Touch objects.",
            "prototype": {
                "element": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.TouchEvent.html#element",
                    "!doc": "The target DOMElement that the event was fired from",
                    "!type": "DOMElement"
                },
                "touches": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.TouchEvent.html#touches",
                    "!doc": "A list of all touches currently in contact with the device",
                    "!type": "[+pc.Touch]"
                },
                "changedTouches": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.TouchEvent.html#changedTouches",
                    "!doc": "A list of touches that have changed since the last event",
                    "!type": "[+pc.Touch]"
                },
                "getTouchById": {
                    "!type": "fn(id: number, list: [+pc.Touch]) -> +pc.Touch",
                    "!doc": "Get an event from one of the touch lists by the id. It is useful to access touches by their id so that you can be sure you are referencing the same touch",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.TouchEvent.html#getTouchById"
                }
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.TouchEvent.html"
        },
        "Touch": {
            "!type": "fn(touch: Touch)",
            "!doc": "A instance of a single point touch on a pc.TouchDevice",
            "prototype": {
                "id": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Touch.html#id",
                    "!doc": "The identifier of the touch",
                    "!type": "number"
                },
                "x": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Touch.html#x",
                    "!doc": "The x co-ordinate relative to the element that the TouchDevice is attached to",
                    "!type": "number"
                },
                "y": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Touch.html#y",
                    "!doc": "The y co-ordinate relative to the element that the TouchDevice is attached to",
                    "!type": "number"
                },
                "target": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Touch.html#target",
                    "!doc": "The target element of the touch event",
                    "!type": "DOMElement"
                },
                "touch": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Touch.html#touch",
                    "!doc": "The original browser Touch object",
                    "!type": "Touch"
                }
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Touch.html"
        },
        "TouchDevice": {
            "!type": "fn(element: DOMElement)",
            "!doc": "Attach a TouchDevice to an element and it will receive and fire events when the element is touched. See also pc.Touch and pc.TouchEvent",
            "prototype": {
                "attach": {
                    "!type": "fn(element: DOMElement)",
                    "!doc": "Attach a device to an element in the DOM. If the device is already attached to an element this method will detach it first",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.TouchDevice.html#attach"
                },
                "detach": {
                    "!type": "fn()",
                    "!doc": "Detach a device from the element it is attached to",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.TouchDevice.html#detach"
                }
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.TouchDevice.html"
        },
        "getTouchTargetCoords": {
            "!type": "fn(touch: Touch) -> object",
            "!doc": "Similiar to pc.getTargetCoords for the MouseEvents. This function takes a browser Touch object and returns the co-ordinates of the touch relative to the target element.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#getTouchTargetCoords"
        },
        "Controller": {
            "!type": "fn(element?: DOMElement, options?: object)",
            "!doc": "A general input handler which handles both mouse and keyboard input assigned to named actions. This allows you to define input handlers separately to defining keyboard/mouse configurations",
            "prototype": {
                "attach": {
                    "!type": "fn(element: DOMElement)",
                    "!doc": "Attach Controller to a DOMElement, this is required before you can monitor for key/mouse inputs.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Controller.html#attach"
                },
                "detach": {
                    "!type": "fn()",
                    "!doc": "Detach Controller from a DOMElement, this should be done before the Controller is destroyed",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Controller.html#detach"
                },
                "disableContextMenu": {
                    "!type": "fn()",
                    "!doc": "Disable the context menu usually activated with the right mouse button.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Controller.html#disableContextMenu"
                },
                "enableContextMenu": {
                    "!type": "fn()",
                    "!doc": "Enable the context menu usually activated with the right mouse button. This is enabled by default.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Controller.html#enableContextMenu"
                },
                "update": {
                    "!type": "fn(dt: object)",
                    "!doc": "Update the Keyboard and Mouse handlers",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Controller.html#update"
                },
                "registerKeys": {
                    "!type": "fn(action: string, keys: [number])",
                    "!doc": "Create or update a action which is enabled when the supplied keys are pressed.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Controller.html#registerKeys"
                },
                "registerMouse": {
                    "!type": "fn(action: string, button: number)",
                    "!doc": "Create or update an action which is enabled when the supplied mouse button is pressed",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Controller.html#registerMouse"
                },
                "registerPadButton": {
                    "!type": "fn(action: string, pad: number, button: number)",
                    "!doc": "Create or update an action which is enabled when the gamepad button is pressed",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Controller.html#registerPadButton"
                },
                "registerAxis": {
                    "!type": "fn()",
                    "!doc": "",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Controller.html#registerAxis"
                },
                "isPressed": {
                    "!type": "fn(action: string)",
                    "!doc": "Return true if the current action is enabled",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Controller.html#isPressed"
                },
                "wasPressed": {
                    "!type": "fn(action: string)",
                    "!doc": "Returns true if the action was enabled this since the last update",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Controller.html#wasPressed"
                }
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Controller.html"
        },
        "net": {
            "http": {
                "!type": "fn()",
                "!doc": "",
                "get": {
                    "!type": "fn(success: fn(), options?: object, xhr?: XmlHttpRequest)",
                    "!doc": "Perform an HTTP GET request to the given url."
                },
                "post": {
                    "!type": "fn(success: fn(), data: object, options?: object, xhr?: XmlHttpRequest)",
                    "!doc": "Perform an HTTP POST request to the given url"
                },
                "put": {
                    "!type": "fn(success: fn(), data: object, options?: object, xhr?: XmlHttpRequest)",
                    "!doc": "Perform an HTTP PUT request to the given url"
                },
                "del": {
                    "!type": "fn()",
                    "!doc": "Perform an HTTP DELETE request to the given url"
                }
            },
            "!type": "fn()",
            "!doc": "",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#net"
        },
        "script": {
            "!type": "fn()",
            "!doc": "",
            "main": {
                "!type": "fn()",
                "!doc": "Register the main game script resource, this is executed by called pc.script.start()"
            },
            "create": {
                "!type": "fn(name: string, callback: fn(app: +pc.Application))",
                "!doc": "Create a script resource object. A script file should contain a single call to pc.script.create and the callback should return a script object which will be instanciated when attached to Entities."
            },
            "attribute": {
                "!type": "fn(name: string, type: string, defaultValue: object, options: object)",
                "!doc": "Creates a script attribute for the current script. The script attribute can be accessed inside the script instance like so 'this.attributeName' or outside a script instance like so 'entity.script.attributeName'. Script attributes can be edited from the Attribute Editor of the PlayCanvas Editor like normal Components."
            },
            "start": {
                "!type": "fn()",
                "!doc": "Begin the scripted application by calling the function passed in to pc.script.main()"
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#script"
        },
        "Application": {
            "!type": "fn(canvas: DOMElement)",
            "!doc": "Default application which performs general setup code and initiates the main game loop",
            "prototype": {
                "scene": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Application.html#scene",
                    "!doc": "The current pc.Scene",
                    "!type": "+pc.Scene"
                },
                "timeScale": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Application.html#timeScale",
                    "!doc": "Scales the global time delta.",
                    "!type": "number"
                },
                "configure": {
                    "!type": "fn()",
                    "!doc": "Load a configuration file from",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Application.html#configure"
                },
                "loadSceneHierarchy": {
                    "!type": "fn(url: string, callback: fn())",
                    "!doc": "Load a scene file, create and initialize the Entity hierarchy and add the hierarchy to the application root Entity.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Application.html#loadSceneHierarchy"
                },
                "loadSceneSettings": {
                    "!type": "fn(url: string, callback: fn())",
                    "!doc": "Load a scene file and apply the scene settings to the current scene",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Application.html#loadSceneSettings"
                },
                "start": {
                    "!type": "fn()",
                    "!doc": "Start the Application updating",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Application.html#start"
                },
                "update": {
                    "!type": "fn(dt: number)",
                    "!doc": "Application specific update method. Override this if you have a custom Application",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Application.html#update"
                },
                "render": {
                    "!type": "fn()",
                    "!doc": "Application specific render method. Override this if you have a custom Application",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Application.html#render"
                },
                "tick": {
                    "!type": "fn()",
                    "!doc": "Application specific tick method that calls update and render and queues the next tick. Override this if you have a custom Application.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Application.html#tick"
                },
                "setCanvasFillMode": {
                    "!type": "fn(mode: +pc.FillMode, width?: number, height?: number)",
                    "!doc": "Change the way the canvas fills the window and resizes when the window changes In KEEP_ASPECT mode, the canvas will grow to fill the window as best it can while maintaining the aspect ratio In FILL_WINDOW mode, the canvas will simply fill the window, changing aspect ratio In NONE mode, the canvas will always match the size provided",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Application.html#setCanvasFillMode"
                },
                "setCanvasResolution": {
                    "!type": "fn(mode: +pc.ResolutionMode, width?: number, height?: number)",
                    "!doc": "Change the resolution of the canvas, and set the way it behaves when the window is resized In AUTO mode, the resolution is change to match the size of the canvas when the canvas resizes In FIXED mode, the resolution remains until another call to setCanvasResolution()",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Application.html#setCanvasResolution"
                },
                "isFullscreen": {
                    "!type": "fn() -> Boolean",
                    "!doc": "Returns true if the application is currently running fullscreen",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Application.html#isFullscreen"
                },
                "enableFullscreen": {
                    "!type": "fn(element?: DOMElement, success?: fn(), error?: fn())",
                    "!doc": "Request that the browser enters fullscreen mode. This is not available on all browsers. Note: Switching to fullscreen can only be initiated by a user action, e.g. in the event hander for a mouse or keyboard input",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Application.html#enableFullscreen"
                },
                "disableFullscreen": {
                    "!type": "fn(success?: fn())",
                    "!doc": "If application is currently displaying an element as fullscreen, then stop and return to normal.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Application.html#disableFullscreen"
                },
                "isHidden": {
                    "!type": "fn()",
                    "!doc": "Returns true if the window or tab in which the application is running in is not visible to the user.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Application.html#isHidden"
                },
                "resizeCanvas": {
                    "!type": "fn(width?: number, height?: number) -> object",
                    "!doc": "Resize the canvas in line with the current FillMode In KEEP_ASPECT mode, the canvas will grow to fill the window as best it can while maintaining the aspect ratio In FILL_WINDOW mode, the canvas will simply fill the window, changing aspect ratio In NONE mode, the canvas will always match the size provided",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Application.html#resizeCanvas"
                },
                "destroy": {
                    "!type": "fn()",
                    "!doc": "Destroys application and removes all event listeners",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Application.html#destroy"
                }
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Application.html"
        },
        "FILLMODE_NONE": {
            "!type": "?",
            "!doc": "When resizing the window the size of the canvas will not change.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#FILLMODE_NONE"
        },
        "FILLMODE_FILL_WINDOW": {
            "!type": "?",
            "!doc": "When resizing the window the size of the canvas will change to fill the window exactly.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#FILLMODE_FILL_WINDOW"
        },
        "FILLMODE_KEEP_ASPECT": {
            "!type": "?",
            "!doc": "When resizing the window the size of the canvas will change to fill the window as best it can, while maintaining the same aspect ratio.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#FILLMODE_KEEP_ASPECT"
        },
        "RESOLUTION_AUTO": {
            "!type": "?",
            "!doc": "When the canvas is resized the resolution of the canvas will change to match the size of the canvas.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#RESOLUTION_AUTO"
        },
        "RESOLUTION_FIXED": {
            "!type": "?",
            "!doc": "When the canvas is resized the resolution of the canvas will remain at the same value and the output will just be scaled to fit the canvas.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#RESOLUTION_FIXED"
        },
        "ComponentSystem": {
            "!type": "fn(app: +pc.Application)",
            "!doc": "Component Systems contain the logic and functionality to update all Components of a particular type",
            "prototype": {
                "store": {
                    "!type": "[]",
                    "!doc": "The store where all pc.ComponentData objects are kept",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ComponentSystem.html#store"
                },
                "cloneComponent": {
                    "!type": "fn(entity: +pc.Entity, clone: +pc.Entity)",
                    "!doc": "Create a clone of component. This creates a copy all ComponentData variables.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ComponentSystem.html#cloneComponent"
                }
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ComponentSystem.html"
        },
        "Component": {
            "!type": "fn(system: +pc.ComponentSystem, entity: +pc.Entity)",
            "!doc": "Components are used to attach functionality onto Entities. Components can receive update events each frame, and expose properties to the tools.",
            "prototype": {
                "data": {
                    "!type": "fn()",
                    "!doc": "Access the pc.ComponentData directly. Usually you should access the data properties via the individual properties as modifying this data directly will not fire 'set' events.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Component.html#data"
                }
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Component.html"
        },
        "AnimationComponent": {
            "!type": "fn(system: +pc.AnimationComponentSystem, entity: +pc.Entity)",
            "!doc": "The Animation Component allows an Entity to playback animations on models",
            "prototype": {
                "!proto": "pc.Component.prototype",
                "enabled": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.AnimationComponent.html#enabled",
                    "!doc": "If false no animation will be played",
                    "!type": "Boolean"
                },
                "speed": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.AnimationComponent.html#speed",
                    "!doc": "Speed multiplier for animation play back speed. 1.0 is playback at normal speed, 0.0 pauses the animation",
                    "!type": "number"
                },
                "loop": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.AnimationComponent.html#loop",
                    "!doc": "If true the animation will restart from the beginning when it reaches the end",
                    "!type": "Boolean"
                },
                "activate": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.AnimationComponent.html#activate",
                    "!doc": "If true the first animation asset will begin playing when the Pack is loaded",
                    "!type": "Boolean"
                },
                "assets": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.AnimationComponent.html#assets",
                    "!doc": "The array of animation assets",
                    "!type": "[number]"
                },
                "play": {
                    "!type": "fn(name: string, blendTime?: number)",
                    "!doc": "Start playing an animation",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.AnimationComponent.html#play"
                },
                "getAnimation": {
                    "!type": "fn(name: string) -> +pc.Animation",
                    "!doc": "Return an animation",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.AnimationComponent.html#getAnimation"
                },
                "currentTime": {
                    "!type": "fn()",
                    "!doc": "Get or Set the current time position (in seconds) of the animation",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.AnimationComponent.html#currentTime"
                },
                "duration": {
                    "!type": "fn()",
                    "!doc": "Get the duration in seconds of the current animation.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.AnimationComponent.html#duration"
                }
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.AnimationComponent.html"
        },
        "ModelComponent": {
            "!type": "fn(system: +pc.ModelComponentSystem, entity: +pc.Entity)",
            "!doc": "Enables an Entity to render a model or a primitive shape. This Component attaches additional model geometry in to the scene graph below the Entity.",
            "prototype": {
                "!proto": "pc.Component.prototype",
                "type": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ModelComponent.html#type",
                    "!doc": "The type of the model, which can be one of the following values: <ul> <li>asset: The component will render a model asset</li> <li>box: The component will render a box</li> <li>capsule: The component will render a capsule</li> <li>cone: The component will render a cone</li> <li>cylinder: The component will render a cylinder</li> <li>sphere: The component will render a sphere</li> </ul>",
                    "!type": "string"
                },
                "enabled": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ModelComponent.html#enabled",
                    "!doc": "Enable or disable rendering of the Model",
                    "!type": "Boolean"
                },
                "asset": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ModelComponent.html#asset",
                    "!doc": "The id of the asset for the model (only applies to models of type 'asset')",
                    "!type": "number"
                },
                "castShadows": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ModelComponent.html#castShadows",
                    "!doc": "If true, this model will cast shadows for lights that have shadow casting enabled.",
                    "!type": "Boolean"
                },
                "receiveShadows": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ModelComponent.html#receiveShadows",
                    "!doc": "If true, shadows will be cast on this model",
                    "!type": "Boolean"
                },
                "materialAsset": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ModelComponent.html#materialAsset",
                    "!doc": "The material pc.Asset that will be used to render the model (not used on models of type 'asset')",
                    "!type": "number"
                },
                "model": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ModelComponent.html#model",
                    "!doc": "The model that is added to the scene graph.",
                    "!type": "+pc.Model"
                }
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ModelComponent.html"
        },
        "AnimationComponentSystem": {
            "!type": "fn(app: +pc.Application)",
            "!doc": "The AnimationComponentSystem is manages creating and deleting AnimationComponents",
            "prototype": {
                "!proto": "pc.ComponentSystem.prototype"
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.AnimationComponentSystem.html"
        },
        "ModelComponentSystem": {
            "!type": "fn()",
            "!doc": "Allows an Entity to render a model or a primitive shape like a box, capsule, sphere, cylinder, cone etc.",
            "prototype": {
                "!proto": "pc.ComponentSystem.prototype"
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ModelComponentSystem.html"
        },
        "CameraComponentSystem": {
            "!type": "fn()",
            "!doc": "Used to add and remove pc.CameraComponents from Entities. It also holds an array of all active cameras.",
            "prototype": {
                "!proto": "pc.ComponentSystem.prototype"
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.CameraComponentSystem.html"
        },
        "CameraComponent": {
            "!type": "fn(system: +pc.CameraComponentSystem, entity: +pc.Entity)",
            "!doc": "The Camera Component enables an Entity to render the scene.",
            "prototype": {
                "!proto": "pc.Component.prototype",
                "enabled": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.CameraComponent.html#enabled",
                    "!doc": "If true the camera will be render the active scene. Note that multiple cameras can be enabled simulataneously.",
                    "!type": "Boolean"
                },
                "aspectRatio": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.CameraComponent.html#aspectRatio",
                    "!doc": "The aspect ratio of the camera. This is the ratio of width divided by height. Default to 16/9.",
                    "!type": "number"
                },
                "clearColor": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.CameraComponent.html#clearColor",
                    "!doc": "The color used to clear the canvas to before the camera starts to render",
                    "!type": "+pc.Color"
                },
                "nearClip": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.CameraComponent.html#nearClip",
                    "!doc": "The distance from the camera before which no rendering will take place",
                    "!type": "number"
                },
                "farClip": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.CameraComponent.html#farClip",
                    "!doc": "The distance from the camera after which no rendering will take place",
                    "!type": "number"
                },
                "fov": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.CameraComponent.html#fov",
                    "!doc": "The Y-axis field of view of the camera, in degrees. Used for pc.PROJECTION_PERSPECTIVE cameras only. Defaults to 45.",
                    "!type": "number"
                },
                "orthoHeight": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.CameraComponent.html#orthoHeight",
                    "!doc": "The half-height of the orthographic view window (in the Y-axis). Used for pc.PROJECTION_ORTHOGRAPHIC cameras only. Defaults to 10.",
                    "!type": "number"
                },
                "projection": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.CameraComponent.html#projection",
                    "!doc": "The type of projection used to render the camera.",
                    "!type": "+pc.Projection"
                },
                "priority": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.CameraComponent.html#priority",
                    "!doc": "Controls which camera will be rendered first. Smaller numbers are rendered first.",
                    "!type": "number"
                },
                "clearColorBuffer": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.CameraComponent.html#clearColorBuffer",
                    "!doc": "If true the camera will clear the color buffer to the color set in clearColor.",
                    "!type": "Boolean"
                },
                "clearDepthBuffer": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.CameraComponent.html#clearDepthBuffer",
                    "!doc": "If true the camera will clear the depth buffer.",
                    "!type": "Boolean"
                },
                "rect": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.CameraComponent.html#rect",
                    "!doc": "Controls where on the screen the camera will be rendered in normalized screen coordinates. The order of the values is [x, y, width, height]",
                    "!type": "+pc.Vec4"
                },
                "renderTarget": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.CameraComponent.html#renderTarget",
                    "!doc": "The render target of the camera. Defaults to null, which causes",
                    "!type": "+pc.RenderTarget"
                },
                "postEffects": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.CameraComponent.html#postEffects",
                    "!doc": "The post effects queue for this camera. Use this to add / remove post effects from the camera. the camera to render to the canvas' back buffer. Setting a valid render target effectively causes the camera to render to an offscreen buffer, which can then be used to achieve certain graphics effect (normally post effects).",
                    "!type": "+pc.PostEffectQueue"
                },
                "projectionMatrix": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.CameraComponent.html#projectionMatrix",
                    "!doc": "[Read only] The camera's projection matrix.",
                    "!type": "+pc.Mat4"
                },
                "viewMatrix": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.CameraComponent.html#viewMatrix",
                    "!doc": "[Read only] The camera's view matrix.",
                    "!type": "+pc.Mat4"
                },
                "frustum": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.CameraComponent.html#frustum",
                    "!doc": "[Read only] The camera's frustum shape.",
                    "!type": "+pc.Frustum"
                },
                "screenToWorld": {
                    "!type": "fn(screenx: number, screeny: number, cameraz: number, worldCoord?: +pc.Vec3) -> +pc.Vec3",
                    "!doc": "Convert a point from 2D screen space to 3D world space.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.CameraComponent.html#screenToWorld"
                },
                "worldToScreen": {
                    "!type": "fn(worldCoord: +pc.Vec3, screenCoord?: +pc.Vec3) -> +pc.Vec3",
                    "!doc": "Convert a point from 3D world space to 2D screen space.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.CameraComponent.html#worldToScreen"
                }
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.CameraComponent.html"
        },
        "LightComponentSystem": {
            "!type": "fn(app: +pc.Application)",
            "!doc": "A Light Component is used to dynamically light the scene.",
            "prototype": {
                "!proto": "pc.ComponentSystem.prototype"
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.LightComponentSystem.html"
        },
        "LightComponent": {
            "!type": "fn(system: +pc.LightComponentSystem, entity: +pc.Entity)",
            "!doc": "The Light Component enables the Entity to light the scene. The light can be one of the following types: <ul> <li><strong>directional</strong>: A directional light. The position of the attached entity has no effect. </li> <li><strong>point</strong>: A point light.</li> <li><strong>spot</strong>: A spot light.</li> </ul>",
            "prototype": {
                "!proto": "pc.Component.prototype",
                "type": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.LightComponent.html#type",
                    "!doc": "The type of light. <ul> <li><strong>directional</strong>: A light that is infinitely far away and lights the entire scene from one direction.</li> <li><strong>point</strong>: A light that illuminates in all directions from a point.</li> <li><strong>spot</strong>: A light that illuminates a cone.</li> </ul>",
                    "!type": "string"
                },
                "color": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.LightComponent.html#color",
                    "!doc": "The Color of the light",
                    "!type": "+pc.Color"
                },
                "enabled": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.LightComponent.html#enabled",
                    "!doc": "Enable or disable the light",
                    "!type": "Boolean"
                },
                "intensity": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.LightComponent.html#intensity",
                    "!doc": "The brightness of the light.",
                    "!type": "number"
                },
                "castShadows": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.LightComponent.html#castShadows",
                    "!doc": "If enabled the light will cast shadows.",
                    "!type": "Boolean"
                },
                "shadowDistance": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.LightComponent.html#shadowDistance",
                    "!doc": "The distance from the viewpoint beyond which shadows are no longer rendered. (Directional lights only)",
                    "!type": "number"
                },
                "shadowResolution": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.LightComponent.html#shadowResolution",
                    "!doc": "The size of the texture used for the shadow map. Avaialable sizes are 64, 128, 256, 512, 1024, 2048.",
                    "!type": "number"
                },
                "shadowBias": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.LightComponent.html#shadowBias",
                    "!doc": "The depth bias for tuning the appearance of the shadow mapping generated by this light.",
                    "!type": "number"
                },
                "normalOffsetBias": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.LightComponent.html#normalOffsetBias",
                    "!doc": "Normal offset depth bias.",
                    "!type": "number"
                },
                "range": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.LightComponent.html#range",
                    "!doc": "The range of the light. (Point and spot lights only)",
                    "!type": "number"
                },
                "innerConeAngle": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.LightComponent.html#innerConeAngle",
                    "!doc": "The angle at which the spotlight cone starts to fade off. (Spot lights only)",
                    "!type": "number"
                },
                "outerConeAngle": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.LightComponent.html#outerConeAngle",
                    "!doc": "The angle at which the spotlight cone has faded to nothing. (Spot lights only)",
                    "!type": "number"
                },
                "falloffMode": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.LightComponent.html#falloffMode",
                    "!doc": "Controls the rate at which a light attentuates from its position. (Point and spot lights only) <ul> <li><strong>pc.LIGHTFALLOFF_LINEAR</strong>: Linear.</li> <li><strong>pc.LIGHTFALLOFF_INVERSESQUARED</strong>: Inverse squared.</li> </ul>",
                    "!type": "number"
                }
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.LightComponent.html"
        },
        "ScriptComponentSystem": {
            "!type": "fn()",
            "!doc": "Allows scripts to be attached to an Entity and executed",
            "prototype": {
                "!proto": "pc.ComponentSystem.prototype"
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ScriptComponentSystem.html"
        },
        "ScriptComponent": {
            "!type": "fn(system: +pc.ScriptComponentSystem, entity: +pc.Entity)",
            "!doc": "The ScriptComponent allows you to extend the functionality of an Entity by attaching your own javascript files to be executed with access to the Entity. For more details on scripting see <a href=\"//developer.playcanvas.com/user-manual/scripting/\">Scripting</a>.",
            "prototype": {
                "!proto": "pc.Component.prototype",
                "enabled": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ScriptComponent.html#enabled",
                    "!doc": "Enables or disables the Component. If the Component is disabled then the following methods will not be called on the script instances: <ul> <li>initialize</li> <li>postInitialize</li> <li>update</li> <li>fixedUpdate</li> <li>postUpdate</li> </ul>",
                    "!type": "Boolean"
                },
                "scripts": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ScriptComponent.html#scripts",
                    "!doc": "An array of all the scripts to load. Each script object has this format: {url: 'url.js', name: 'url', 'attributes': [attribute1, attribute2, ...]}",
                    "!type": "[object]"
                }
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ScriptComponent.html"
        },
        "PickComponentSystem": {
            "!type": "fn()",
            "!doc": "Allows an Entity to be picked from the scene using a pc.picking.Picker Object",
            "prototype": {
                "!proto": "pc.ComponentSystem.prototype"
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PickComponentSystem.html"
        },
        "PickComponent": {
            "!type": "fn(system: +pc.PickComponentSystem, entity: +pc.Entity)",
            "!doc": "Allows an Entity to be picked from the scene using a pc.picking.Picker Object",
            "prototype": {
                "!proto": "pc.Component.prototype"
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.PickComponent.html"
        },
        "AudioSourceComponentSystem": {
            "!type": "fn(app: +pc.Application, audioContext: +pc.AudioContext)",
            "!doc": "",
            "prototype": {
                "!proto": "pc.ComponentSystem.prototype",
                "setVolume()": {
                    "!type": "fn(value: number)",
                    "!doc": "Set the volume for the entire AudioSource system. All sources will have their volume multiplied by this value",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.AudioSourceComponentSystem.html#setVolume()"
                }
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.AudioSourceComponentSystem.html"
        },
        "AudioSourceComponent": {
            "!type": "fn(system: +pc.AudioSourceComponentSystem, entity: +pc.Entity)",
            "!doc": "The AudioSource Component controls playback of an audio sample.",
            "prototype": {
                "!proto": "pc.Component.prototype",
                "enabled": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.AudioSourceComponent.html#enabled",
                    "!doc": "If false no audio will be played",
                    "!type": "Boolean"
                },
                "assets": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.AudioSourceComponent.html#assets",
                    "!doc": "The list of audio assets",
                    "!type": "[]"
                },
                "activate": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.AudioSourceComponent.html#activate",
                    "!doc": "If true the audio will begin playing as soon as the Pack is loaded",
                    "!type": "Boolean"
                },
                "volume": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.AudioSourceComponent.html#volume",
                    "!doc": "The volume modifier to play the audio with. In range 0-1.",
                    "!type": "number"
                },
                "pitch": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.AudioSourceComponent.html#pitch",
                    "!doc": "The pitch modifier to play the audio with. Must be larger than 0.01",
                    "!type": "number"
                },
                "loop": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.AudioSourceComponent.html#loop",
                    "!doc": "If true the audio will restart when it finishes playing",
                    "!type": "Boolean"
                },
                "3d": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.AudioSourceComponent.html#3d",
                    "!doc": "If true the audio will play back at the location of the Entity in space, so the audio will be affect by the position of the pc.AudioListenerComponent",
                    "!type": "Boolean"
                },
                "minDistance": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.AudioSourceComponent.html#minDistance",
                    "!doc": "The minimum distance from the listener at which audio falloff begins.",
                    "!type": "number"
                },
                "maxDistance": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.AudioSourceComponent.html#maxDistance",
                    "!doc": "The maximum distance from the listener at which audio falloff stops. Note the volume of the audio is not 0 after this distance, but just doesn't fall off anymore",
                    "!type": "number"
                },
                "rollOffFactor": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.AudioSourceComponent.html#rollOffFactor",
                    "!doc": "The factor used in the falloff equation.",
                    "!type": "number"
                },
                "play": {
                    "!type": "fn(name: string)",
                    "!doc": "Begin playback of an audio asset in the component attached to an entity",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.AudioSourceComponent.html#play"
                },
                "pause": {
                    "!type": "fn()",
                    "!doc": "Pause playback of the audio that is playing on the Entity. Playback can be resumed by calling pc.AudioSourceComponent#unpause",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.AudioSourceComponent.html#pause"
                },
                "unpause": {
                    "!type": "fn()",
                    "!doc": "Resume playback of the audio if paused. Playback is resumed at the time it was paused.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.AudioSourceComponent.html#unpause"
                },
                "stop": {
                    "!type": "fn()",
                    "!doc": "Stop playback on an Entity. Playback can not be resumed after being stopped.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.AudioSourceComponent.html#stop"
                }
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.AudioSourceComponent.html"
        },
        "AudioListenerComponentSystem": {
            "!type": "fn()",
            "!doc": "Component System for adding and removing pc.AudioComponent objects to Enities.",
            "prototype": {
                "!proto": "pc.ComponentSystem.prototype"
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.AudioListenerComponentSystem.html"
        },
        "AudioListenerComponent": {
            "!type": "fn(system: +pc.AudioListenerComponentSystem, entity: +pc.Entity)",
            "!doc": "Represent the audio listener in the 3D world, so that 3D positioned audio sources are heard correctly.",
            "prototype": {
                "!proto": "pc.Component.prototype"
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.AudioListenerComponent.html"
        },
        "RaycastResult": {
            "!type": "fn(entity: +pc.Entity, point: +pc.Vec3, normal: +pc.Vec3)",
            "!doc": "Object holding the result of a successful raycast hit",
            "prototype": {
                "entity": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.RaycastResult.html#entity",
                    "!doc": "The entity that was hit",
                    "!type": "+pc.Entity"
                },
                "point": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.RaycastResult.html#point",
                    "!doc": "The point at which the ray hit the entity in world space",
                    "!type": "+pc.Vec3"
                },
                "normal": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.RaycastResult.html#normal",
                    "!doc": "The normal vector of the surface where the ray hit in world space.",
                    "!type": "+pc.Vec3"
                }
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.RaycastResult.html"
        },
        "SingleContactResult": {
            "!type": "fn(a: +pc.Entity, b: +pc.Entity, contactPoint: +pc.ContactPoint)",
            "!doc": "Object holding the result of a contact between two rigid bodies",
            "prototype": {
                "a": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.SingleContactResult.html#a",
                    "!doc": "The first entity involved in the contact",
                    "!type": "+pc.Entity"
                },
                "b": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.SingleContactResult.html#b",
                    "!doc": "The second entity involved in the contact",
                    "!type": "+pc.Entity"
                },
                "localPointA": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.SingleContactResult.html#localPointA",
                    "!doc": "The point on Entity A where the contact occured, relative to A",
                    "!type": "+pc.Vec3"
                },
                "localPointB": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.SingleContactResult.html#localPointB",
                    "!doc": "The point on Entity B where the contact occured, relative to B",
                    "!type": "+pc.Vec3"
                },
                "pointA": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.SingleContactResult.html#pointA",
                    "!doc": "The point on Entity A where the contact occured, in world space",
                    "!type": "+pc.Vec3"
                },
                "pointB": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.SingleContactResult.html#pointB",
                    "!doc": "The point on Entity B where the contact occured, in world space",
                    "!type": "+pc.Vec3"
                },
                "normal": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.SingleContactResult.html#normal",
                    "!doc": "The normal vector of the contact on Entity B, in world space",
                    "!type": "+pc.Vec3"
                }
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.SingleContactResult.html"
        },
        "ContactPoint": {
            "!type": "fn(localPoint: +pc.Vec3, localPointOther: +pc.Vec3, point: +pc.Vec3, pointOther: +pc.Vec3, normal: +pc.Vec3)",
            "!doc": "Object holding the result of a contact between two Entities.",
            "prototype": {
                "localPoint": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ContactPoint.html#localPoint",
                    "!doc": "The point on the entity where the contact occured, relative to the entity",
                    "!type": "+pc.Vec3"
                },
                "localPointOther": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ContactPoint.html#localPointOther",
                    "!doc": "The point on the other entity where the contact occured, relative to the other entity",
                    "!type": "+pc.Vec3"
                },
                "point": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ContactPoint.html#point",
                    "!doc": "The point on the entity where the contact occured, in world space",
                    "!type": "+pc.Vec3"
                },
                "pointOther": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ContactPoint.html#pointOther",
                    "!doc": "The point on the other entity where the contact occured, in world space",
                    "!type": "+pc.Vec3"
                },
                "normal": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ContactPoint.html#normal",
                    "!doc": "The normal vector of the contact on the other entity, in world space",
                    "!type": "+pc.Vec3"
                }
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ContactPoint.html"
        },
        "ContactResult": {
            "!type": "fn(other: +pc.Entity, contacts: [+pc.ContactPoint])",
            "!doc": "Object holding the result of a contact between two Entities",
            "prototype": {
                "other": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ContactResult.html#other",
                    "!doc": "The entity that was involved in the contact with this entity",
                    "!type": "+pc.Entity"
                },
                "contacts": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ContactResult.html#contacts",
                    "!doc": "An array of ContactPoints with the other entity",
                    "!type": "[+pc.ContactPoint]"
                }
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ContactResult.html"
        },
        "RigidBodyComponentSystem": {
            "!type": "fn(app: +pc.Application)",
            "!doc": "The RigidBodyComponentSystem maintains the dynamics world for simulating rigid bodies, it also controls global values for the world such as gravity. Note: The RigidBodyComponentSystem is only valid if 3D Physics is enabled in your application. You can enable this in the application settings for your Depot.",
            "prototype": {
                "!proto": "pc.ComponentSystem.prototype",
                "setGravity": {
                    "!type": "fn(x: number, y: number, z: number)",
                    "!doc": "Set the gravity vector for the 3D physics world",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.RigidBodyComponentSystem.html#setGravity"
                },
                "raycastFirst": {
                    "!type": "fn(start: +pc.Vec3, end: +pc.Vec3, callback: fn())",
                    "!doc": "Raycast the world and return the first entity the ray hits. Fire a ray into the world from start to end, if the ray hits an entity with a rigidbody component, the callback function is called along with a pc.RaycastResult.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.RigidBodyComponentSystem.html#raycastFirst"
                }
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.RigidBodyComponentSystem.html"
        },
        "RigidBodyComponent": {
            "!type": "fn(system: +pc.RigidBodyComponentSystem, entity: +pc.Entity)",
            "!doc": "The rigidbody Component, when combined with a pc.CollisionComponent, allows your Entities to be simulated using realistic physics. A rigidbody Component will fall under gravity and collide with other rigid bodies, using scripts you can apply forces to the body.",
            "prototype": {
                "!proto": "pc.Component.prototype",
                "enabled": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.RigidBodyComponent.html#enabled",
                    "!doc": "Enables or disables the Component.",
                    "!type": "Boolean"
                },
                "mass": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.RigidBodyComponent.html#mass",
                    "!doc": "The mass of the body. This is only relevant for pc.BODYTYPE_DYNAMIC bodies, other types have infinite mass.",
                    "!type": "number"
                },
                "linearVelocity": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.RigidBodyComponent.html#linearVelocity",
                    "!doc": "Defines the speed of the body in a given direction.",
                    "!type": "+pc.Vec3"
                },
                "angularVelocity": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.RigidBodyComponent.html#angularVelocity",
                    "!doc": "Defines the rotational speed of the body around each world axis.",
                    "!type": "+pc.Vec3"
                },
                "linearDamping": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.RigidBodyComponent.html#linearDamping",
                    "!doc": "Controls the rate at which a body loses linear velocity over time.",
                    "!type": "number"
                },
                "angularDamping": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.RigidBodyComponent.html#angularDamping",
                    "!doc": "Controls the rate at which a body loses angular velocity over time.",
                    "!type": "number"
                },
                "linearFactor": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.RigidBodyComponent.html#linearFactor",
                    "!doc": "Scaling factor for linear movement of the body in each axis.",
                    "!type": "+pc.Vec3"
                },
                "angularFactor": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.RigidBodyComponent.html#angularFactor",
                    "!doc": "Scaling factor for angular movement of the body in each axis.",
                    "!type": "+pc.Vec3"
                },
                "friction": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.RigidBodyComponent.html#friction",
                    "!doc": "The friction value used when contacts occur between two bodies. A higher value indicates more friction.",
                    "!type": "number"
                },
                "restitution": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.RigidBodyComponent.html#restitution",
                    "!doc": "The amount of energy lost when two objects collide, this determines the bounciness of the object. A value of 0 means that no energy is lost in the collision, a value of 1 means that all energy is lost. So the higher the value the less bouncy the object is.",
                    "!type": "number"
                },
                "group": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.RigidBodyComponent.html#group",
                    "!doc": "The collision group this body belongs to. Combine the group and the mask to prevent bodies colliding with each other.",
                    "!type": "number"
                },
                "mask": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.RigidBodyComponent.html#mask",
                    "!doc": "The collision mask sets which groups this body collides with. It is a bitfield of 16 bits, the first 8 bits are reserved for engine use.",
                    "!type": "number"
                },
                "type": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.RigidBodyComponent.html#type",
                    "!doc": "The type of RigidBody determines how it is simulated. Static objects have infinite mass and cannot move, Dynamic objects are simulated according to the forces applied to them, Kinematic objects have infinite mass and do not respond to forces, but can still be moved by setting their velocity or position.",
                    "!type": "+pc.RIGIDBODY_TYPE"
                },
                "isActive": {
                    "!type": "fn() -> Boolean",
                    "!doc": "Returns true if the rigid body is currently actively being simulated. i.e. not 'sleeping'",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.RigidBodyComponent.html#isActive"
                },
                "activate": {
                    "!type": "fn()",
                    "!doc": "Forceably activate the rigid body simulation",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.RigidBodyComponent.html#activate"
                },
                "applyForce": {
                    "!type": "fn(force: +pc.Vec3, relativePoint?: +pc.Vec3)",
                    "!doc": "Apply an force to the body at a point. By default, the force is applied at the origin of the body. However, the force can be applied at an offset this point by specifying a world space vector from the body's origin to the point of application.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.RigidBodyComponent.html#applyForce"
                },
                "applyTorque": {
                    "!type": "fn(force: +pc.Vec3)",
                    "!doc": "Apply torque (rotational force) to the body.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.RigidBodyComponent.html#applyTorque"
                },
                "applyImpulse": {
                    "!type": "fn(impulse: +pc.Vec3, relativePoint?: +pc.Vec3)",
                    "!doc": "Apply an impulse (instantaneous change of velocity) to the body at a point.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.RigidBodyComponent.html#applyImpulse"
                },
                "applyTorqueImpulse": {
                    "!type": "fn(torqueImpulse: +pc.Vec3)",
                    "!doc": "Apply a torque impulse (rotational force applied instantaneously) to the body.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.RigidBodyComponent.html#applyTorqueImpulse"
                },
                "isStatic": {
                    "!type": "fn() -> Boolean",
                    "!doc": "Returns true if the rigid body is of type pc.BODYTYPE_STATIC",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.RigidBodyComponent.html#isStatic"
                },
                "isStaticOrKinematic": {
                    "!type": "fn() -> Boolean",
                    "!doc": "Returns true if the rigid body is of type pc.BODYTYPE_STATIC or pc.BODYTYPE_KINEMATIC",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.RigidBodyComponent.html#isStaticOrKinematic"
                },
                "isKinematic": {
                    "!type": "fn() -> Boolean",
                    "!doc": "Returns true if the rigid body is of type pc.BODYTYPE_KINEMATIC",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.RigidBodyComponent.html#isKinematic"
                },
                "teleport": {
                    "!type": "fn(position: +pc.Vec3, angles?: +pc.Vec3)",
                    "!doc": "Teleport an entity to a new position and/or orientation",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.RigidBodyComponent.html#teleport"
                }
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.RigidBodyComponent.html"
        },
        "CollisionComponent": {
            "!type": "fn(system: +pc.CollisionComponentSystem, entity: +pc.Entity)",
            "!doc": "A collision volume. use this in conjunction with a pc.RigidBodyComponent to make a collision volume that can be simulated using the physics engine. <p>If the pc.Entity does not have a pc.RigidBodyComponent then this collision volume will act as a trigger volume. When an entity with a dynamic or kinematic body enters or leaves an entity with a trigger volume, both entities will receive trigger events. <p>The following table shows all the events that can be fired between two Entities: <table class=\"table table-striped table-condensed\"> <tr><td></td><td><strong>Rigid Body (Static)</strong></td><td><strong>Rigid Body (Dynamic or Kinematic)</strong></td><td><strong>Trigger Volume</strong></td></tr> <tr> <td><strong>Rigid Body (Static)</strong></td> <td>-</td> <td><ul class=\"list-group\"> <li class=\"list-group-item\">contact</li> <li class=\"list-group-item\">collisionstart</li> <li class=\"list-group-item\">collisionend</li> </td> <td>-</td> </tr> <tr> <td><strong>Rigid Body (Dynamic or Kinematic)</strong></td> <td><ul class=\"list-group\"> <li class=\"list-group-item\">contact</li> <li class=\"list-group-item\">collisionstart</li> <li class=\"list-group-item\">collisionend</li> </td> <td><ul class=\"list-group\"> <li class=\"list-group-item\">contact</li> <li class=\"list-group-item\">collisionstart</li> <li class=\"list-group-item\">collisionend</li> </td> <td><ul class=\"list-group\"> <li class=\"list-group-item\">triggerenter</li> <li class=\"list-group-item\">triggerleave</li> </td> </tr> <tr> <td><strong>Trigger Volume</strong></td> <td>-</td> <td><ul class=\"list-group\"> <li class=\"list-group-item\">triggerenter</li> <li class=\"list-group-item\">triggerleave</li> </td> <td>-</td> </tr> </table> </p>",
            "prototype": {
                "!proto": "pc.Component.prototype",
                "enabled": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.CollisionComponent.html#enabled",
                    "!doc": "Enables or disables the Component.",
                    "!type": "Boolean"
                },
                "type": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.CollisionComponent.html#type",
                    "!doc": "The type of the collision volume. Defaults to 'box'. Can be one of the following: <ul> <li><strong>box</strong>: A box-shaped collision volume.</li> <li><strong>sphere</strong>: A sphere-shaped collision volume.</li> <li><strong>capsulse</strong>: A capsule-shaped collision volume.</li> <li><strong>cylinder</strong>: A cylinder-shaped collision volume.</li> <li><strong>mesh</strong>: A collision volume that uses a model asset as its shape.</li> </ul>",
                    "!type": "string"
                },
                "halfExtents": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.CollisionComponent.html#halfExtents",
                    "!doc": "The half-extents of the box-shaped collision volume in the x, y and z axes. Defaults to [0.5, 0.5, 0.5]",
                    "!type": "+pc.Vec3"
                },
                "radius": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.CollisionComponent.html#radius",
                    "!doc": "The radius of the sphere, capsule or cylinder-shaped collision volumes. Defaults to 0.5",
                    "!type": "number"
                },
                "axis": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.CollisionComponent.html#axis",
                    "!doc": "The local space axis with which the capsule or cylinder-shaped collision volume's length is aligned. 0 for X, 1 for Y and 2 for Z. Defaults to 1 (Y-axis).",
                    "!type": "number"
                },
                "height": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.CollisionComponent.html#height",
                    "!doc": "The total height of the capsule or cylinder-shaped collision volume from tip to tip. Defaults to 2.",
                    "!type": "number"
                },
                "asset": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.CollisionComponent.html#asset",
                    "!doc": "The id of the asset for the model of the mesh collision volume.",
                    "!type": "number"
                },
                "model": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.CollisionComponent.html#model",
                    "!doc": "The model that is added to the scene graph for the mesh collision volume.",
                    "!type": "+pc.Model"
                }
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.CollisionComponent.html"
        },
        "CollisionComponentSystem": {
            "!type": "fn(app: +pc.Application)",
            "!doc": "Manages creation of pc.CollisionComponents.",
            "prototype": {
                "!proto": "pc.ComponentSystem.prototype",
                "setDebugRender": {
                    "!type": "fn(value: Boolean)",
                    "!doc": "Display collision shape outlines",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.CollisionComponentSystem.html#setDebugRender"
                }
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.CollisionComponentSystem.html"
        },
        "ParticleSystemComponent": {
            "!type": "fn(system: +pc.ParticleSystemComponent, entity: +pc.Entity)",
            "!doc": "Used to simulate particles and produce renderable particle mesh on either CPU or GPU. GPU simulation is generally much faster than its CPU counterpart, because it avoids slow CPU-GPU synchronization and takes advantage of many GPU cores. However, it requires client to support reasonable uniform count, reading from multiple textures in vertex shader and OES_texture_float extension, including rendering into float textures. Most mobile devices fail to satisfy these requirements, so it's not recommended to simulate thousands of particles on them. GPU version also can't sort particles, so enabling sorting forces CPU mode too. Particle rotation is specified by a single angle parameter: default billboard particles rotate around camera facing axis, while mesh particles rotate around 2 different view-independent axes. Most of the simulation parameters are specified with pc.Curve or pc.CurveSet. Curves are interpolated based on each particle's lifetime, therefore parameters are able to change over time. Most of the curve parameters can also be specified by 2 minimum/maximum curves, this way each particle will pick a random value in-between.",
            "prototype": {
                "!proto": "pc.Component.prototype",
                "enabled": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ParticleSystemComponent.html#enabled",
                    "!doc": "Enables or disables the Component.",
                    "!type": "Boolean"
                },
                "loop": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ParticleSystemComponent.html#loop",
                    "!doc": "Enables or disables respawning of particles.",
                    "!type": "Boolean"
                },
                "paused": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ParticleSystemComponent.html#paused",
                    "!doc": "Pauses or unpauses the simulation.",
                    "!type": "Boolean"
                },
                "preWarm": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ParticleSystemComponent.html#preWarm",
                    "!doc": "If enabled, the particle system will be initialized as though it had already completed a full cycle. This only works with looping particle systems.",
                    "!type": "Boolean"
                },
                "lighting": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ParticleSystemComponent.html#lighting",
                    "!doc": "If enabled, particles will be lit by ambient and directional lights.",
                    "!type": "Boolean"
                },
                "halfLambert": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ParticleSystemComponent.html#halfLambert",
                    "!doc": "Enabling Half Lambert lighting avoids particles looking too flat in shadowed areas. It is a completely non-physical lighting model but can give more pleasing visual results.",
                    "!type": "Boolean"
                },
                "alignToMotion": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ParticleSystemComponent.html#alignToMotion",
                    "!doc": "Orient particles in their direction of motion.",
                    "!type": "Boolean"
                },
                "depthWrite": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ParticleSystemComponent.html#depthWrite",
                    "!doc": "If enabled, the particles will write to the depth buffer. If disabled, the depth buffer is left unchanged and particles will be guaranteed to overwrite one another in the order in which they are rendered.",
                    "!type": "Boolean"
                },
                "numParticles": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ParticleSystemComponent.html#numParticles",
                    "!doc": "Maximum number of simulated particles.",
                    "!type": "number"
                },
                "rate": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ParticleSystemComponent.html#rate",
                    "!doc": "Minimal interval in seconds between particle births.",
                    "!type": "number"
                },
                "rate2": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ParticleSystemComponent.html#rate2",
                    "!doc": "Maximal interval in seconds between particle births.",
                    "!type": "number"
                },
                "startAngle": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ParticleSystemComponent.html#startAngle",
                    "!doc": "Minimal inital Euler angle of a particle.",
                    "!type": "number"
                },
                "startAngle2": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ParticleSystemComponent.html#startAngle2",
                    "!doc": "Maximal inital Euler angle of a particle.",
                    "!type": "number"
                },
                "lifetime": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ParticleSystemComponent.html#lifetime",
                    "!doc": "The length of time in seconds between a particle's birth and its death.",
                    "!type": "number"
                },
                "stretch": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ParticleSystemComponent.html#stretch",
                    "!doc": "A value in world units that controls the amount by which particles are stretched based on their velocity. Particles are stretched from their center towards their previous position.",
                    "!type": "number"
                },
                "intensity": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ParticleSystemComponent.html#intensity",
                    "!doc": "Color multiplier.",
                    "!type": "number"
                },
                "depthSoftening": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ParticleSystemComponent.html#depthSoftening",
                    "!doc": "Controls fading of particles near their intersections with scene geometry. This effect, when it's non-zero, requires scene depth map to be rendered. Multiple depth-dependent effects can share the same map, but if you only use it for particles, bear in mind that it can double engine draw calls.",
                    "!type": "number"
                },
                "initialVelocity": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ParticleSystemComponent.html#initialVelocity",
                    "!doc": "Defines magnitude of the initial emitter velocity. Direction is given by emitter shape.",
                    "!type": "number"
                },
                "emitterExtents": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ParticleSystemComponent.html#emitterExtents",
                    "!doc": "(Only for EMITTERSHAPE_BOX) The extents of a local space bounding box within which particles are spawned at random positions.",
                    "!type": "+pc.Vec3"
                },
                "emitterRadius": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ParticleSystemComponent.html#emitterRadius",
                    "!doc": "(Only for EMITTERSHAPE_SPHERE) The radius within which particles are spawned at random positions.",
                    "!type": "number"
                },
                "wrapBounds": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ParticleSystemComponent.html#wrapBounds",
                    "!doc": "The half extents of a world space box volume centered on the owner entity's position. If a particle crosses the boundary of one side of the volume, it teleports to the opposite side.",
                    "!type": "+pc.Vec3"
                },
                "colorMap": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ParticleSystemComponent.html#colorMap",
                    "!doc": "The color map texture to apply to all particles in the system. If no texture is assigned, a default spot texture is used.",
                    "!type": "+pc.Texture"
                },
                "normalMap": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ParticleSystemComponent.html#normalMap",
                    "!doc": "The normal map texture to apply to all particles in the system. If no texture is assigned, an approximate spherical normal is calculated for each vertex.",
                    "!type": "+pc.Texture"
                },
                "emitterShape": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ParticleSystemComponent.html#emitterShape",
                    "!doc": "Shape of the emitter. Defines the bounds inside which particles are spawned. Also affects the direction of initial velocity. <ul> <li><strong>pc.EMITTERSHAPE_BOX</strong>: Box shape parameterized by emitterExtents. Initial velocity is directed towards local Z axis.</li> <li><strong>pc.EMITTERSHAPE_SPHERE</strong>: Sphere shape parameterized by emitterRadius. Initial velocity is directed outwards from the center.</li> </ul>",
                    "!type": "+pc.EMITTERSHAPE"
                },
                "sort": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ParticleSystemComponent.html#sort",
                    "!doc": "Sorting mode. Forces CPU simulation, so be careful. <ul> <li><strong>pc.PARTICLESORT_NONE</strong>: No sorting, particles are drawn in arbitary order. Can be simulated on GPU.</li> <li><strong>pc.PARTICLESORT_DISTANCE</strong>: Sorting based on distance to the camera. CPU only.</li> <li><strong>pc.PARTICLESORT_NEWER_FIRST</strong>: Newer particles are drawn first. CPU only.</li> <li><strong>pc.PARTICLESORT_OLDER_FIRST</strong>: Older particles are drawn first. CPU only.</li> </ul>",
                    "!type": "+pc.PARTICLESORT"
                },
                "mesh": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ParticleSystemComponent.html#mesh",
                    "!doc": "Triangular mesh to be used as a particle. Only first vertex/index buffer is used. Vertex buffer must contain local position at first 3 floats of each vertex.",
                    "!type": "+pc.Mesh"
                },
                "blend": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ParticleSystemComponent.html#blend",
                    "!doc": "Blending mode.",
                    "!type": "+pc.BLEND"
                },
                "localVelocityGraph": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ParticleSystemComponent.html#localVelocityGraph",
                    "!doc": "Velocity relative to emitter over lifetime.",
                    "!type": "+pc.CurveSet"
                },
                "localVelocityGraph2": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ParticleSystemComponent.html#localVelocityGraph2",
                    "!doc": "If not null, particles pick random values between localVelocityGraph and localVelocityGraph2.",
                    "!type": "+pc.CurveSet"
                },
                "velocityGraph": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ParticleSystemComponent.html#velocityGraph",
                    "!doc": "World-space velocity over lifetime.",
                    "!type": "+pc.CurveSet"
                },
                "velocityGraph2": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ParticleSystemComponent.html#velocityGraph2",
                    "!doc": "If not null, particles pick random values between velocityGraph and velocityGraph2.",
                    "!type": "+pc.CurveSet"
                },
                "colorGraph": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ParticleSystemComponent.html#colorGraph",
                    "!doc": "Color over lifetime.",
                    "!type": "+pc.CurveSet"
                },
                "rotationSpeedGraph": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ParticleSystemComponent.html#rotationSpeedGraph",
                    "!doc": "Rotation speed over lifetime.",
                    "!type": "+pc.Curve"
                },
                "rotationSpeedGraph2": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ParticleSystemComponent.html#rotationSpeedGraph2",
                    "!doc": "If not null, particles pick random values between rotationSpeedGraph and rotationSpeedGraph2.",
                    "!type": "+pc.Curve"
                },
                "scaleGraph": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ParticleSystemComponent.html#scaleGraph",
                    "!doc": "Scale over lifetime.",
                    "!type": "+pc.Curve"
                },
                "scaleGraph2": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ParticleSystemComponent.html#scaleGraph2",
                    "!doc": "If not null, particles pick random values between scaleGraph and scaleGraph2.",
                    "!type": "+pc.Curve"
                },
                "alphaGraph": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ParticleSystemComponent.html#alphaGraph",
                    "!doc": "Alpha over lifetime.",
                    "!type": "+pc.Curve"
                },
                "alphaGraph2": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ParticleSystemComponent.html#alphaGraph2",
                    "!doc": "If not null, particles pick random values between alphaGraph and alphaGraph2.",
                    "!type": "+pc.Curve"
                },
                "reset": {
                    "!type": "fn()",
                    "!doc": "Resets particle state, doesn't affect playing.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ParticleSystemComponent.html#reset"
                },
                "stop": {
                    "!type": "fn()",
                    "!doc": "Disables the emission of new particles, lets existing to finish their simulation.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ParticleSystemComponent.html#stop"
                },
                "pause": {
                    "!type": "fn()",
                    "!doc": "Freezes the simulation.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ParticleSystemComponent.html#pause"
                },
                "unpause": {
                    "!type": "fn()",
                    "!doc": "Unfreezes the simulation.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ParticleSystemComponent.html#unpause"
                },
                "play": {
                    "!type": "fn()",
                    "!doc": "Enables/unfreezes the simulation.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ParticleSystemComponent.html#play"
                },
                "isPlaying": {
                    "!type": "fn()",
                    "!doc": "Checks if simulation is in progress.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ParticleSystemComponent.html#isPlaying"
                }
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ParticleSystemComponent.html"
        },
        "Entity": {
            "!type": "fn()",
            "!doc": "<p>The Entity is the core primitive of a PlayCanvas game. Each one contains a globally unique identifier (GUID) to distinguish it from other Entities, and associates it with tool-time data on the server. An object in your game consists of an pc.Entity, and a set of pc.Components which are managed by their respective pc.ComponentSystems.</p> <p> The Entity uniquely identifies the object and also provides a transform for position and orientation which it inherits from pc.GraphNode so can be added into the scene graph. The Component and ComponentSystem provide the logic to give an Entity a specific type of behaviour. e.g. the ability to render a model or play a sound. Components are specific to a instance of an Entity and are attached (e.g. `this.entity.model`) ComponentSystems allow access to all Entities and Components and are attached to the pc.Application. </p>",
            "prototype": {
                "!proto": "pc.GraphNode.prototype",
                "addComponent": {
                    "!type": "fn(type: string, data: object) -> +pc.Component",
                    "!doc": "Create a new {pc.Component} and add attach it to the Entity. Use this to add functionality to the Entity like rendering a model, adding light, etc.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Entity.html#addComponent"
                },
                "removeComponent": {
                    "!type": "fn(type: string)",
                    "!doc": "Remove a component from the Entity.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Entity.html#removeComponent"
                },
                "getGuid": {
                    "!type": "fn() -> string",
                    "!doc": "Get the GUID value for this Entity",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Entity.html#getGuid"
                },
                "setGuid": {
                    "!type": "fn(guid: string)",
                    "!doc": "Set the GUID value for this Entity.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Entity.html#setGuid"
                },
                "findByGuid": {
                    "!type": "fn() -> +pc.Entity",
                    "!doc": "Find a descendant of this Entity with the GUID",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Entity.html#findByGuid"
                },
                "destroy": {
                    "!type": "fn()",
                    "!doc": "Remove all components from the Entity and detach it from the Entity hierarchy. Then recursively destroy all ancestor Entities",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Entity.html#destroy"
                },
                "clone": {
                    "!type": "fn() -> +pc.Entity",
                    "!doc": "Create a deep copy of the Entity. Duplicate the full Entity hierarchy, with all Components and all descendants. Note, this Entity is not in the hierarchy and must be added manually.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Entity.html#clone"
                }
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Entity.html"
        },
        "ResourceLoader": {
            "!type": "fn()",
            "!doc": "Load resource data, potentially from remote sources. Caches resource on load to prevent multiple requests Add ResourceHandlers to handle different types of resources",
            "prototype": {
                "addHandler": {
                    "!type": "fn(type: string, handler: +pc.ResourceHandler)",
                    "!doc": "Add a handler for a resource type. Handler should support: load(url, callback) and open(url, data). Handlers can optionally support patch(asset, assets) to handle dependencies on other assets",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ResourceLoader.html#addHandler"
                },
                "load": {
                    "!type": "fn(url: string, type: string, callback: fn())",
                    "!doc": "Make a request for a resource from a remote URL. Parse the returned data using the handler for the specified type When loaded and parsed use the callback to return an instance of the resource. Handles multiple requests for",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ResourceLoader.html#load"
                },
                "open": {
                    "!type": "fn()",
                    "!doc": "Convert raw resource data into a resource instance. e.g. take 3D model format JSON and return a pc.Model.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ResourceLoader.html#open"
                },
                "patch": {
                    "!type": "fn()",
                    "!doc": "Perform any operations on a resource, that requires a dependency on it's asset data or any other asset data",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ResourceLoader.html#patch"
                },
                "getFromCache": {
                    "!type": "fn()",
                    "!doc": "Check cache for resource from a URL. If present return the cached value",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ResourceLoader.html#getFromCache"
                },
                "destroy": {
                    "!type": "fn()",
                    "!doc": "Destroys resource loader",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ResourceLoader.html#destroy"
                }
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ResourceLoader.html"
        },
        "ModelHandler": {
            "!type": "fn(device: +pc.GraphicsDevice)",
            "!doc": "Resource Handler for creating pc.Model resources",
            "prototype": {
                "load": {
                    "!type": "fn()",
                    "!doc": "Fetch model data from a remote url",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ModelHandler.html#load"
                },
                "open": {
                    "!type": "fn(data: object)",
                    "!doc": "Process data in deserialized format into a pc.Model object",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ModelHandler.html#open"
                }
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.ModelHandler.html"
        },
        "ScriptHandler": {
            "!type": "fn(app: +pc.Application)",
            "!doc": "ResourceHandler for loading javascript files dynamically Two types of javascript file can be loaded, PlayCanvas ScriptType files which must contain a call to pc.script.create() to be called when the script executes, or regular javascript files, such as third-party libraries.",
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.html#ScriptHandler"
        },
        "Asset": {
            "!type": "fn(name: string, type: string, file: object, data?: object)",
            "!doc": "An asset record of a file or data resource that can be loaded by the engine. The asset contains three important fields:",
            "prototype": {
                "name": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Asset.html#name",
                    "!doc": "The name of the asset",
                    "!type": "string"
                },
                "type": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Asset.html#type",
                    "!doc": "The type of the asset. One of [\"animation\", \"audio\", \"image\", \"json\", \"material\", \"model\", \"text\", \"texture\"]",
                    "!type": "string"
                },
                "file?": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Asset.html#file?",
                    "!doc": "le details or null if no file",
                    "!type": "object"
                },
                "data?": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Asset.html#data?",
                    "!doc": "ata that contains either the complete resource data (e.g. in the case of a material) or additional data (e.g. in the case of a model it contains mappings from mesh to material)",
                    "!type": "object"
                },
                "resource?": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Asset.html#resource?",
                    "!doc": "e to the resource when the asset is loaded. e.g. a pc.Texture or a pc.Model",
                    "!type": "object"
                },
                "preload?": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Asset.html#preload?",
                    "!doc": "he asset will be loaded during the preload phase of application set up.",
                    "!type": "Boolean"
                },
                "loaded?": {
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Asset.html#loaded?",
                    "!doc": "the resource is loaded e.g. if asset.resource is not null",
                    "!type": "Boolean"
                },
                "getFileUrl": {
                    "!type": "fn() -> string",
                    "!doc": "Return the URL required to fetch the file for this asset.",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Asset.html#getFileUrl"
                },
                "ready": {
                    "!type": "fn(callback: fn())",
                    "!doc": "Take a callback which is called as soon as the asset is loaded. If the asset is already loaded the callback is called straight away",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Asset.html#ready"
                },
                "unload": {
                    "!type": "fn()",
                    "!doc": "Mark asset as unloaded and delte reference to resource",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Asset.html#unload"
                }
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.Asset.html"
        },
        "AssetRegistry": {
            "!type": "fn(loader: +pc.ResourceLoader)",
            "!doc": "Container for all assets that are available to this application",
            "prototype": {
                "list": {
                    "!type": "fn(filters: object)",
                    "!doc": "Create a filtered list of assets from the registry",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.AssetRegistry.html#list"
                },
                "add": {
                    "!type": "fn(asset: +pc.Asset)",
                    "!doc": "Add an asset to the registry",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.AssetRegistry.html#add"
                },
                "remove": {
                    "!type": "fn(asset: +pc.Asset)",
                    "!doc": "Remove an asset from the registry",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.AssetRegistry.html#remove"
                },
                "get": {
                    "!type": "fn(id: int)",
                    "!doc": "Retrieve an asset from the registry by its id field",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.AssetRegistry.html#get"
                },
                "getByUrl": {
                    "!type": "fn(url: string)",
                    "!doc": "Retrieve an asset from the registry by it's file's URL field",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.AssetRegistry.html#getByUrl"
                },
                "load": {
                    "!type": "fn(asset: +pc.Asset)",
                    "!doc": "Load the asset's file from a remote source. Listen for \"load\" events on the asset to find out when it is loaded",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.AssetRegistry.html#load"
                },
                "loadFromUrl": {
                    "!type": "fn(url: string, type: string, callback: fn())",
                    "!doc": "Use this to load and create an asset if you don't have assets created. Usually you would only use this if you are not integrated with the PlayCanvas Editor",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.AssetRegistry.html#loadFromUrl"
                },
                "findAll": {
                    "!type": "fn(name: string, type?: string) -> [+pc.Asset]",
                    "!doc": "Return all Assets with the specified name and type found in the registry",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.AssetRegistry.html#findAll"
                },
                "filter": {
                    "!type": "fn(callback: fn()) -> [+pc.Asset]",
                    "!doc": "Return all Assets that satisfy filter callback",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.AssetRegistry.html#filter"
                },
                "find": {
                    "!type": "fn(name: string, type?: string) -> +pc.Asset",
                    "!doc": "Return the first Asset with the specified name and type found in the registry",
                    "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.AssetRegistry.html#find"
                }
            },
            "!url": "http://developer.playcanvas.com/en/engine/api/stable/symbols/pc.AssetRegistry.html"
        }
    },
    "extendsFrom": {
        "!type": "fn()",
        "!doc": "Implementaton of inheritance for Javascript objects\ne.g. Class can access all of Base's function prototypes\n<pre lang=\"javascript\"><code>\nBase = function () {}\nClass = function () {}\nClass = Class.extendsFrom(Base)\n</code></pre>"
    },
    "Box": {
        "!type": "fn(transform: +pc.Mat4, halfExtents: +pc.Vec3)",
        "!doc": ""
    },
    "containsPoint": {
        "!type": "fn(point: +pc.Vec3) -> Boolean",
        "!doc": "Tests whether a point is inside the plane."
    },
    "getHalfExtents": {
        "!type": "fn()",
        "!doc": "Get the half extents as Vec3 [x,y,z]"
    },
    "Torus": {
        "!type": "fn(transform: object, iradius: object, oradius: object)",
        "!doc": ""
    },
    "Sphere": {
        "!type": "fn(center: +pc.Vec3, radius: number)",
        "!doc": "Create a new Sphere shape"
    },
    "Plane": {
        "!type": "fn()",
        "!doc": ""
    }
}
    editor.method('tern-pc', function () {
        return def;
    });
});