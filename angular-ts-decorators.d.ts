/// <reference types="angular" />
/// <reference types="jquery" />
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
 * Interfaces
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
export interface ModuleDecoratedConstructor {
    new (...args: Array<any>): ModuleDecorated;
    module?: ng.IModule;
}
export interface ModuleDecorated {
    config?(...args: Array<any>): void;
    run?(...args: Array<any>): void;
}
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
export interface DirectiveOptionsDecorated {
    selector: string;
    multiElement?: boolean;
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
}
export interface DirectiveControllerConstructor {
    new (...args: Array<any>): DirectiveController;
}
export interface DirectiveController {
    compile?: ng.IDirectiveCompileFn;
    link?: ng.IDirectiveLinkFn | ng.IDirectivePrePost;
}
export interface PipeTransformConstructor {
    new (...args: Array<any>): PipeTransform;
}
export interface PipeTransform {
    transform(...args: Array<any>): any;
}
/**
 * Decorators
 */
export declare function NgModule({declarations, imports, providers}: ModuleConfig): (Class: ModuleDecoratedConstructor) => void;
export declare function Component(decoratedOptions: ComponentOptionsDecorated): (ctrl: angular.IControllerConstructor) => void;
export declare function Directive(decoratedOptions: DirectiveOptionsDecorated): (controller: DirectiveControllerConstructor) => void;
export declare function Input(alias?: string): (target: Object, key: string) => void;
export declare function Output(alias?: string): (target: Object, key: string) => void;
export declare function Injectable(name?: string): (Class: any) => void;
export declare function Pipe(options: {
    name: string;
}): (Class: PipeTransformConstructor) => void;
