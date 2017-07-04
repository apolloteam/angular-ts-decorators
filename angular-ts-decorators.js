System.register(["angular", "reflect-metadata"], function (exports_1, context_1) {
    'use strict';
    var __moduleName = context_1 && context_1.id;
    /**
     * NgModule
     * @export
     */
    function NgModule(_a) {
        var declarations = _a.declarations, imports = _a.imports, providers = _a.providers;
        return function (Class) {
            // module registration
            var deps = imports ? imports.map(function (mod) { return typeof mod === 'string' ? mod : mod.name; }) : [];
            var module = angular_1.default.module(Class.name, deps);
            // components, directives and filters registration
            declarations.forEach(function (declaration) {
                var declarationType = getDeclarationType(declaration);
                switch (declarationType) {
                    case Declarations.component:
                        registerComponent(module, declaration);
                        break;
                    case Declarations.directive:
                        registerDirective(module, declaration);
                        break;
                    case Declarations.pipe:
                        registerPipe(module, declaration);
                        break;
                    default:
                        console && console.error("Can't find type metadata on " + declaration.name + " declaration, did you forget to decorate it?\n            Decorate your declarations using @Component, @Directive or @Pipe decorator.");
                }
            });
            // services registration
            if (providers) {
                registerServices(module, providers);
            }
            // config and run blocks registration
            var _a = Class.prototype, config = _a.config, run = _a.run;
            if (config) {
                config.$inject = annotate(config);
                module.config(config);
            }
            if (run) {
                run.$inject = annotate(run);
                module.run(run);
            }
            // expose angular module as static property
            Class.module = module;
        };
    }
    exports_1("NgModule", NgModule);
    /**
     * Component
     * @export
     */
    function Component(decoratedOptions) {
        return function (ctrl) {
            var options = __assign({}, decoratedOptions);
            options.controller = ctrl;
            options['$inject'] = annotate(ctrl);
            var bindings = Reflect.getMetadata(bindingsSymbol, ctrl);
            if (bindings) {
                options.bindings = bindings;
            }
            Reflect.defineMetadata(nameSymbol, decoratedOptions.selector, ctrl);
            Reflect.defineMetadata(typeSymbol, Declarations.component, ctrl);
            Reflect.defineMetadata(optionsSymbol, options, ctrl);
        };
    }
    exports_1("Component", Component);
    /**
     * Directive
     * @export
     */
    function Directive(decoratedOptions) {
        return function (controller) {
            var options = __assign({}, decoratedOptions);
            // 
            //// deprecate restrict for directives and force attribute usage only.
            options.restrict = options.restrict || 'A';
            var bindings = Reflect.getMetadata(bindingsSymbol, controller);
            if (bindings) {
                options.scope = bindings;
                console && console.warn("Using scope with directives is deprecated, you should consider writing it as a component.\n      See: https://github.com/toddmotto/angular-styleguide#recommended-properties");
            }
            var selector = decoratedOptions.selector;
            if (!selector.length) {
                selector = controller.name;
            }
            Reflect.defineMetadata(nameSymbol, selector, controller);
            Reflect.defineMetadata(typeSymbol, Declarations.directive, controller);
            Reflect.defineMetadata(optionsSymbol, options, controller);
        };
    }
    exports_1("Directive", Directive);
    /**
     * Input
     * @export
     */
    function Input(alias) {
        return function (target, key) { return addBindingToMetadata(target, key, '<', alias); };
    }
    exports_1("Input", Input);
    /**
     * Output
     * @export
     */
    function Output(alias) {
        return function (target, key) { return addBindingToMetadata(target, key, '&', alias); };
    }
    exports_1("Output", Output);
    /**
     * Injectable
     * @export
     */
    function Injectable(name) {
        return function (Class) {
            name = name || Class.name;
            Reflect.defineMetadata(nameSymbol, name, Class);
        };
    }
    exports_1("Injectable", Injectable);
    /**
     * Pipe
     * @export
     */
    function Pipe(options) {
        return function (Class) {
            Reflect.defineMetadata(nameSymbol, options.name, Class);
            Reflect.defineMetadata(typeSymbol, Declarations.pipe, Class);
        };
    }
    exports_1("Pipe", Pipe);
    /**
     * registerComponent
     * @private
     */
    function registerComponent(module, component) {
        var _a = getComponentMetadata(component), name = _a.name, options = _a.options;
        module.component(name, options);
    }
    /**
     * registerDirective
     * @private
     */
    function registerDirective(module, ctrl) {
        var _a = getComponentMetadata(ctrl), name = _a.name, options = _a.options;
        var _b = ctrl.prototype, compile = _b.compile, link = _b.link;
        var isValid = compile && typeof compile === 'function' || link && typeof link === 'function';
        if (isValid) {
            var directiveFunc = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                // const instance = new ctrl(args);
                var instance = new (ctrl.bind.apply(ctrl, [null].concat(args)))();
                if (compile) {
                    options.compile = compile.bind(instance);
                }
                else if (link) {
                    options.link = link.bind(instance);
                }
                return options;
            };
            directiveFunc.$inject = directiveFunc.$inject || annotate(ctrl);
            module.directive(name, directiveFunc);
        }
        else {
            console && console.error("Directive " + ctrl.name + " was not registered because no link or compile methods were provided");
        }
    }
    /**
     * registerPipe
     * @private
     */
    function registerPipe(module, filter) {
        var name = getNameMetadata(filter).name;
        var filterFunc = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var instance = new filter(args);
            return instance.transform.bind(instance);
        };
        filterFunc.$inject = filter.$inject || annotate(filter);
        module.filter(name, filterFunc);
    }
    /**
     * registerServices
     * @private
     */
    function registerServices(module, services) {
        services.forEach(function (service) {
            var name = getNameMetadata(service).name;
            service.$inject = service.$inject || annotate(service);
            if (service.prototype.$get) {
                module.provider(name, service);
            }
            else {
                module.service(name, service);
            }
        });
    }
    /**
     * getComponentMetadata
     * @private
     */
    function getComponentMetadata(component) {
        return {
            name: Reflect.getMetadata(nameSymbol, component),
            options: Reflect.getMetadata(optionsSymbol, component)
        };
    }
    /**
     * getNameMetadata
     * @private
     */
    function getNameMetadata(service) {
        return {
            name: Reflect.getMetadata(nameSymbol, service)
        };
    }
    /**
     * getDeclarationType
     * @private
     */
    function getDeclarationType(declaration) {
        return Reflect.getMetadata(typeSymbol, declaration);
    }
    /**
     * addBindingToMetadata
     * @private
     */
    function addBindingToMetadata(target, key, direction, alias) {
        var targetConstructor = target.constructor;
        var bindings = Reflect.getMetadata(bindingsSymbol, targetConstructor) || {};
        bindings[key] = alias || direction;
        Reflect.defineMetadata(bindingsSymbol, bindings, targetConstructor);
    }
    /**
     * annotate
     * @private
     * @param {any} func Function to annotate.
     */
    function annotate(func) {
        return angular_1.default.injector().annotate(func);
    }
    var angular_1, Declarations, typeSymbol, nameSymbol, bindingsSymbol, optionsSymbol;
    return {
        setters: [
            function (angular_1_1) {
                angular_1 = angular_1_1;
            },
            function (_1) {
            }
        ],
        execute: function () {
            (function (Declarations) {
                Declarations[Declarations["component"] = 0] = "component";
                Declarations[Declarations["directive"] = 1] = "directive";
                Declarations[Declarations["pipe"] = 2] = "pipe";
            })(Declarations || (Declarations = {}));
            typeSymbol = 'custom:type';
            nameSymbol = 'custom:name';
            bindingsSymbol = 'custom:bindings';
            optionsSymbol = 'custom:options';
        }
    };
});
//# sourceMappingURL=angular-ts-decorators.js.map