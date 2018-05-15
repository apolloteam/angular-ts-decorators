'use strict';
import angular from 'angular';
import 'reflect-metadata';

/**
 * When targeting es5, name doesn't exist on Function interface
 * https://github.com/Microsoft/TypeScript/issues/2076
 */
declare global {
  interface Function {
    readonly name: string;
  }
}

enum Declarations { component, directive, pipe }

const typeSymbol: string = 'custom:type';
const nameSymbol: string = 'custom:name';
const bindingsSymbol: string = 'custom:bindings';
const optionsSymbol: string = 'custom:options';

/**
 * ModuleConfig
 * @export
 */
export interface ModuleConfig {
  declarations: Array<angular.IComponentController | angular.Injectable<angular.IDirectiveFactory> | PipeTransform>;
  imports?: Array<string | Function>;
  exports?: Array<Function>;
  providers?: Array<angular.IServiceProvider | angular.Injectable<Function>>;
  constants?: Object;
  decorators?: { [name: string]: angular.Injectable<Function> };
}

/**
 * ModuleDecoratedConstructor
 * @export
 */
export interface ModuleDecoratedConstructor {
  new(...args: Array<any>): ModuleDecorated;
  module?: angular.IModule;
}

/**
 * ModuleDecorated
 * @export
 */
export interface ModuleDecorated {
  config?(...args: Array<any>): void;
  run?(...args: Array<any>): void;
}

/**
 * ComponentOptionsDecorated
 * @export
 */
export interface ComponentOptionsDecorated {
  selector: string;

  /**
   * HTML markup.
   * Replace the contents of the directive's element.
   * @memberof ComponentOptionsDecorated
   */
  template?: string | angular.Injectable<(...args: Array<any>) => string>;

  /**
   * This is similar to template but the template is loaded from the specified URL, asynchronously.
   * @memberof ComponentOptionsDecorated
   */
  templateUrl?: string | angular.Injectable<(...args: Array<any>) => string>;
  transclude?: boolean | { [slot: string]: string };
  require?: { [controller: string]: string };
  controllerAs?: string;
  styleUrls?: string | string[];

  styles?: string | string[];
}

/**
 * DirectiveOptionsDecorated
 * @export
 */
export interface DirectiveOptionsDecorated {
  selector: string;
  /**
   * When this property is set to true (default is false), the HTML compiler will collect 
   * DOM nodes between nodes with the attributes directive-name-start and directive-name-end, 
   * and group them together as the directive elements. It is recommended that this feature 
   * be used on directives which are not strictly behavioral (such as ngClick), 
   * and which do not manipulate or replace child nodes (such as ngInclude).
   */
  multiElement?: boolean;

  /**
   * When there are multiple directives defined on a single DOM element, sometimes it 
   * is necessary to specify the order in which the directives are applied. 
   * The priority is used to sort the directives before their compile functions get called. 
   * Priority is defined as a number. Directives with greater numerical priority are compiled first. 
   * Pre-link functions are also run in priority order, but post-link functions are run in reverse order. 
   * The order of directives with the same priority is undefined. The default priority is 0.      
   */
  priority?: number;
  require?: string | string[] | { [controller: string]: string };
  scope?: boolean | { [boundProperty: string]: string };
  template?: string | ((tElement: JQuery, tAttrs: angular.IAttributes) => string);
  templateNamespace?: string;
  templateUrl?: string | ((tElement: JQuery, tAttrs: angular.IAttributes) => string);
  terminal?: boolean;
  transclude?: boolean | 'element' | { [slot: string]: string };
  controllerAs?: string;
  bindToController?: boolean;
  restrict?: string;
}

/**
 * DirectiveControllerConstructor
 * @export
 */
export interface DirectiveControllerConstructor {
  new(...args: Array<any>): DirectiveController;
}

/**
 * DirectiveController
 * @export
 */
export interface DirectiveController {
  compile?: angular.IDirectiveCompileFn;
  link?: angular.IDirectiveLinkFn | angular.IDirectivePrePost;
}

/**
 * PipeTransformConstructor
 * @export
 */
export interface PipeTransformConstructor {
  new(...args: Array<any>): PipeTransform;
}

/**
 * PipeTransform
 * @export
 */
export interface PipeTransform {
  transform(...args: Array<any>): any;
}

/**
 * NgModule
 * @export
 */
export function NgModule(moduleConfig: ModuleConfig) {
  return (Class: ModuleDecoratedConstructor) => {
    const { declarations, imports, providers } = moduleConfig;

    // module registration
    const deps: string[] = imports ? imports.map(mod => typeof mod === 'string' ? mod : mod.name) : [];
    const module: angular.IModule = angular.module(Class.name, deps);

    // components, directives and filters registration
    declarations.forEach((declaration: any) => {
      const declarationType = getDeclarationType(declaration);
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
          console && console.error(
            `Can't find type metadata on ${declaration.name} declaration, did you forget to decorate it?
            Decorate your declarations using @Component, @Directive or @Pipe decorator.`
          );
      }
    });

    // services registration
    if (providers) {
      registerServices(module, providers);
    }

    // config and run blocks registration
    const { config, run } = Class.prototype;
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

/**
 * Component
 * @export
 */
export function Component(decoratedOptions: ComponentOptionsDecorated) {


  return (ctrl: angular.IControllerConstructor) => {
    const options: angular.IComponentOptions = <angular.IComponentOptions>{ ...decoratedOptions };
    options.controller = ctrl;
    options['$inject'] = annotate(ctrl);
    const bindings = Reflect.getMetadata(bindingsSymbol, ctrl);
    if (bindings) {
      options.bindings = bindings;
    }

    Reflect.defineMetadata(nameSymbol, decoratedOptions.selector, ctrl);
    Reflect.defineMetadata(typeSymbol, Declarations.component, ctrl);
    Reflect.defineMetadata(optionsSymbol, options, ctrl);
  };
}

/**
 * Directive
 * @export
 */
export function Directive(decoratedOptions: DirectiveOptionsDecorated) {
  return (controller: DirectiveControllerConstructor) => {
    const options: angular.IDirective = <angular.IDirective>{ ...decoratedOptions };

    // 
    //// deprecate restrict for directives and force attribute usage only.
    options.restrict = options.restrict || 'A';
    const bindings = Reflect.getMetadata(bindingsSymbol, controller);
    if (bindings) {
      options.scope = bindings;
      console && console.warn(`Using scope with directives is deprecated, you should consider writing it as a component.
      See: https://github.com/toddmotto/angular-styleguide#recommended-properties`);
    }

    let selector: string = decoratedOptions.selector;
    if (!selector.length) {
      selector = controller.name;
    }

    Reflect.defineMetadata(nameSymbol, selector, controller);
    Reflect.defineMetadata(typeSymbol, Declarations.directive, controller);
    Reflect.defineMetadata(optionsSymbol, options, controller);
  };
}

/**
 * Input
 * @export
 */
export function Input(alias?: string) {
  return (target: Object, key: string) => addBindingToMetadata(target, key, '<', alias);
}

/**
 * Output
 * @export
 */
export function Output(alias?: string) {
  return (target: Object, key: string) => addBindingToMetadata(target, key, '&', alias);
}

/**
 * Injectable
 * @export
 */
export function Injectable(name?: string) {
  return (Class: any) => {
    name = name || Class.name;
    Reflect.defineMetadata(nameSymbol, name, Class);
  };
}

/**
 * Pipe
 * @export
 */
export function Pipe(options: { name: string }) {
  return (Class: PipeTransformConstructor) => {
    Reflect.defineMetadata(nameSymbol, options.name, Class);
    Reflect.defineMetadata(typeSymbol, Declarations.pipe, Class);
  };
}

/**
 * registerComponent
 * @private
 */
function registerComponent(module: angular.IModule, component: angular.IComponentController) {
  const { name, options } = getComponentMetadata(component);
  const { styles, styleUrls, controller } = options;
  const head: HTMLHeadElement = document.getElementsByTagName('head')[0];
  // const dataAttr: string = 'data-ts-decorator-css';
  const dataAttr: string = 'ts-decorator-css';
  if (angular.isDefined(styles)) {
    const stylesArr: string[] = angular.isArray(styles) ? styles : [styles];
    const newStyle: string = stylesArr.reduce((a: string, b: string) => a + b);
    if (newStyle.length) {
      const styleTags: NodeListOf<HTMLStyleElement> = head.getElementsByTagName('style')
      const existingStyles = filter(styleTags, (link) => angular.element(link).data(dataAttr) === controller.name);
      if (!existingStyles.length) {
        const style: HTMLStyleElement = document.createElement('style');
        style.type = 'text/css';
        style.media = 'all'

        // style.setAttribute(dataAttr, controller.name);
        angular.element(style).data(dataAttr, controller.name);
        style.innerHTML = newStyle;
        head.appendChild(style);
      }
    }
  }

  if (angular.isDefined(styleUrls)) {
    const styleUrlsArr: string[] = angular.isArray(styleUrls) ? styleUrls : [styleUrls];
    const uniq: { [key: string]: number } = {};
    styleUrlsArr.filter((item) => {
      let ret: boolean;
      if (!angular.isDefined(uniq[item])) {
        uniq[item] = 1;
      } else {
        uniq[item] += 1;
      }

      return uniq[item] === 1;
    }).forEach((url: string) => {
      const existingLinks: NodeListOf<HTMLLinkElement> = findExistingCSS(head, url);
      if (!existingLinks.length) {
        const link = document.createElement('link');
        link.type = 'text/css';
        link.rel = 'stylesheet';
        link.media = 'only x';
        link.href = url;
        link.onload = () => link.media = 'all';

        // link.setAttribute('data-ts-decorator-css', controller.name);
        angular.element(link).data(dataAttr, controller.name);
        head.appendChild(link);
      }
    });

    Object.keys(uniq).forEach((key) => {
      if (uniq[key] > 1) {
        console && console.warn(
          'Attempt to load the %o file %o times from the %o component.',
          key,
          uniq[key],
          controller.name);
      }
    });
  }

  module.component(name, options);
}

function findExistingCSS(head: HTMLHeadElement, url: string): NodeListOf<HTMLLinkElement> {
  // Search for existing link to reload
  const links: NodeListOf<HTMLLinkElement> = head.getElementsByTagName('link');
  return <any>filter(links, (link) => link.href === url);
}

/**
 * registerDirective
 * @private
 */
function registerDirective(module: angular.IModule, ctrl: DirectiveControllerConstructor) {
  const { name, options } = getComponentMetadata(ctrl);
  const { compile, link } = ctrl.prototype;
  const isValid = compile && typeof compile === 'function' || link && typeof link === 'function';
  if (isValid) {
    const directiveFunc = (...args: Array<any>) => {
      // const instance = new ctrl(args);
      const instance = new (ctrl.bind.apply(ctrl, [null].concat(args)))();
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
  } else {
    console && console.error(`Directive ${ctrl.name} was not registered because no link or compile methods were provided`);
  }
}

/**
 * registerPipe
 * @private
 */
function registerPipe(module: angular.IModule, filter: PipeTransformConstructor) {
  const { name } = getNameMetadata(filter);
  const filterFunc = (...args: Array<any>) => {
    const instance = new filter(args);
    return instance.transform.bind(instance);
  };
  filterFunc.$inject = filter.$inject || annotate(filter);
  module.filter(name, filterFunc);
}

/**
 * registerServices
 * @private
 */
function registerServices(module: angular.IModule, services: Array<angular.IServiceProvider | angular.Injectable<Function>>) {
  services.forEach((service: any) => {
    const { name } = getNameMetadata(service);
    service.$inject = service.$inject || annotate(service);
    if (service.prototype.$get) {
      module.provider(name, service);
    } else {
      module.service(name, service);
    }
  });
}

/**
 * getComponentMetadata
 * @private
 */
function getComponentMetadata(component: angular.IComponentController) {
  return {
    name: Reflect.getMetadata(nameSymbol, component),
    options: Reflect.getMetadata(optionsSymbol, component)
  };
}

/**
 * getNameMetadata
 * @private
 */
function getNameMetadata(service: any) {
  return {
    name: Reflect.getMetadata(nameSymbol, service)
  };
}

/**
 * getDeclarationType
 * @private
 */
function getDeclarationType(declaration: any) {
  return Reflect.getMetadata(typeSymbol, declaration);
}

/**
 * addBindingToMetadata
 * @private
 */
function addBindingToMetadata(target: Object, key: string, direction: string, alias?: string) {
  const targetConstructor = target.constructor;
  const bindings = Reflect.getMetadata(bindingsSymbol, targetConstructor) || {};
  bindings[key] = alias || direction;
  Reflect.defineMetadata(bindingsSymbol, bindings, targetConstructor);
}

/**
 * annotate
 * @private
 * @param {any} func Function to annotate.
 */
function annotate(func: any) {
  return angular.injector().annotate(func);
}

// Because IE8?
function filter(arrayLike, func) {
  var arr = []
  forEach(arrayLike, function (item) {
    if (func(item))
      arr.push(item);
  });
  return arr;
}

// Because IE8?
function forEach(arrayLike, func) {
  for (var i = 0; i < arrayLike.length; i++) {
    func(arrayLike[i])
  }
}
