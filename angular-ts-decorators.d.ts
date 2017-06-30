/// <reference types="angular" />
import * as angular from 'angular';
import 'reflect-metadata';
/**
 * When targeting es5, name doesn't exist on Function interface
 * https://github.com/Microsoft/TypeScript/issues/2076
 */
declare global  {
    interface Function {
        readonly name: string;
    }
}
/**
 * ModuleConfig
 * @export
 */
export interface ModuleConfig {
    declarations: Array<ng.IComponentController | ng.Injectable<ng.IDirectiveFactory> | PipeTransform>;
    imports?: Array<string | Function>;
    exports?: Array<Function>;
    providers?: Array<ng.IServiceProvider | ng.Injectable<Function>>;
    constants?: Object;
    decorators?: {
        [name: string]: ng.Injectable<Function>;
    };
}
/**
 * ModuleDecoratedConstructor
 * @export
 */
export interface ModuleDecoratedConstructor {
    new (...args: Array<any>): ModuleDecorated;
    module?: ng.IModule;
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
    template?: string | ng.Injectable<(...args: Array<any>) => string>;
    templateUrl?: string | ng.Injectable<(...args: Array<any>) => string>;
    transclude?: boolean | {
        [slot: string]: string;
    };
    require?: {
        [controller: string]: string;
    };
    controllerAs?: string;
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
    require?: string | string[] | {
        [controller: string]: string;
    };
    scope?: boolean | {
        [boundProperty: string]: string;
    };
    template?: string | ((tElement: JQuery, tAttrs: ng.IAttributes) => string);
    templateNamespace?: string;
    templateUrl?: string | ((tElement: JQuery, tAttrs: ng.IAttributes) => string);
    terminal?: boolean;
    transclude?: boolean | 'element' | {
        [slot: string]: string;
    };
    controllerAs?: string;
    bindToController?: boolean;
    restrict?: string;
}
/**
 * DirectiveControllerConstructor
 * @export
 */
export interface DirectiveControllerConstructor {
    new (...args: Array<any>): DirectiveController;
}
/**
 * DirectiveController
 * @export
 */
export interface DirectiveController {
    compile?: ng.IDirectiveCompileFn;
    link?: ng.IDirectiveLinkFn | ng.IDirectivePrePost;
}
/**
 * PipeTransformConstructor
 * @export
 */
export interface PipeTransformConstructor {
    new (...args: Array<any>): PipeTransform;
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
export declare function NgModule({declarations, imports, providers}: ModuleConfig): (Class: ModuleDecoratedConstructor) => void;
/**
 * Component
 * @export
 */
export declare function Component(decoratedOptions: ComponentOptionsDecorated): (ctrl: angular.IControllerConstructor) => void;
/**
 * Directive
 * @export
 */
export declare function Directive(decoratedOptions: DirectiveOptionsDecorated): (controller: DirectiveControllerConstructor) => void;
/**
 * Input
 * @export
 */
export declare function Input(alias?: string): (target: Object, key: string) => void;
/**
 * Output
 * @export
 */
export declare function Output(alias?: string): (target: Object, key: string) => void;
/**
 * Injectable
 * @export
 */
export declare function Injectable(name?: string): (Class: any) => void;
/**
 * Pipe
 * @export
 */
export declare function Pipe(options: {
    name: string;
}): (Class: PipeTransformConstructor) => void;
